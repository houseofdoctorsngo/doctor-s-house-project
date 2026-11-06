// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;');
  const migration = await readFile(new URL('../../supabase/production.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  // Verify the setup can be reapplied without destroying existing schema.
  await db.exec(migration);
}, 60000);
afterAll(async () => { await db?.close(); });

async function asRole(role: 'anon' | 'authenticated' | 'service_role', sql: string, values: unknown[] = []) {
  await db.exec(`SET ROLE ${role}`);
  try { return await db.query(sql, values); } finally { await db.exec('RESET ROLE'); }
}
async function permit(phone = '9876543210', requestId = randomUUID()) {
  const token = randomUUID();
  await db.query('INSERT INTO submission_permits(id, request_id, payload) VALUES ($1, $2, $3)', [token, requestId, JSON.stringify({ name: 'Test Person', phone, village: 'Udaipur', assistance_type: 'Medicines' })]);
  return { token, requestId, phone };
}
const insert = 'INSERT INTO assistance_requests(id, name, phone, village, assistance_type, submission_token) VALUES ($1, $2, $3, $4, $5, $6)';
async function submit(value: Awaited<ReturnType<typeof permit>>) {
  return asRole('anon', insert, [value.requestId, 'Test Person', value.phone, 'Udaipur', 'Medicines', value.token]);
}

describe('Database permissions and validation', () => {
  it('allows only verified insert-only assistance submissions', async () => {
    const value = await permit();
    await submit(value);
    const result = await db.query<{ status: string; submission_token: null; staff_notes: null }>('SELECT status,submission_token,staff_notes FROM assistance_requests WHERE id=$1', [value.requestId]);
    expect(result.rows[0]).toEqual({ status: 'new', submission_token: null, staff_notes: null });
    expect((await db.query('SELECT id FROM submission_permits WHERE id=$1', [value.token])).rows).toHaveLength(0);
    for (const role of ['anon', 'authenticated'] as const) {
      await expect(asRole(role, 'SELECT * FROM assistance_requests')).rejects.toThrow(/permission denied/);
      await expect(asRole(role, "UPDATE assistance_requests SET status='closed'")).rejects.toThrow(/permission denied/);
      await expect(asRole(role, 'DELETE FROM assistance_requests')).rejects.toThrow(/permission denied/);
      await expect(asRole(role, 'SELECT * FROM donations')).rejects.toThrow(/permission denied/);
      await expect(asRole(role, 'SELECT * FROM submission_permits')).rejects.toThrow(/permission denied/);
    }
  });
  it('rejects unverified, reused, expired and payload-mismatched permits', async () => {
    const value = await permit('9876543211');
    await expect(asRole('anon', insert, [randomUUID(), 'Test Person', value.phone, 'Udaipur', 'Medicines', null])).rejects.toThrow(/permit required/);
    await expect(asRole('anon', insert, [value.requestId, 'Changed Name', value.phone, 'Udaipur', 'Medicines', value.token])).rejects.toThrow(/permit required/);
    await submit(value);
    await expect(submit(value)).rejects.toThrow(/permit required/);
    const expired = await permit('9876543212');
    await db.query("UPDATE submission_permits SET expires_at=now()-interval '1 minute' WHERE id=$1", [expired.token]);
    await expect(submit(expired)).rejects.toThrow(/permit required/);
  });
  it('prevents anonymous writes to staff-only fields', async () => {
    await expect(asRole('anon', "INSERT INTO assistance_requests(name,phone,village,assistance_type,status) VALUES('Test','9876543219','Udaipur','Medicines','closed')")).rejects.toThrow(/permission denied/);
  });
  it('limits submissions per phone in the database', async () => {
    for (let index = 0; index < 3; index++) await submit(await permit('9876543213'));
    await expect(submit(await permit('9876543213'))).rejects.toThrow(/Submission limit/);
  });
  it('retains database constraints even for permitted payloads', async () => {
    await expect(submit(await permit('123'))).rejects.toThrow(/check constraint/);
  });
});

describe('Payment persistence', () => {
  it('rejects public payment writes and handles repeat/out-of-order refunds monotonically', async () => {
    const id = randomUUID();
    await asRole('service_role', "INSERT INTO donations(id,token_hash,name,email,phone,amount_paise,mode,order_id) VALUES($1,$2,'Test Donor','donor@example.org','9876543220',100000,'test','order_test')", [id, 'a'.repeat(64)]);
    await expect(asRole('anon', 'SELECT record_verified_payment($1,$2,$3)', [id, 'pay_test', 0])).rejects.toThrow(/permission denied/);
    for (const refunded of [0, 0, 50000, 0, 100000, 50000]) await asRole('service_role', 'SELECT record_verified_payment($1,$2,$3)', [id, 'pay_test', refunded]);
    const row = await db.query<{ status: string; amount_refunded: number }>('SELECT status,amount_refunded FROM donations WHERE id=$1', [id]);
    expect(row.rows[0]).toEqual({ status: 'refunded', amount_refunded: 100000 });
    await expect(asRole('service_role', 'SELECT record_verified_payment($1,$2,$3)', [id, 'pay_other', 0])).rejects.toThrow(/Payment mismatch/);
    await expect(asRole('service_role', 'SELECT record_verified_payment($1,$2,$3)', [id, 'pay_test', 100001])).rejects.toThrow(/Refund mismatch/);
  });
});
