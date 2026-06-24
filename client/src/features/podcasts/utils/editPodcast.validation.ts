import { PUBLISH_LIMITS } from '@/features/podcasts/constants';

export interface EditPodcastFormErrors {
  title?: string;
  description?: string;
  categoryId?: string;
}

export const validateEditPodcastForm = (values: {
  title: string;
  description: string;
  categoryId: string;
}): EditPodcastFormErrors => {
  const errors: EditPodcastFormErrors = {};
  const title = values.title.trim();

  if (!title) {
    errors.title = 'Indica o título do episódio.';
  } else if (title.length < 3) {
    errors.title = 'O título deve ter pelo menos 3 caracteres.';
  } else if (title.length > PUBLISH_LIMITS.titleMax) {
    errors.title = `Máximo de ${PUBLISH_LIMITS.titleMax} caracteres.`;
  }

  if (values.description.trim().length > PUBLISH_LIMITS.descriptionMax) {
    errors.description = `Máximo de ${PUBLISH_LIMITS.descriptionMax} caracteres.`;
  }

  if (!values.categoryId) {
    errors.categoryId = 'Escolhe uma categoria.';
  }

  return errors;
};

export const hasEditPodcastErrors = (errors: EditPodcastFormErrors): boolean =>
  Object.values(errors).some(Boolean);
