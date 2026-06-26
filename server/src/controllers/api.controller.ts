import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';

export interface ApiEndpointDoc {
  method: string;
  path: string;
  auth: boolean | 'admin' | 'creator';
  description: string;
}

export interface ApiResourceGroup {
  group: string;
  basePath: string;
  endpoints: ApiEndpointDoc[];
}

const API_RESOURCES: ApiResourceGroup[] = [
  {
    group: 'health',
    basePath: '/api/health',
    endpoints: [{ method: 'GET', path: '/', auth: false, description: 'Estado do serviço e da base de dados' }],
  },
  {
    group: 'auth',
    basePath: '/api/auth',
    endpoints: [
      { method: 'POST', path: '/register', auth: false, description: 'Criar conta' },
      { method: 'POST', path: '/login', auth: false, description: 'Autenticação — devolve JWT' },
      { method: 'GET', path: '/profile', auth: true, description: 'Perfil do utilizador autenticado' },
      { method: 'PUT', path: '/profile', auth: true, description: 'Actualizar dados pessoais' },
      { method: 'GET', path: '/activity', auth: true, description: 'Últimas acções do utilizador' },
      { method: 'POST', path: '/profile/become-creator', auth: true, description: 'Activar conta de criador' },
    ],
  },
  {
    group: 'categories',
    basePath: '/api/categories',
    endpoints: [
      { method: 'GET', path: '/public', auth: false, description: 'Lista de categorias (público)' },
      { method: 'GET', path: '/', auth: true, description: 'Lista de categorias (autenticado)' },
    ],
  },
  {
    group: 'podcasts',
    basePath: '/api/podcasts',
    endpoints: [
      { method: 'GET', path: '/public', auth: false, description: 'Catálogo público com pesquisa' },
      { method: 'GET', path: '/public/:id', auth: false, description: 'Detalhe público de episódio' },
      { method: 'GET', path: '/', auth: true, description: 'Biblioteca autenticada com paginação' },
      { method: 'GET', path: '/:id', auth: true, description: 'Detalhe de episódio' },
      { method: 'POST', path: '/', auth: 'creator', description: 'Publicar episódio (multipart)' },
      { method: 'PATCH', path: '/:id', auth: true, description: 'Actualizar metadados' },
      { method: 'DELETE', path: '/:id', auth: true, description: 'Eliminar episódio' },
      { method: 'GET', path: '/:id/download', auth: true, description: 'Download offline' },
      { method: 'GET', path: '/:id/compression-progress', auth: true, description: 'Progresso FFmpeg' },
    ],
  },
  {
    group: 'stream',
    basePath: '/api/stream',
    endpoints: [
      {
        method: 'GET',
        path: '/:id',
        auth: true,
        description: 'Streaming de áudio (Bearer ou ?token=)',
      },
      { method: 'GET', path: '/:id/video', auth: true, description: 'Streaming de vídeo' },
    ],
  },
  {
    group: 'live',
    basePath: '/api/live',
    endpoints: [
      { method: 'GET', path: '/', auth: true, description: 'Transmissões activas' },
      { method: 'GET', path: '/scheduled', auth: 'creator', description: 'Agenda do criador' },
      { method: 'GET', path: '/recordings', auth: 'creator', description: 'Gravações do servidor' },
      { method: 'POST', path: '/recordings/:id/publish', auth: 'creator', description: 'Publicar VOD' },
    ],
  },
  {
    group: 'presence',
    basePath: '/api/presence',
    endpoints: [
      { method: 'POST', path: '/heartbeat', auth: true, description: 'Manter sessão online' },
      { method: 'POST', path: '/leave', auth: true, description: 'Sair da presença' },
      { method: 'GET', path: '/online', auth: true, description: 'Utilizadores ligados' },
    ],
  },
  {
    group: 'admin',
    basePath: '/api/admin',
    endpoints: [
      { method: 'GET', path: '/overview', auth: 'admin', description: 'Métricas da plataforma' },
      { method: 'GET', path: '/users', auth: 'admin', description: 'Gestão de utilizadores' },
      { method: 'GET', path: '/podcasts', auth: 'admin', description: 'Moderação de publicações' },
      { method: 'GET', path: '/streams', auth: 'admin', description: 'Gestão de transmissões' },
      { method: 'GET', path: '/logs', auth: 'admin', description: 'Registo de actividades' },
    ],
  },
];

/** RF14 — Índice da API REST (descoberta de recursos). */
export const getApiIndex = (_req: Request, res: Response): void => {
  sendSuccess(
    res,
    {
      name: 'CAMPUS API',
      version: '1.0.0',
      description: 'API RESTful para comunicação entre cliente e servidor',
      baseUrl: '/api',
      protocol: 'HTTPS + mTLS',
      envelope: {
        success: { success: true, message: 'string', data: 'T' },
        error: { success: false, message: 'string', data: null },
      },
      authentication: {
        type: 'Bearer JWT',
        header: 'Authorization: Bearer <token>',
        streamQuery: '?token=<jwt> (streaming de áudio/vídeo)',
      },
      resources: API_RESOURCES,
      websocket: {
        path: '/live',
        query: 'token, role=broadcaster|listener, liveId',
        description: 'Transmissão ao vivo em tempo real (não REST)',
      },
    },
    'CAMPUS REST API',
  );
};
