import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as certModel from '../models/cert.model';
import * as downloadModel from '../models/download.model';
import {
  listAllowedClients,
  allowClient,
  revokeClient,
} from '../security/allowedClients';
import { sendSuccess } from '../utils/apiResponse';
import { paramString } from '../utils/requestParams';

const actorId = (req: Request): string | undefined => req.user?.userId;
const certInfo = (req: Request) => req.clientCert ?? null;

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
  }, certInfo(req));
  sendSuccess(res, { user }, 'Utilizador actualizado');
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = actorId(req);
  if (!id) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  await adminService.removeUser(paramString(req.params.id), id, certInfo(req));
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

  // Task 9 — Separação de papéis: administradores não podem publicar podcasts.
  // Publicação é exclusiva do papel 'creator'. O admin gere a plataforma.
  res.status(403).json({
    success: false,
    message: 'Administradores não podem publicar podcasts. Separação de papéis (Task 9): use uma conta de criador.',
    data: null,
  });
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

  await adminService.removePodcast(paramString(req.params.id), id, certInfo(req));
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

// ── Gestão de Certificados CA (Task 4) ────────────────────────────────────────

export const getCerts = async (_req: Request, res: Response): Promise<void> => {
  const certs = await certModel.listIssuedCerts();
  sendSuccess(res, { certs }, 'Certificados emitidos pela CA-CAMPUS');
};

export const registerCert = async (req: Request, res: Response): Promise<void> => {
  const { cn, issued_to, expires_at, fingerprint } = req.body as {
    cn?: string;
    issued_to?: string;
    expires_at?: string;
    fingerprint?: string;
  };
  if (!cn || !issued_to) {
    res.status(400).json({ success: false, message: 'cn e issued_to são obrigatórios', data: null });
    return;
  }
  const cert = await certModel.registerCert(cn, issued_to, expires_at ?? null, fingerprint ?? null);
  sendSuccess(res, { cert }, 'Certificado registado na CA', 201);
};

// ── Protecção contra Pirataria (Task 5) ──────────────────────────────────────

export const getDownloads = async (_req: Request, res: Response): Promise<void> => {
  const downloads = await downloadModel.listDownloadsForAdmin();
  sendSuccess(res, { downloads }, 'Histórico de downloads');
};

export const getPiracyAlerts = async (_req: Request, res: Response): Promise<void> => {
  const alerts = await downloadModel.detectPiracyAlerts();
  sendSuccess(res, { alerts }, 'Análise de pirataria');
};

export const revokeCert = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const reason = typeof req.body.reason === 'string' ? req.body.reason : 'Revogado pelo administrador';
  const cert = await certModel.revokeCert(id, reason);
  if (!cert) {
    res.status(404).json({ success: false, message: 'Certificado não encontrado', data: null });
    return;
  }
  sendSuccess(res, { cert }, 'Certificado revogado');
};

// ── Mecanismo de Excepção — Allowlist (Task 8) ───────────────────────────────

export const getAllowlist = async (_req: Request, res: Response): Promise<void> => {
  const clients = listAllowedClients();
  sendSuccess(res, { clients }, 'Lista de excepções (clientes sem certificado)');
};

export const addToAllowlist = async (req: Request, res: Response): Promise<void> => {
  const { ip, reason } = req.body as { ip?: string; reason?: string };
  if (!ip || typeof ip !== 'string') {
    res.status(400).json({ success: false, message: 'ip é obrigatório', data: null });
    return;
  }
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/;
  if (!ipRegex.test(ip)) {
    res.status(400).json({ success: false, message: 'Formato de IP inválido', data: null });
    return;
  }
  allowClient(ip, reason ?? 'Adicionado manualmente pelo administrador');
  sendSuccess(res, { ip }, 'IP adicionado à lista de excepções', 201);
};

export const removeFromAllowlist = async (req: Request, res: Response): Promise<void> => {
  const rawIp = req.params.ip;
  const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
  const removed = revokeClient(decodeURIComponent(ip));
  if (!removed) {
    res.status(404).json({ success: false, message: 'IP não encontrado na allowlist', data: null });
    return;
  }
  sendSuccess(res, { ip }, 'IP removido da lista de excepções');
};
