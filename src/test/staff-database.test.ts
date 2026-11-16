// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";

const staff = "10000000-0000-4000-8000-000000000001";
const requestId = "10000000-0000-4000-8000-000000000002";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE PUBLICATION supabase_realtime;
  `);
  for (const name of ["production", "staff", "staff"]) {
    await db.exec(
      await readFile(new URL("../../supabase/" + name + ".sql", import.meta.url), "utf8"),
    );
  }
  await db.query("INSERT INTO auth.users VALUES ($1)", [staff]);
  await db.query("INSERT INTO ngo_private.staff_members VALUES ($1)", [staff]);
  const token = "10000000-0000-4000-8000-000000000003";
  const values = ["Camp volunteer", "9876543210", "Udaipur", "Camp volunteering"];
  await db.query("INSERT INTO submission_permits(id,request_id,payload) VALUES ($1,$2,$3)", [
    token,
    requestId,
    JSON.stringify({
      name: values[0],
      phone: values[1],
      village: values[2],
      assistance_type: values[3],
    }),
  ]);
  await db.query(
    "INSERT INTO assistance_requests(id,name,phone,village,assistance_type,submission_token) VALUES ($1,$2,$3,$4,$5,$6)",
    [requestId, ...values, token],
  );
  await db.query(
    "INSERT INTO donations(id,token_hash,name,email,phone,amount_paise,mode,provider,order_id) VALUES(gen_random_uuid(),$1,'QA','qa@example.org','9876543210',12500,'test','cashfree','order_qa')",
    ["a".repeat(64)],
  );
  await db.exec("SELECT record_verified_payment(id,'tx_qa',500) FROM donations");
}, 60000);
afterAll(async () => {
  await db?.close();
});

it("rejects guests and non-members, projects safe fields and protects concurrent status changes", async () => {
  await db.exec("SET ROLE anon");
  await expect(db.exec("SELECT public.staff_queue('donations',0)")).rejects.toThrow(
    /permission denied/,
  );
  await db.exec("RESET ROLE; SET ROLE authenticated");
  expect((await db.query("SELECT * FROM public.staff_queue_signal")).rows).toHaveLength(0);
  await expect(db.exec("SELECT public.staff_queue('requests',0)")).rejects.toThrow();
  await expect(
    db.exec("INSERT INTO ngo_private.staff_members SELECT gen_random_uuid()"),
  ).rejects.toThrow();
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [staff]);
  const queue = async (name: string) =>
    (
      await db.query<{ rows: Record<string, unknown>[] }>("SELECT staff_queue($1,0) AS rows", [
        name,
      ])
    ).rows[0]!.rows;
  expect((await queue("donations"))[0]).toMatchObject({
    payment_id: "tx_qa",
    status: "partially_refunded",
    amount_refunded: 500,
  });
  expect((await queue("donations"))[0]).not.toHaveProperty("token_hash");
  expect((await queue("requests"))[0]).toMatchObject({
    id: requestId,
    assistance_type: "Camp volunteering",
  });
  const revision = async () =>
    Number(
      (await db.query<{ revision: number }>("SELECT revision FROM staff_queue_signal")).rows[0]!
        .revision,
    );
  const before = await revision();
  await db.query("SELECT staff_update_request($1,'new','contacted')", [requestId]);
  expect(await revision()).toBe(before + 1);
  await expect(
    db.query("SELECT staff_update_request($1,'new','closed')", [requestId]),
  ).rejects.toThrow(/changed/);
  await expect(db.exec("UPDATE donations SET status='refunded'")).rejects.toThrow();
  await db.exec("RESET ROLE; DELETE FROM ngo_private.staff_members; SET ROLE authenticated");
  await expect(db.exec("SELECT staff_queue('donations',0)")).rejects.toThrow();
  expect((await db.query("SELECT * FROM staff_queue_signal")).rows).toHaveLength(0);
});
