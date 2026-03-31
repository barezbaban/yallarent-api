export const IRAQ_CITIES = [
  'Erbil',
  'Baghdad',
  'Basra',
  'Sulaymaniyah',
  'Duhok',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Mosul',
  'Halabja',
  'Zakho',
  'Amarah',
  'Nasiriyah',
  'Hillah',
  'Ramadi',
  'Tikrit',
  'Samawah',
  'Diwaniyah',
  'Kut',
  'Fallujah',
] as const;

export type IraqCity = (typeof IRAQ_CITIES)[number];
