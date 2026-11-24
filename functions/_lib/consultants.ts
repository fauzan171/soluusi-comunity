// Konsultan mitra (shared: dipakai FE widget + BE voucher PDF).
// Slug = URL soluusi.com/mentalhealth/<slug>
export type Consultant = {
  slug: string;
  name: string;
  title: string;
  city: string;
  photo: string;
  url: string;
};

export const CONSULTANTS: Consultant[] = [
  {
    slug: 'zulfaroshifatul',
    name: 'Zulfa Roshifatul Husna, M.Psi., Psikolog',
    title: 'Psikolog Klinis',
    city: 'Mataram',
    photo: '/brand/consultants/zulfa.jpg',
    url: 'https://soluusi.com/mentalhealth/zulfaroshifatul',
  },
  {
    slug: 'mailanahasrat',
    name: 'Hasrat Listaria',
    title: 'Konselor Mental Health',
    city: 'Bandung',
    photo: '/brand/consultants/hasrat.jpg',
    url: 'https://soluusi.com/mentalhealth/mailanahasrat',
  },
  {
    slug: 'amaliyahnurazizah12',
    name: 'Amaliyah Nur Azizah, M.Psi., Psikolog',
    title: 'Psikolog Klinis',
    city: 'Bandung',
    photo: '/brand/consultants/amaliyah.jpg',
    url: 'https://soluusi.com/mentalhealth/amaliyahnurazizah12',
  },
];

export const CONSULTANT_MAP: Record<string, Consultant> = Object.fromEntries(
  CONSULTANTS.map(c => [c.slug, c]),
);
