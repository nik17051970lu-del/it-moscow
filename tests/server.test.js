const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../app');
let server, origin;
before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('serves the existing website and material details', async () => {
  for (const route of ['/', '/index.html', '/material.html?id=demo-1']) {
    const res = await fetch(origin + route);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /IT.МОСКВА/);
  }
});
test('serves CSS, scripts and category images with correct types', async () => {
  for (const [route, type] of [['/styles/main.css', /text\/css/], ['/scripts/main.js', /javascript/], ['/scripts/listings.js', /javascript/], ['/scripts/material.js', /javascript/], ['/assets/books.svg', /image\/svg/], ['/assets/notes.svg', /image\/svg/], ['/assets/materials.svg', /image\/svg/]]) {
    const res = await fetch(origin + route);
    assert.equal(res.status, 200, route);
    assert.match(res.headers.get('content-type'), type);
    assert.ok((await res.text()).length > 0);
  }
});
test('health endpoint responds without exposing server details', async () => {
  const res = await fetch(origin + '/api/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
  assert.equal(res.headers.get('x-powered-by'), null);
});
test('repository files and unknown routes are not published', async () => {
  for (const route of ['/server.js', '/package.json', '/.git/config', '/it-moscow/docs/checklist.md', '/does-not-exist']) {
    const res = await fetch(origin + route);
    assert.equal(res.status, 404, route);
    assert.match(await res.text(), /Страница не найдена/);
  }
});
test('POST does not masquerade as a saved registration or listing', async () => {
  const res = await fetch(origin + '/api/registration', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 404);
});
