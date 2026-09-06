export const CREATE_CARDS_TABLE = `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,
  card_code TEXT NOT NULL,
  type TEXT NOT NULL,
  grade TEXT,
  cert_number TEXT,
  print_note TEXT,
  language TEXT NOT NULL DEFAULT 'EN',
  purchase_date TEXT,
  purchase_price_aud REAL,
  notes TEXT,
  photo_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_CARDS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_cards_code ON cards(card_code);
CREATE INDEX IF NOT EXISTS idx_cards_updated ON cards(updated_at);
`;
