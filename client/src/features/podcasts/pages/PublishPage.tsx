import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { FileDropzone } from '@/features/podcasts/components/FileDropzone';
import {
  AUDIO_ACCEPT,
  CATEGORY_OTHER_ID,
  COVER_ACCEPT,
  PODCAST_CATEGORIES,
  PUBLISH_LIMITS,
} from '@/features/podcasts/constants';
import { createPodcast } from '@/features/podcasts/services/podcast.service';
import {
  hasPublishErrors,
  validatePublishForm,
  type PublishFormErrors,
} from '@/features/podcasts/utils/publish.validation';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Alert } from '@/shared/components/campus/Alert';
import { Field } from '@/shared/components/campus/Field';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const PublishPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryOther, setCategoryOther] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<PublishFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!cover) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const clearError = (field: keyof PublishFormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setSubmitError(null);

    const nextErrors = validatePublishForm({
      title,
      description,
      categoryId,
      categoryOther,
      audio,
      cover,
    });
    setErrors(nextErrors);

    if (hasPublishErrors(nextErrors)) return;

    setIsSubmitting(true);
    try {
      await createPodcast({
        title,
        description,
        categoryId,
        audio: audio!,
        cover,
      });
      navigate('/podcasts', {
        state: { notice: 'Episódio publicado. A compressão do áudio pode demorar alguns minutos.' },
      });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="campus-page-enter space-y-8">
      <PageHeader
        eyebrow="Publicar"
        title="Novo episódio"
        description="Preenche os metadados e carrega o áudio. A capa é opcional mas recomendada para o catálogo."
      />

      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        {submitError && <Alert title="Erro ao publicar" message={submitError} />}
        {notice && (
          <ProfileNotice title="Quase lá" message={notice} variant="success" />
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
          <div className="space-y-6">
            <ProfileSection
              title="Informação"
              description="Título e descrição visíveis na listagem e na página do episódio."
            >
              <div className="space-y-5">
                <Field
                  label="Título"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError('title');
                  }}
                  error={errors.title}
                  placeholder="Ex.: Introdução à Fotossíntese"
                  maxLength={PUBLISH_LIMITS.titleMax}
                  autoComplete="off"
                />
                <TextAreaField
                  label="Descrição"
                  name="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError('description');
                  }}
                  error={errors.description}
                  hint={`Opcional · até ${PUBLISH_LIMITS.descriptionMax} caracteres`}
                  placeholder="Resumo do conteúdo, objectivos de aprendizagem…"
                  rows={5}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="categoryId" className="text-sm font-medium text-campus-foreground">
                    Categoria
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={categoryId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategoryId(value);
                      clearError('categoryId');
                      if (value !== CATEGORY_OTHER_ID) {
                        setCategoryOther('');
                        clearError('categoryOther');
                      }
                    }}
                    aria-invalid={errors.categoryId ? true : undefined}
                    className={`w-full rounded-none border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none transition focus:ring-2 focus:ring-campus-primary/30 ${
                      errors.categoryId
                        ? 'border-campus-danger/70'
                        : 'border-campus-border focus:border-campus-primary'
                    }`}
                  >
                    <option value="">Seleccionar categoria…</option>
                    {PODCAST_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value={CATEGORY_OTHER_ID}>Outros</option>
                  </select>
                  {errors.categoryId && (
                    <p className="text-xs text-campus-danger" role="alert">
                      {errors.categoryId}
                    </p>
                  )}
                  {categoryId === CATEGORY_OTHER_ID && (
                    <Field
                      label="Nome da categoria"
                      name="categoryOther"
                      value={categoryOther}
                      onChange={(e) => {
                        setCategoryOther(e.target.value);
                        clearError('categoryOther');
                      }}
                      error={errors.categoryOther}
                      placeholder="Ex.: Filosofia, Matemática avançada…"
                      maxLength={PUBLISH_LIMITS.categoryOtherMax}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            </ProfileSection>

            <ProfileSection
              title="Ficheiros"
              description="O áudio será comprimido automaticamente após o upload (Módulo 3)."
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <FileDropzone
                  label="Áudio"
                  hint={`MP3, WAV ou M4A · máx. ${PUBLISH_LIMITS.audioMaxMb} MB`}
                  accept={AUDIO_ACCEPT}
                  file={audio}
                  error={errors.audio}
                  onFileChange={(file) => {
                    setAudio(file);
                    clearError('audio');
                  }}
                  emptyIcon="♪"
                />
                <FileDropzone
                  label="Capa (opcional)"
                  hint={`JPG, PNG ou WebP · máx. ${PUBLISH_LIMITS.coverMaxMb} MB`}
                  accept={COVER_ACCEPT}
                  file={cover}
                  previewUrl={coverPreview}
                  error={errors.cover}
                  onFileChange={(file) => {
                    setCover(file);
                    clearError('cover');
                  }}
                  emptyIcon="▣"
                />
              </div>
            </ProfileSection>
          </div>

          <aside className="space-y-6">
            <div className="campus-panel p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-campus-primary">
                Antes de publicar
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-campus-accent">
                <li>Usa áudio nítido e sem ruído de fundo excessivo.</li>
                <li>A capa quadrada ou 16:9 destaca melhor no catálogo.</li>
                <li>Após publicar, podes editar metadados na lista de podcasts.</li>
              </ul>
            </div>

            <div className="campus-panel flex flex-col gap-3 p-6">
              <AuthSubmitButton loading={isSubmitting} loadingLabel="A enviar…">
                Publicar episódio
              </AuthSubmitButton>
              <Link to="/podcasts">
                <Button type="button" variant="outline" fullWidth>
                  Cancelar
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};
