// Self-check: node --test functions/_lib/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreWHO5, categoryFor, CATEGORY_LABEL } from './scoring.ts';
import { rateLimited } from './rate-limit.ts';
// ponytail: register.ts imports '../_lib/api' tanpa ekstensi (esbuild/wrangler toleran,
// node:test tidak) — jadi panggil register.ts via dynamic import dengan resolver.
const { validateRegistration } = await import('../api/register.ts');

test('scoreWHO5: jumlah x 4', () => {
  assert.equal(scoreWHO5([0, 0, 0, 0, 0]), 0);
  assert.equal(scoreWHO5([5, 5, 5, 5, 5]), 100);
  assert.equal(scoreWHO5([4, 3, 2, 1, 0]), 40);
  assert.equal(scoreWHO5([3, 3, 3, 3, 3]), 60);
});

test('categoryFor: cut-off standar WHO-5', () => {
  assert.equal(categoryFor(100), 'good');
  assert.equal(categoryFor(68), 'good');
  assert.equal(categoryFor(67), 'fair');
  assert.equal(categoryFor(51), 'fair');
  assert.equal(categoryFor(50), 'poor');
  assert.equal(categoryFor(29), 'poor');
  assert.equal(categoryFor(28), 'depression');
  assert.equal(categoryFor(0), 'depression');
});

test('CATEGORY_LABEL lengkap 4 kategori', () => {
  assert.deepEqual(Object.keys(CATEGORY_LABEL).sort(), ['depression', 'fair', 'good', 'poor']);
});

const validBody = {
  name: 'Budi Santoso', email: 'budi@example.com', phone: '8123456789',
  domicile: 'KOTA JAKARTA SELATAN', birth_date: '2000-05-10', gender: 'L',
  complaint: 'Saya sering merasa cemas dan sulit tidur belakangan ini.',
};

test('validateRegistration: data valid lolos', () => {
  const result = validateRegistration(validBody) as any;
  assert.equal(result.data.age, 26);
});

test('validateRegistration: field kosong/wajib terdeteksi', () => {
  const empty = validateRegistration({}) as any;
  const keys = Object.keys(empty.errors);
  for (const field of ['name', 'email', 'phone', 'domicile', 'gender', 'complaint', 'birth_date']) {
    assert.ok(keys.includes(field), `${field} harus divalidasi`);
  }
});

test('validateRegistration: umur <13 ditolak', () => {
  const result = validateRegistration({ ...validBody, birth_date: '2020-01-01' }) as any;
  assert.ok('errors' in result && result.errors.birth_date?.includes('13'));
});

test('validateRegistration: email/telepon format dicek', () => {
  const badEmail = validateRegistration({ ...validBody, email: 'bukan-email' }) as any;
  assert.ok('errors' in badEmail && badEmail.errors.email, 'email invalid ditolak');
  const badPhone = validateRegistration({ ...validBody, phone: '12' }) as any;
  assert.ok('errors' in badPhone && badPhone.errors.phone, 'telepon pendek ditolak');
  // telepon dengan format bebas + spasi harus lolos
  const okPhone = validateRegistration({ ...validBody, phone: '+62 812 345 6789' }) as any;
  assert.ok('data' in okPhone, 'telepon +62 dengan spasi lolos');
});

test('validateRegistration: keluhan <20 karakter ditolak', () => {
  const result = validateRegistration({ ...validBody, complaint: 'pendek sekali' }) as any;
  assert.ok('errors' in result && result.errors.complaint);
});

test('rateLimited: limit per IP dalam window', () => {
  const key = `test-${Date.now()}`;
  assert.equal(rateLimited(key, 3, 60_000), false);
  assert.equal(rateLimited(key, 3, 60_000), false);
  assert.equal(rateLimited(key, 3, 60_000), false);
  assert.equal(rateLimited(key, 3, 60_000), true);
  assert.equal(rateLimited(`other-${key}`, 3, 60_000), false);
});
