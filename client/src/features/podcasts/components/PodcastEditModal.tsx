import { useEffect, useState, type FormEvent } from 'react';
import { usePodcastCategories } from '@/features/podcasts/hooks/usePodcastCategories';
import { updatePodcast } from '@/features/podcasts/services/podcast.service';
import type { Podcast } from '@/features/podcasts/types/podcast';
import {
  hasEditPodcastErrors,
  validateEditPodcastForm,
  type EditPodcastFormErrors,
} from '@/features/podcasts/utils/editPodcast.validation';
import { Alert } from '@/shared/components/campus/Alert';
import { Field } from '@/shared/components/campus/Field';
import { Modal } from '@/shared/components/campus/Modal';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { ERROR_TITLES } from '@/shared/copy/campusMessages';
import { Button } from '@/shared/components/ui/Button';

interface PodcastEditModalProps {
  open: boolean;
  podcast: Podcast;
  onClose: () => void;
  onSaved: (podcast: Podcast) => void;
}

export const PodcastEditModal = ({ open, podcast, onClose, onSaved }: PodcastEditModalProps) => {
  const { categories, isLoading: categoriesLoading } = usePodcastCategories(open);
  const [title, setTitle] = useState(podcast.title);
  const [description, setDescription] = useState(podcast.description);
  const [categoryId, setCategoryId] = useState(podcast.categoryId || '');
  const [errors, setErrors] = useState<EditPodcastFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(podcast.title);
    setDescription(podcast.description);
    setCategoryId(podcast.categoryId || categories[0]?.id || '');
    setErrors({});
    setError(null);
  }, [open, podcast, categories]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateEditPodcastForm({ title, description, categoryId });
    setErrors(nextErrors);
    setError(null);
    if (hasEditPodcastErrors(nextErrors)) return;

    setIsSaving(true);
    try {
      const updated = await updatePodcast(podcast.id, {
        title: title.trim(),
        description: description.trim(),
        categoryId,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar episódio"
      description="Actualiza o título, descrição ou categoria. Os ficheiros de áudio/vídeo não podem ser alterados aqui."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        {error && <Alert title={ERROR_TITLES.save} message={error} />}

        <Field
          label="Título"
          name="editTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <TextAreaField
          label="Descrição"
          name="editDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          rows={4}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editCategory" className="text-sm font-medium text-campus-foreground">
            Categoria
          </label>
          <select
            id="editCategory"
            className="w-full rounded-none border border-campus-border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoriesLoading}
          >
            {categoriesLoading && <option value="">A carregar…</option>}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            {podcast.categoryId &&
              !categories.some((c) => c.id === podcast.categoryId) && (
                <option value={podcast.categoryId}>{podcast.categoryName}</option>
              )}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-campus-danger">{errors.categoryId}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'A guardar…' : 'Guardar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
