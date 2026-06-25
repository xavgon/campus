import { useState } from 'react';
import type { User } from '@/features/auth/types/auth.types';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { Alert } from '@/shared/components/campus/Alert';
import { getApiErrorMessage } from '@/shared/api/client';
import { ERROR_TITLES } from '@/shared/copy/campusMessages';
import { Button } from '@/shared/components/ui/Button';

interface ProfileCreatorSectionProps {
  user: User;
  onBecomeCreator: () => Promise<void>;
  onLeaveCreator: () => Promise<{ podcasts: number; streams: number }>;
}

export const ProfileCreatorSection = ({
  user,
  onBecomeCreator,
  onLeaveCreator,
}: ProfileCreatorSectionProps) => {
  const [acceptedUpgrade, setAcceptedUpgrade] = useState(false);
  const [acceptedLeave, setAcceptedLeave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isCreator = user.role === 'creator';
  const isAdmin = user.role === 'admin';
  const canUpgrade = user.role === 'user';
  const canLeave = user.role === 'creator';

  const handleUpgrade = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await onBecomeCreator();
      setAcceptedUpgrade(false);
      setNotice('Conta de criador activada. Já podes publicar episódios e transmitir ao vivo.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const deleted = await onLeaveCreator();
      setAcceptedLeave(false);
      const total = deleted.podcasts + deleted.streams;
      setNotice(
        total > 0
          ? `Deixaste de ser criador. Foram eliminados ${deleted.podcasts} episódio(s) e ${deleted.streams} transmissão(ões).`
          : 'Deixaste de ser criador. A tua conta voltou ao modo de utilizador.',
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileSection
      title="Conta de criador"
      description={
        canUpgrade
          ? 'Activa gratuitamente para publicar podcasts e iniciar transmissões ao vivo.'
          : canLeave
            ? 'Gere as permissões de publicação na plataforma.'
            : 'Permissões de publicação na plataforma.'
      }
    >
      {error && (
        <Alert
          title={canLeave ? ERROR_TITLES.creatorLeave : ERROR_TITLES.creatorActivate}
          message={error}
        />
      )}

      {notice && (
        <ProfileNotice
          title={notice.includes('Deixaste') ? 'Conta actualizada' : 'Criador activo'}
          message={notice}
          variant="success"
        />
      )}

      {isAdmin && (
        <ProfileNotice
          title="Administrador"
          message="A tua conta de administrador já inclui permissões de criador — publicar, editar e transmitir ao vivo."
          variant="info"
        />
      )}

      {isCreator && !notice && (
        <ProfileNotice
          title="És criador"
          message="Podes publicar episódios em Podcasts → Publicar episódio e iniciar transmissões em Ao vivo."
          variant="success"
        />
      )}

      {canUpgrade && (
        <div className="space-y-5">
          <ul className="space-y-2 text-sm text-campus-accent">
            <li className="flex gap-2">
              <span className="text-campus-primary" aria-hidden>
                •
              </span>
              Publicar podcasts com áudio, vídeo e capa
            </li>
            <li className="flex gap-2">
              <span className="text-campus-primary" aria-hidden>
                •
              </span>
              Transmitir ao vivo para outros utilizadores
            </li>
            <li className="flex gap-2">
              <span className="text-campus-primary" aria-hidden>
                •
              </span>
              Gerir os teus episódios na biblioteca
            </li>
          </ul>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-campus-accent">
            <input
              type="checkbox"
              checked={acceptedUpgrade}
              onChange={(e) => setAcceptedUpgrade(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-none border-campus-border accent-campus-primary"
            />
            <span>
              Confirmo que o conteúdo que publicar será educativo e está de acordo com as regras da
              plataforma.
            </span>
          </label>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!acceptedUpgrade || loading}
              onClick={() => void handleUpgrade()}
            >
              {loading ? 'A activar…' : 'Tornar-me criador'}
            </Button>
          </div>
        </div>
      )}

      {canLeave && (
        <div className="mt-6 space-y-5 border-t border-campus-border/60 pt-6">
          <ProfileNotice
            title="Atenção"
            message="Ao deixar de ser criador, todos os teus episódios e transmissões serão eliminados permanentemente. Esta acção não pode ser desfeita."
            variant="info"
          />

          <label className="flex cursor-pointer items-start gap-3 text-sm text-campus-accent">
            <input
              type="checkbox"
              checked={acceptedLeave}
              onChange={(e) => setAcceptedLeave(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-none border-campus-border accent-campus-primary"
            />
            <span>
              Compreendo que todo o meu conteúdo publicado será apagado e que deixarei de poder
              publicar ou transmitir ao vivo.
            </span>
          </label>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!acceptedLeave || loading}
              className="border-campus-danger/40 text-campus-danger hover:border-campus-danger hover:bg-campus-danger/10"
              onClick={() => void handleLeave()}
            >
              {loading ? 'A processar…' : 'Deixar de ser criador'}
            </Button>
          </div>
        </div>
      )}
    </ProfileSection>
  );
};
