import { getPool } from '../database/pool';

export interface CategoryRow {
  id: number;
  name: string;
}

const DEFAULT_CATEGORIES = [
  'Educação geral',
  'Ciências',
  'História',
  'Línguas',
  'Tecnologia',
  'Artes',
] as const;

export const ensureDefaultCategories = async (): Promise<void> => {
  for (const name of DEFAULT_CATEGORIES) {
    await getPool().query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name],
    );
  }
};

export const listCategories = async (): Promise<CategoryRow[]> => {
  const result = await getPool().query<CategoryRow>(
    'SELECT id, name FROM categories ORDER BY name ASC',
  );
  return result.rows;
};
