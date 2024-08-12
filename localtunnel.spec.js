/* eslint-disable no-console */

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');
const assert = require('assert');
const axios = require('axios');

const localtunnel = require('./localtunnel');

const host = 'https://hooks.n8n.cloud';

let fakePort;

const server = http.createServer();

before(done => {
  server.on('request', (req, res) => {
    res.write(req.headers.host);
    res.end();
  });
  server.listen(() => {
    const { port } = server.address();
    fakePort = port;
    done();
  });
});

after(() => {
  server.close();
})

it('query localtunnel server w/ ident', async () => {
  const tunnel = await localtunnel(fakePort, { host });
  assert.ok(new RegExp('^https://[a-z0-9\-]+.hooks.n8n.cloud$').test(tunnel.url));

  const parsed = url.parse(tunnel.url);
  const response = await axios.get(`${tunnel.url}/`);
  assert.strictEqual(response.data, parsed.host);

  tunnel.close();
});

it('request specific domain', async () => {
  const subdomain = Math.random().toString(36).substr(2);
  const tunnel = await localtunnel(fakePort, { host, subdomain });
  assert.ok(new RegExp(`^https://${subdomain}.hooks.n8n.cloud$`).test(tunnel.url));
  tunnel.close();
});

describe('--local-host localhost', () => {
  it('override Host header with local-host', async () => {
    const tunnel = await localtunnel(fakePort, { host, local_host: 'localhost' });
    assert.ok(new RegExp('^https://[a-z0-9\-]+.hooks.n8n.cloud$').test(tunnel.url));

    const parsed = url.parse(tunnel.url);
    const response = await axios.get(`${tunnel.url}/`);
    assert.strictEqual(response.data, 'localhost');
    tunnel.close();
  });
});

describe('--local-host 127.0.0.1', () => {
  it('override Host header with local-host', async () => {
    const tunnel = await localtunnel(fakePort, { host, local_host: '127.0.0.1' });
    assert.ok(new RegExp('^https://[a-z0-9\-]+.hooks.n8n.cloud$').test(tunnel.url));

    const parsed = url.parse(tunnel.url);
    const response = await axios.get(`${tunnel.url}/`);
    assert.strictEqual(response.data, '127.0.0.1');
    tunnel.close();
  });
});
