import { useRef } from 'react';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { Button } from '@/shared/components/ui/Button';

const MAX_AVATAR_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp';

interface ProfilePhotoPickerProps {
  nome: string;
  fotoUrl?: string | null;
  cacheKey?: string | number;
  loading?: boolean;
  onSelect: (file: File) => void;
  onRemove?: () => void;
}

export const ProfilePhotoPicker = ({
  nome,
  fotoUrl,
  cacheKey,
  loading = false,
  onSelect,
  onRemove,
}: ProfilePhotoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      event.target.value = '';
      return;
    }

    onSelect(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className="group relative rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-label="Alterar foto de perfil"
      >
        <ProfileAvatar nome={nome} fotoUrl={fotoUrl} cacheKey={cacheKey} size="lg" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-semibold uppercase tracking-wider text-campus-foreground opacity-0 transition group-hover:opacity-100 group-disabled:opacity-60">
          {loading ? 'A enviar…' : 'Alterar'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />

      <div className="mt-4 flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'A enviar…' : fotoUrl ? 'Substituir foto' : 'Adicionar foto'}
        </Button>
        {fotoUrl && onRemove && (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={loading}
            className="text-campus-danger hover:bg-campus-danger/10"
            onClick={onRemove}
          >
            Remover foto
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-campus-muted">JPG, PNG ou WebP · máx. {MAX_AVATAR_MB} MB</p>
    </div>
  );
};
