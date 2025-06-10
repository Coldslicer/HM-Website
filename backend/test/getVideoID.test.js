import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function loadGetVideoID(file) {
  const source = fs.readFileSync(path.resolve('routes', file), 'utf8');
  const match = source.match(/const getVideoID = \(url\) => {([\s\S]*?)};/);
  if (!match) throw new Error('getVideoID not found in ' + file);
  const code = `${match[0]}; getVideoID;`;
  return vm.runInNewContext(code);
}

const analyticsGetVideoID = loadGetVideoID('analytics.js');
const paymentGetVideoID = loadGetVideoID('payment.js');

const examples = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'
];

for (const url of examples) {
  test(`analytics getVideoID extracts ID from ${url}`, () => {
    assert.equal(analyticsGetVideoID(url), 'dQw4w9WgXcQ');
  });
  test(`payment getVideoID extracts ID from ${url}`, () => {
    assert.equal(paymentGetVideoID(url), 'dQw4w9WgXcQ');
  });
}

test('returns null for invalid URL', () => {
  assert.equal(analyticsGetVideoID('https://example.com'), null);
  assert.equal(paymentGetVideoID('invalid'), null);
});
