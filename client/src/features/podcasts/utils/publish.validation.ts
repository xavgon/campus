import { CATEGORY_OTHER_ID, PUBLISH_LIMITS } from '@/features/podcasts/constants';

export interface PublishFormErrors {
  title?: string;
  description?: string;
  categoryId?: string;
  categoryOther?: string;
  audio?: string;
  cover?: string;
}

export interface PublishFormValues {
  title: string;
  description: string;
  categoryId: string;
  categoryOther: string;
  audio: File | null;
  video: File | null;
  cover: File | null;
}

const isAudioFile = (file: File): boolean =>
  file.type.startsWith('audio/') || /\.(mp3|wav|m4a)$/i.test(file.name);

const isVideoFile = (file: File): boolean =>
  file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);

const isImageFile = (file: File): boolean =>
  file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

const maxBytes = (mb: number) => mb * 1024 * 1024;

export const validatePublishForm = (values: PublishFormValues): PublishFormErrors => {
  const errors: PublishFormErrors = {};
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
  } else if (values.categoryId === CATEGORY_OTHER_ID) {
    const other = values.categoryOther.trim();
    if (!other) {
      errors.categoryOther = 'Indica o nome da categoria.';
    } else if (other.length < 2) {
      errors.categoryOther = 'Mínimo de 2 caracteres.';
    } else if (other.length > PUBLISH_LIMITS.categoryOtherMax) {
      errors.categoryOther = `Máximo de ${PUBLISH_LIMITS.categoryOtherMax} caracteres.`;
    }
  }

  // Áudio OU vídeo é obrigatório
  if (!values.audio && !values.video) {
    errors.audio = 'Carrega um ficheiro de áudio ou vídeo.';
  } else if (values.audio && !isAudioFile(values.audio)) {
    errors.audio = 'Formato inválido. Usa MP3, WAV ou M4A.';
  } else if (values.audio && values.audio.size > maxBytes(PUBLISH_LIMITS.audioMaxMb)) {
    errors.audio = `O áudio não pode exceder ${PUBLISH_LIMITS.audioMaxMb} MB.`;
  } else if (values.video && !isVideoFile(values.video)) {
    errors.audio = 'Formato de vídeo inválido. Usa MP4, WebM ou MOV.';
  } else if (values.video && values.video.size > maxBytes(PUBLISH_LIMITS.audioMaxMb)) {
    errors.audio = `O vídeo não pode exceder ${PUBLISH_LIMITS.audioMaxMb} MB.`;
  }

  if (values.cover) {
    if (!isImageFile(values.cover)) {
      errors.cover = 'A capa deve ser JPG, PNG ou WebP.';
    } else if (values.cover.size > maxBytes(PUBLISH_LIMITS.coverMaxMb)) {
      errors.cover = `A capa não pode exceder ${PUBLISH_LIMITS.coverMaxMb} MB.`;
    }
  }

  return errors;
};

export const hasPublishErrors = (errors: PublishFormErrors): boolean =>
  Object.values(errors).some(Boolean);
