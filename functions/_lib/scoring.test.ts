// Self-check: node --experimental-strip-types --test functions/_lib/scoring.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scorePSS10, bandFor, PSS10_QUESTIONS } from './scoring.ts';
import { rateLimited } from './rate-limit.ts';
import { REGIONS } from './regions.ts';
const { validateRegistration } = await import('../api/register.ts');

const V = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]; // all "sangat sering"
const Z = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // all "tidak pernah"

test('PSS-10 punya 10 pertanyaan, 4 reverse', () => {
  assert.equal(PSS10_QUESTIONS.length, 10);
  assert.equal(PSS10_QUESTIONS.filter(q => q.reverse).length, 4);
  assert.deepEqual(PSS10_QUESTIONS.filter(q => q.reverse).map(q => q.code), ['Q8', 'Q9', 'Q11', 'Q12']);
});

test('scorePSS10: native 0-40 dengan reverse item', () => {
  assert.equal(scorePSS10(Z), 16);   // 6 negatif*0 + 4 reverse*(4-0)=16
  assert.equal(scorePSS10(V), 24);   // 6 negatif*4=24 + 4 reverse*(4-4)=0
  assert.equal(scorePSS10([4,4,4,0,0,4,0,0,4,4]), 40); // stres maksimal
  assert.equal(scorePSS10([0,0,0,4,4,0,4,4,0,0]), 0);  // stres minimal
});

test('bandFor: 0-13 rendah, 14-26 sedang, 27-40 tinggi', () => {
  assert.equal(bandFor(0).color, 'low');
  assert.equal(bandFor(13).color, 'low');
  assert.equal(bandFor(14).color, 'medium');
  assert.equal(bandFor(26).color, 'medium');
  assert.equal(bandFor(27).color, 'high');
  assert.equal(bandFor(40).color, 'high');
});

test('regions: 38 provinsi, 514 kab/kota, DKI lengkap', () => {
  assert.equal(REGIONS.length, 38);
  assert.equal(REGIONS.reduce((n, r) => n + r[1].length, 0), 514);
  const dki = REGIONS.find(r => r[0] === 'DKI Jakarta');
  assert.ok(dki);
  assert.equal(dki![1].length, 6);
});

const validBody = {
  name: 'Budi Santoso', email: 'budi@example.com', phone: '8123456789',
  province: 'DKI Jakarta', domicile: 'Kota Administrasi Jakarta Selatan',
  birth_date: '2000-05-10', gender: 'L',
  complaint: 'Saya sering merasa cemas dan sulit tidur belakangan ini.',
};

test('validateRegistration: data valid lolos', () => {
  const result = validateRegistration(validBody) as any;
  assert.ok('data' in result);
  assert.equal(result.data.age, 26);
});

test('validateRegistration: field wajib terdeteksi', () => {
  const empty = validateRegistration({}) as any;
  const keys = Object.keys(empty.errors);
  for (const f of ['name', 'email', 'phone', 'province', 'domicile', 'gender', 'complaint', 'birth_date']) {
    assert.ok(keys.includes(f), `${f} harus divalidasi`);
  }
});

test('validateRegistration: provinsi/kota harus cocok', () => {
  const wrongCity = validateRegistration({ ...validBody, province: 'Bali' }) as any;
  assert.ok('errors' in wrongCity && wrongCity.errors.domicile, 'kota DKI dengan provinsi Bali ditolak');
  const badProv = validateRegistration({ ...validBody, province: 'Jakarta' }) as any;
  assert.ok('errors' in badProv && badProv.errors.province, 'provinsi tidak terdaftar ditolak');
});

test('validateRegistration: umur <13 & format email/telepon', () => {
  assert.ok('errors' in (validateRegistration({ ...validBody, birth_date: '2020-01-01' }) as any));
  assert.ok('errors' in (validateRegistration({ ...validBody, email: 'bukan-email' }) as any));
  assert.ok('errors' in (validateRegistration({ ...validBody, phone: '12' }) as any));
  assert.ok('data' in (validateRegistration({ ...validBody, phone: '+62 812 345 6789' }) as any));
});

test('validateRegistration: keluhan <20 karakter ditolak', () => {
  const r = validateRegistration({ ...validBody, complaint: 'pendek' }) as any;
  assert.ok('errors' in r && r.errors.complaint);
});

test('rateLimited: limit per IP', () => {
  const k = `t-${Date.now()}`;
  assert.equal(rateLimited(k, 3, 60_000), false);
  assert.equal(rateLimited(k, 3, 60_000), false);
  assert.equal(rateLimited(k, 3, 60_000), false);
  assert.equal(rateLimited(k, 3, 60_000), true);
});
