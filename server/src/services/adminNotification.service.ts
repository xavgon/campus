import type { Podcast } from '../models/podcast.model';
import type { PublicUser } from '../models/user.model';
import {
  countUnreadAdminNotifications,
  insertAdminNotification,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationRow,
  type AdminNotificationSeverity,
  type CreateAdminNotificationInput,
} from '../models/adminNotification.model';

const notify = async (input: CreateAdminNotificationInput): Promise<void> => {
  try {
    await insertAdminNotification(input);
  } catch (error) {
    console.error('[CAMPUS] Falha ao criar notificação admin:', error);
  }
};

export const notifyUserRegistered = async (user: PublicUser): Promise<void> => {
  await notify({
    type: 'user.registered',
    severity: 'info',
    title: 'Novo registo',
    message: `${user.nome} (${user.email}) criou conta na plataforma.`,
    actorUserId: user.id,
    targetHref: '/admin/users',
  });
};

export const notifyUserBecameCreator = async (user: PublicUser): Promise<void> => {
  await notify({
    type: 'user.became_creator',
    severity: 'success',
    title: 'Novo criador',
    message: `${user.nome} activou a conta de criador.`,
    actorUserId: user.id,
    targetHref: '/admin/users',
  });
};

export const notifyUserLeftCreator = async (
  user: PublicUser,
  deleted: { podcasts: number; streams: number },
): Promise<void> => {
  await notify({
    type: 'user.left_creator',
    severity: 'warning',
    title: 'Criador desactivado',
    message: `${user.nome} deixou de ser criador. Eliminados ${deleted.podcasts} episódio(s) e ${deleted.streams} transmissão(ões).`,
    actorUserId: user.id,
    targetHref: '/admin/users',
  });
};

export const notifyPodcastPublished = async (podcast: Podcast): Promise<void> => {
  await notify({
    type: 'podcast.published',
    severity: 'info',
    title: 'Novo episódio',
    message: `«${podcast.title}» por ${podcast.author_nome} — compressão em curso.`,
    actorUserId: podcast.user_id,
    targetHref: `/admin/posts`,
  });
};

export const notifyPodcastCatalogReady = async (podcast: Podcast): Promise<void> => {
  await notify({
    type: 'podcast.catalog_ready',
    severity: 'success',
    title: 'Episódio no catálogo',
    message: `«${podcast.title}» de ${podcast.author_nome} está disponível no catálogo público.`,
    actorUserId: podcast.user_id,
    targetHref: '/admin/posts',
  });
};

export const notifyPodcastCompressionFailed = async (
  podcast: Podcast,
): Promise<void> => {
  await notify({
    type: 'podcast.compression_failed',
    severity: 'warning',
    title: 'Falha na compressão',
    message: `Não foi possível concluir a compressão de «${podcast.title}» (${podcast.author_nome}).`,
    actorUserId: podcast.user_id,
    targetHref: '/admin/posts',
  });
};

export const notifyLiveStarted = async (opts: {
  streamId: string;
  title: string;
  hostUserId: string;
  hostLabel: string;
}): Promise<void> => {
  await notify({
    type: 'live.started',
    severity: 'success',
    title: 'Transmissão ao vivo',
    message: `${opts.hostLabel} iniciou «${opts.title}».`,
    actorUserId: opts.hostUserId,
    targetHref: '/admin/transmissions',
  });
};

export const notifyLiveEnded = async (opts: {
  streamId: string;
  title: string;
  hostUserId: string;
  hostLabel: string;
}): Promise<void> => {
  await notify({
    type: 'live.ended',
    severity: 'info',
    title: 'Transmissão terminada',
    message: `«${opts.title}» de ${opts.hostLabel} terminou.`,
    actorUserId: opts.hostUserId,
    targetHref: '/admin/transmissions',
  });
};

export const notifyPasswordResetRequested = async (email: string): Promise<void> => {
  await notify({
    type: 'security.password_reset',
    severity: 'warning',
    title: 'Pedido de recuperação',
    message: `Foi solicitado reset de password para ${email}.`,
    targetHref: '/admin/users',
  });
};

export const listNotificationsForAdmin = async (opts?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminNotificationRow[]> => listAdminNotifications(opts);

export const getUnreadNotificationCount = async (): Promise<number> =>
  countUnreadAdminNotifications();

export const markNotificationRead = async (id: number): Promise<boolean> =>
  markAdminNotificationRead(id);

export const markAllNotificationsRead = async (): Promise<number> =>
  markAllAdminNotificationsRead();

export type { AdminNotificationRow, AdminNotificationSeverity };
