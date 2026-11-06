// Run against a deployed staging URL. This creates no records or payments.
const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/check-production.mjs https://your-service.up.railway.app');
  process.exit(1);
}
let failed = false;
async function check(path, assertion) {
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await assertion(response);
    console.log(`PASS ${path}`);
  } catch (error) { failed = true; console.error(`FAIL ${path}: ${error.message}`); }
}
await check('/api/health', async response => { if ((await response.json()).status !== 'ok') throw new Error('Invalid health response'); });
await check('/api/config', async response => {
  const config = await response.json();
  console.log(`  Assistance enabled: ${config.assistanceEnabled}; payment mode: ${config.paymentsMode}`);
  if (Object.keys(config).some(key => /secret|service.?role/i.test(key))) throw new Error('Unexpected private config field');
});
await check('/', async response => {
  const html = await response.text();
  if (!html.includes('The House of Doctor')) throw new Error('Missing server-rendered page');
  if (html.includes('/__l5e/assets-v1/')) throw new Error('Non-portable Lovable asset reference');
});
await check('/images/ngo-logo.jpeg', async response => { if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Logo is not an image'); });
if (failed) process.exitCode = 1;
else console.log('Read-only smoke checks passed. Provider integration tests are still required.');
