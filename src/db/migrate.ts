import type { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_CARDS_INDEXES, CREATE_CARDS_TABLE } from './schema';

export async function migrateChamberDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_CARDS_TABLE);
  await db.execAsync(CREATE_CARDS_INDEXES);
}
