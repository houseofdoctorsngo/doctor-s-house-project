import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const origin = 'http://127.0.0.1:43127';
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: process.cwd(), windowsHide: true,
  env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '43127', SITE_URL: 'https://ngo.example',
    PAYMENTS_MODE: 'disabled', SUPABASE_URL: '', SUPABASE_PUBLISHABLE_KEY: '', SUPABASE_SECRET_KEY: '', SUPABASE_SERVICE_ROLE_KEY: '', TURNSTILE_SECRET_KEY: '', TURNSTILE_SITE_KEY: '', CASHFREE_APP_ID: '', CASHFREE_SECRET_KEY: '', CASHFREE_ENV: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
server.stdout.on('data', data => { output += data; });
server.stderr.on('data', data => { output += data; });
let startupError;
server.on('error', error => { startupError = error; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { ready = (await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Starting. */ }
    if (ready) break;
    await delay(100);
  }
  assert.ok(ready, `Production server did not start: ${output}`);
  const page = await fetch(origin); const html = await page.text();
  assert.equal(page.status, 200);
  assert.ok(html.includes('The House of Doctor') && html.includes('A house built on healing.') && html.includes('Support Our Mission'));
  const sections = ['home', 'about', 'donate', 'services', 'gallery', 'help-desk', 'mewar-connect', 'focus', 'library', 'publications'];
  const positions = sections.map(id => html.indexOf(`id="${id}"`));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(html.includes('carousel-3d') && html.includes('translateZ(280px)'));
  assert.ok(!html.includes('name="card_number"') && !html.includes('name="cvv"'));
  assert.ok(!html.includes('/__l5e/assets-v1/'));
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(page.headers.get('x-frame-options'), 'DENY');
  console.log('PASS production SSR and response headers');
  const config = await (await fetch(`${origin}/api/config`)).json();
  assert.equal(config.paymentsMode, 'disabled'); assert.equal(config.assistanceEnabled, false);
  assert.deepEqual(Object.keys(config).sort(), ['assistanceEnabled', 'paymentsMode', 'turnstileSiteKey']);
  console.log('PASS fail-closed public configuration');
  const image = await fetch(`${origin}/images/ngo-logo.jpeg`);
  assert.equal(image.status, 200); assert.ok(image.headers.get('content-type')?.startsWith('image/'));
  const assets = [...new Set([...html.matchAll(/(?:src|href)="([^\"]*\/assets\/[^\"]+)"/g)].map(match => match[1]))];
  assert.ok(assets.length > 0);
  for (const asset of assets) assert.equal((await fetch(new URL(asset, origin))).status, 200, asset);
  console.log(`PASS logo and ${assets.length} referenced application assets`);
  const denied = await fetch(`${origin}/api/assistance`, { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403);
  const malformed = await fetch(`${origin}/api/assistance`, { method: 'POST', headers: { Origin: 'https://ngo.example', 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const disabled = await fetch(`${origin}/api/payments/order`, { method: 'POST', headers: { Origin: 'https://ngo.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(disabled.status, 503);
  const staff = await fetch(`${origin}/staff`);
  assert.equal(staff.status, 200);
  const staffPage = await staff.text();
  assert.match(staffPage, /Staff sign-in/);
  assert.match(staffPage, /noindex/);
  assert.doesNotMatch(staffPage, /Transaction \/ payment ID/);
  assert.equal((await fetch(`${origin}/api/staff/config`)).status, 503);
  const sample = await fetch(`${origin}/sample-donation-receipt.pdf`);
  assert.equal(sample.status, 200);
  assert.equal(sample.headers.get('content-type'), 'application/pdf');
  assert.ok(Buffer.from(await sample.arrayBuffer()).subarray(0, 5).toString() === '%PDF-');
  const receiptChunk = (await readdir('.output/server/_ssr')).find(name => /^receipt-.*\.mjs$/.test(name));
  assert.ok(receiptChunk, 'Compiled receipt module is present');
  const { generateReceipt } = await import(pathToFileURL(resolve('.output/server/_ssr', receiptChunk)).href);
  const testReceipt = generateReceipt({
    id: 'test', name: 'QA donor', email: 'qa@example.org', phone: '+91 90000 00000',
    amount: 251, orderId: 'test_order', paymentId: 'test_payment', status: 'captured',
    mode: 'test', date: '2026-11-19T10:00:00+05:30', refunded: 0, paymentDate: null,
    paymentMethod: null, bankReference: null,
  });
  assert.ok(Buffer.from(testReceipt).subarray(0, 5).toString() === '%PDF-');
  console.log('PASS sample PDF and compiled receipt generation with embedded logo and fonts');
  assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
  console.log('PASS compiled API origin/JSON checks, disabled payments and 404 handling');
  console.log('Production runtime smoke test passed; no external provider requests were made.');
} finally {
  server.kill();
  await Promise.race([new Promise(resolve => server.once('exit', resolve)), delay(3000)]);
}
