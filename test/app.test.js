const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const { app, dbConfig } = require('../app');

let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('database credentials come from the environment', () => {
  assert.equal(dbConfig.user, process.env.DB_USER);
  assert.equal(dbConfig.password, process.env.DB_PASSWORD);
});

test('health endpoint reports that the server is running', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('root serves the application homepage', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /EVENT TICKETING SYSTEM/);
});

test('search rejects missing and unsupported parameters before querying Oracle', async () => {
  const missingId = await fetch(`${baseUrl}/api/search?type=user`);
  assert.equal(missingId.status, 400);

  const unsupportedType = await fetch(`${baseUrl}/api/search?type=invalid&id=1`);
  assert.equal(unsupportedType.status, 400);
});
