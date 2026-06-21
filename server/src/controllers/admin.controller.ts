import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { sendSuccess } from '../utils/apiResponse';
import { paramString } from '../utils/requestParams';

const actorId = (req: Request): string | undefined => req.user?.userId;

export const overview = async (_req: Request, res: Response): Promise<void> => {
  const data = await adminService.getAdminOverview();
  sendSuccess(res, data, 'Resumo da plataforma');
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await adminService.listCategories();
  sendSuccess(res, { categories }, 'Categorias');
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await adminService.listUsers();
  sendSuccess(res, { users }, 'Utilizadores');
};

export const patchUser = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const user = await adminService.updateUser(paramString(req.params.id), id, {
    nome: typeof req.body.nome === 'string' ? req.body.nome : undefined,
    role: typeof req.body.role === 'string' ? req.body.role : undefined,
  });
  sendSuccess(res, { user }, 'Utilizador actualizado');
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  await adminService.removeUser(paramString(req.params.id), id);
  sendSuccess(res, null, 'Utilizador eliminado');
};

export const getPodcasts = async (_req: Request, res: Response): Promise<void> => {
  const podcasts = await adminService.listPodcasts();
  sendSuccess(res, { podcasts }, 'Publicações');
};

export const postPodcast = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const podcast = await adminService.createPodcast(id, {
    title: String(req.body.title ?? ''),
    description: typeof req.body.description === 'string' ? req.body.description : undefined,
    category_id:
      req.body.category_id === null || req.body.category_id === ''
        ? null
        : Number(req.body.category_id) || undefined,
    user_id: String(req.body.user_id ?? ''),
  });
  sendSuccess(res, { podcast }, 'Publicação criada', 201);
};

export const patchPodcast = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const podcast = await adminService.updatePodcast(paramString(req.params.id), id, {
    title: typeof req.body.title === 'string' ? req.body.title : undefined,
    description: typeof req.body.description === 'string' ? req.body.description : undefined,
    category_id:
      req.body.category_id === null || req.body.category_id === ''
        ? null
        : req.body.category_id !== undefined
          ? Number(req.body.category_id)
          : undefined,
  });
  sendSuccess(res, { podcast }, 'Publicação actualizada');
};

export const deletePodcast = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  await adminService.removePodcast(paramString(req.params.id), id);
  sendSuccess(res, null, 'Publicação eliminada');
};

export const getStreams = async (_req: Request, res: Response): Promise<void> => {
  const streams = await adminService.listStreams();
  sendSuccess(res, { streams }, 'Transmissões');
};

export const postStream = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const stream = await adminService.createStream(id, {
    title: String(req.body.title ?? ''),
    description: typeof req.body.description === 'string' ? req.body.description : undefined,
    status: typeof req.body.status === 'string' ? req.body.status : undefined,
    host_user_id:
      req.body.host_user_id === null || req.body.host_user_id === ''
        ? null
        : String(req.body.host_user_id ?? '') || null,
    scheduled_at:
      typeof req.body.scheduled_at === 'string' && req.body.scheduled_at
        ? req.body.scheduled_at
        : null,
  });
  sendSuccess(res, { stream }, 'Transmissão criada', 201);
};

export const patchStream = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const stream = await adminService.updateStream(paramString(req.params.id), id, {
    title: typeof req.body.title === 'string' ? req.body.title : undefined,
    description: typeof req.body.description === 'string' ? req.body.description : undefined,
    status: typeof req.body.status === 'string' ? req.body.status : undefined,
    host_user_id:
      req.body.host_user_id === null || req.body.host_user_id === ''
        ? null
        : req.body.host_user_id !== undefined
          ? String(req.body.host_user_id)
          : undefined,
    scheduled_at:
      req.body.scheduled_at !== undefined
        ? req.body.scheduled_at
          ? String(req.body.scheduled_at)
          : null
        : undefined,
  });
  sendSuccess(res, { stream }, 'Transmissão actualizada');
};

export const deleteStream = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  await adminService.removeStream(paramString(req.params.id), id);
  sendSuccess(res, null, 'Transmissão eliminada');
};

export const getLogs = async (_req: Request, res: Response): Promise<void> => {
  const logs = await adminService.listLogs();
  sendSuccess(res, { logs }, 'Registo de actividade');
};
