import { AppError } from '../middleware/errorHandler';

export interface CreatePodcastInput {
  title: string;
  description?: string | null;
  category_id?: number | null;
}

export interface UpdatePodcastInput {
  title?: string;
  description?: string | null;
  category_id?: number | null;
}

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} é obrigatório`);
  }
  return value.trim();
};

export const validateCreatePodcast = (body: unknown): CreatePodcastInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos');
  }

  const data = body as Record<string, unknown>;
  const title = requireString(data.title, 'Título');

  if (title.length > 200) {
    throw new AppError('Título não pode ter mais de 200 caracteres');
  }

  const description =
    typeof data.description === 'string' && data.description.trim()
      ? data.description.trim()
      : null;

  const category_id =
    data.category_id !== undefined && data.category_id !== null && data.category_id !== ''
      ? Number(data.category_id)
      : null;

  if (category_id !== null && !Number.isInteger(category_id)) {
    throw new AppError('Categoria inválida');
  }

  return { title, description, category_id };
};

export const validateUpdatePodcast = (body: unknown): UpdatePodcastInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos');
  }

  const data = body as Record<string, unknown>;
  const result: UpdatePodcastInput = {};

  if (data.title !== undefined) {
    const title = requireString(data.title, 'Título');
    if (title.length > 200) throw new AppError('Título não pode ter mais de 200 caracteres');
    result.title = title;
  }

  if (data.description !== undefined) {
    result.description =
      typeof data.description === 'string' && data.description.trim()
        ? data.description.trim()
        : null;
  }

  if (data.category_id !== undefined) {
    result.category_id =
      data.category_id !== null && data.category_id !== ''
        ? Number(data.category_id)
        : null;

    if (result.category_id !== null && !Number.isInteger(result.category_id)) {
      throw new AppError('Categoria inválida');
    }
  }

  return result;
};
