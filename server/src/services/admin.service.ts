import { DEFAULT_ADMIN_EMAIL } from '../database/seedAdmin';
import { AppError } from '../middleware/errorHandler';
import * as categoryModel from '../models/category.model';
import * as logModel from '../models/log.model';
import * as podcastModel from '../models/podcast.model';
import * as streamModel from '../models/stream.model';
import * as userModel from '../models/user.model';
import { getOnlineSnapshot } from './presence.service';
import type { UserRole } from '../types/roles';
import { isUserRole } from '../types/roles';

const recordLog = async (actorId: string, action: string) => {
  await logModel.insertLog(actorId, action);
};

export const getAdminOverview = async () => {
  const [usersCount, podcastsCount, streamsCount, liveStreams, online] = await Promise.all([
    userModel.countUsers(),
    podcastModel.countPodcasts(),
    streamModel.countStreams(),
    streamModel.countStreamsByStatus('live'),
    Promise.resolve(getOnlineSnapshot()),
  ]);

  return {
    usersCount,
    podcastsCount,
    streamsCount,
    onlineCount: online.count,
    liveStreams,
  };
};

export const listCategories = () => categoryModel.listCategories();

export const listUsers = () => userModel.listUsersForAdmin();

export const updateUser = async (
  targetId: string,
  actorId: string,
  data: { nome?: string; role?: string },
) => {
  if (data.role !== undefined && !isUserRole(data.role)) {
    throw new AppError('Papel inválido', 400);
  }

  const target = await userModel.findUserById(targetId);
  if (!target) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  if (target.email === DEFAULT_ADMIN_EMAIL.toLowerCase() && data.role === 'user') {
    throw new AppError('Não é possível remover o papel de administrador da conta principal', 400);
  }

  if (targetId === actorId && data.role === 'user') {
    throw new AppError('Não podes remover o teu próprio acesso de administrador', 400);
  }

  if (data.nome !== undefined && data.nome.trim().length < 2) {
    throw new AppError('Nome demasiado curto', 400);
  }

  const updated = await userModel.updateUserByAdmin(targetId, {
    nome: data.nome?.trim(),
    role: data.role as UserRole | undefined,
  });

  if (!updated) {
    throw new AppError('Nada para actualizar', 400);
  }

  await recordLog(actorId, `Utilizador actualizado: ${updated.email}`);
  return updated;
};

export const removeUser = async (targetId: string, actorId: string) => {
  if (targetId === actorId) {
    throw new AppError('Não podes eliminar a tua própria conta aqui', 400);
  }

  const target = await userModel.findUserById(targetId);
  if (!target) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  if (target.email === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    throw new AppError('A conta de administrador principal não pode ser eliminada', 400);
  }

  const removed = await userModel.deleteUserById(targetId);
  if (!removed) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  await recordLog(actorId, `Utilizador eliminado: ${target.email}`);
};

export const listPodcasts = () => podcastModel.listPodcastsForAdmin();

export const createPodcast = async (
  actorId: string,
  data: { title: string; description?: string; category_id?: number | null; user_id: string },
) => {
  if (!data.title.trim()) {
    throw new AppError('Título obrigatório', 400);
  }

  const author = await userModel.findUserById(data.user_id);
  if (!author) {
    throw new AppError('Autor não encontrado', 404);
  }

  const podcast = await podcastModel.createPodcast({
    title: data.title.trim(),
    description: data.description?.trim() ?? null,
    category_id: data.category_id ?? null,
    user_id: data.user_id,
  });

  await recordLog(actorId, `Publicação criada: ${podcast.title}`);
  return podcast;
};

export const updatePodcast = async (
  id: string,
  actorId: string,
  data: { title?: string; description?: string; category_id?: number | null },
) => {
  const updated = await podcastModel.updatePodcastById(id, {
    title: data.title?.trim(),
    description: data.description !== undefined ? data.description.trim() : undefined,
    category_id: data.category_id,
  });

  if (!updated) {
    throw new AppError('Publicação não encontrada ou sem alterações', 404);
  }

  await recordLog(actorId, `Publicação actualizada: ${updated.title}`);
  return updated;
};

export const removePodcast = async (id: string, actorId: string) => {
  const list = await podcastModel.listPodcastsForAdmin();
  const existing = list.find((p) => p.id === id);
  const removed = await podcastModel.deletePodcastById(id);
  if (!removed) {
    throw new AppError('Publicação não encontrada', 404);
  }
  await recordLog(actorId, `Publicação eliminada: ${existing?.title ?? id}`);
};

export const listStreams = () => streamModel.listStreamsForAdmin();

export const createStream = async (
  actorId: string,
  data: {
    title: string;
    description?: string;
    status?: string;
    host_user_id?: string | null;
    scheduled_at?: string | null;
  },
) => {
  if (!data.title.trim()) {
    throw new AppError('Título obrigatório', 400);
  }

  if (data.status && !['scheduled', 'live', 'ended'].includes(data.status)) {
    throw new AppError('Estado inválido', 400);
  }

  if (data.host_user_id) {
    const host = await userModel.findUserById(data.host_user_id);
    if (!host) throw new AppError('Anfitrião não encontrado', 404);
  }

  const stream = await streamModel.createStream({
    title: data.title.trim(),
    description: data.description?.trim() ?? null,
    status: data.status as streamModel.StreamStatus | undefined,
    host_user_id: data.host_user_id ?? null,
    scheduled_at: data.scheduled_at ?? null,
  });

  await recordLog(actorId, `Transmissão criada: ${stream.title}`);
  return stream;
};

export const updateStream = async (
  id: string,
  actorId: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    host_user_id?: string | null;
    scheduled_at?: string | null;
  },
) => {
  if (data.status && !['scheduled', 'live', 'ended'].includes(data.status)) {
    throw new AppError('Estado inválido', 400);
  }

  if (data.host_user_id) {
    const host = await userModel.findUserById(data.host_user_id);
    if (!host) throw new AppError('Anfitrião não encontrado', 404);
  }

  const updated = await streamModel.updateStream(id, {
    title: data.title?.trim(),
    description: data.description !== undefined ? data.description.trim() : undefined,
    status: data.status as streamModel.StreamStatus | undefined,
    host_user_id: data.host_user_id,
    scheduled_at: data.scheduled_at,
  });

  if (!updated) {
    throw new AppError('Transmissão não encontrada ou sem alterações', 404);
  }

  await recordLog(actorId, `Transmissão actualizada: ${updated.title}`);
  return updated;
};

export const setStreamStatus = async (id: string, actorId: string, status: string) => {
  const updated = await updateStream(id, actorId, { status });
  return updated;
};

export const removeStream = async (id: string, actorId: string) => {
  const streams = await streamModel.listStreamsForAdmin();
  const existing = streams.find((s) => s.id === id);
  const removed = await streamModel.deleteStreamById(id);
  if (!removed) {
    throw new AppError('Transmissão não encontrada', 404);
  }
  await recordLog(actorId, `Transmissão eliminada: ${existing?.title ?? id}`);
};

export const listLogs = () => logModel.listLogsForAdmin();
