/**
 * Copy centralizado do CAMPUS — erros, títulos de alertas, toasts e mensagens de estado.
 * Tom: claro, próximo, pt-PT, sem jargão técnico desnecessário.
 */

export const ERROR_TITLES = {
  generic: 'Ups, algo falhou',
  login: 'Não conseguimos iniciar sessão',
  register: 'Conta não criada',
  forgotPassword: 'Pedido não enviado',
  resetPassword: 'Password não redefinida',
  load: 'Não conseguimos carregar',
  save: 'Alterações não guardadas',
  publish: 'Publicação não concluída',
  delete: 'Não foi possível eliminar',
  download: 'Download interrompido',
  liveBroadcast: 'Transmissão interrompida',
  liveWatch: 'Emissão indisponível',
  livePublishRecording: 'Episódio não publicado',
  profile: 'Perfil não actualizado',
  password: 'Password não alterada',
  creatorActivate: 'Criador não activado',
  creatorLeave: 'Conta de criador não encerrada',
  categories: 'Categorias indisponíveis',
  podcastNotFound: 'Episódio não encontrado',
  podcastInvalid: 'Link inválido',
  playback: 'Reprodução indisponível',
  comment: 'Comentário não enviado',
} as const;

export type ErrorTitleKey = keyof typeof ERROR_TITLES;

export const SESSION_COPY = {
  expiredTitle: 'Sessão terminada',
  expiredBanner:
    'Por segurança, a tua sessão expirou. Entra outra vez para continuares no CAMPUS.',
  expiredToast: 'A tua sessão expirou. Inicia sessão para continuares.',
  expiredToastTitle: 'Sessão terminada',
  invalidToken: 'Precisas de iniciar sessão para continuar.',
} as const;

export const API_COPY = {
  generic: 'Algo correu mal no CAMPUS. Tenta outra vez dentro de momentos.',
  timeout: 'O pedido demorou demasiado — verifica a ligação e tenta novamente.',
  networkDev:
    'O CAMPUS não está a conseguir falar com o servidor. Na pasta server, corre npm run dev.',
  networkElectron:
    'Não encontrámos o servidor CAMPUS. Confirma que está a correr em https://localhost:3001.',
  networkProd:
    'Sem ligação ao CAMPUS neste momento. Verifica a internet e tenta de novo.',
  toastDefaultTitle: 'Não conseguimos concluir',
} as const;

export const HTTP_STATUS_COPY: Record<number, string> = {
  400: 'Os dados enviados não são válidos. Revê o formulário e tenta outra vez.',
  401: 'Precisas de iniciar sessão para continuar.',
  403: 'Não tens permissão para esta acção no CAMPUS.',
  404: 'Não encontrámos o que procuravas — pode ter sido removido.',
  409: 'Já existe um registo com estes dados ou houve um conflito. Actualiza a página.',
  413: 'O ficheiro é demasiado grande. Escolhe um ficheiro mais pequeno.',
  422: 'Alguns campos precisam de correção antes de continuar.',
  429: 'Demasiados pedidos seguidos. Aguarda um momento e tenta de novo.',
  500: 'O servidor do CAMPUS teve um problema. Tenta outra vez mais tarde.',
  502: 'O CAMPUS está temporariamente indisponível. Tenta dentro de momentos.',
  503: 'Estamos em manutenção ou sobrecarga. Volta a tentar daqui a pouco.',
  504: 'O servidor demorou a responder. Verifica a ligação e tenta novamente.',
};

/** Mensagens exactas da API → copy mais amigável no cliente */
export const SERVER_MESSAGE_OVERRIDES: Record<string, string> = {
  'Autenticação necessária': SESSION_COPY.invalidToken,
  'Email ou password incorretos':
    'Email ou password incorrectos. Verifica os dados e tenta outra vez.',
  'Token inválido ou expirado': 'O link ou a sessão expirou. Pede um novo ou entra outra vez.',
  'Token inválido': 'Link inválido ou expirado. Pede um novo reset de password.',
  'Email já registado': 'Este email já tem conta no CAMPUS. Tenta iniciar sessão.',
  'Email inválido': 'Introduz um endereço de email válido.',
  'Password deve ter pelo menos 6 caracteres': 'A password precisa de pelo menos 6 caracteres.',
  'Nova password deve ter pelo menos 6 caracteres': 'A nova password precisa de pelo menos 6 caracteres.',
  'A nova password deve ser diferente da actual':
    'Escolhe uma password diferente da que usas actualmente.',
  'Password actual incorrecta': 'A password actual não está correcta.',
  'Nome deve ter pelo menos 2 caracteres': 'O nome precisa de pelo menos 2 caracteres.',
  'Nome demasiado curto': 'O nome precisa de pelo menos 2 caracteres.',
  'Dados inválidos': 'Revê os campos do formulário e tenta outra vez.',
  'Nada para actualizar': 'Não há alterações para guardar.',
  'Utilizador não encontrado': 'Conta não encontrada. Pode ter sido removida.',
  'Podcast não encontrado': 'Este episódio já não está disponível.',
  'Publicação não encontrada': 'Esta publicação já não existe.',
  'Transmissão não encontrada': 'Esta transmissão já não existe.',
  'Sem permissão para editar este podcast': 'Só o autor pode editar este episódio.',
  'Podcast não encontrado ou sem permissão para eliminar':
    'Não podes eliminar este episódio ou ele já foi removido.',
  'Apenas criadores podem publicar podcasts':
    'Precisas de conta de criador para publicar no CAMPUS.',
  'Acesso reservado a administradores': 'Esta área é só para administradores.',
  'Ficheiro de áudio ou vídeo é obrigatório': 'Escolhe um ficheiro de áudio ou vídeo para publicar.',
  'Este podcast ainda não tem ficheiro de áudio':
    'O áudio deste episódio ainda não está pronto para ouvir.',
  'Ficheiro de áudio não encontrado no servidor':
    'O ficheiro de áudio não está disponível neste momento.',
  'Este episódio não tem vídeo': 'Este episódio é só de áudio.',
  'Não foi possível activar a conta de criador':
    'Não foi possível activar a conta de criador. Tenta outra vez.',
  'Administradores não podem deixar de ser criadores por esta via':
    'Contas de administrador não usam o modo criador.',
  'Conta de administrador já tem permissões de criador':
    'Contas de administrador não podem activar o modo criador.',
  'Contas de administrador não podem activar o modo criador':
    'A gestão de conteúdo é feita no painel Admin; para publicar, usa uma conta de criador.',
  'Contas de administrador não usam o modo criador':
    'A tua conta de administrador foca-se na gestão da plataforma.',
  'Erro ao actualizar foto': 'Não conseguimos actualizar a foto de perfil. Tenta outra imagem.',
  'Erro ao remover foto': 'Não conseguimos remover a foto de perfil.',
  'Nenhuma imagem enviada': 'Escolhe uma imagem antes de guardar.',
  'Demasiadas tentativas. Tenta novamente em 15 minutos.':
    'Muitas tentativas seguidas. Aguarda 15 minutos e tenta de novo.',
  'O estado «em direto» só pode ser activado quando o criador inicia a transmissão.':
    'O estado «em direto» só muda quando o criador inicia a transmissão.',
  'Ocorreu um erro interno. Tente novamente mais tarde.':
    'O CAMPUS encontrou um problema interno. Tenta outra vez mais tarde.',
};

export const LIVE_COPY = {
  sessionExpired: 'A tua sessão expirou. Entra outra vez no CAMPUS.',
  broadcastConnectFailed:
    'Não conseguimos ligar ao servidor de transmissão. Confirma que a API está a correr.',
  mediaPermissionFailed:
    'Precisamos de acesso ao microfone ou câmara. Permite no browser e tenta de novo.',
  listenerConnectFailed:
    'Não conseguimos ligar à emissão. Confirma que o servidor está a correr (porta 3001).',
  listenerGenericFailed: 'Não foi possível entrar nesta emissão. Pode já ter terminado.',
  listenerRetryExhausted:
    'A emissão ainda não está disponível. O anfitrião pode estar a preparar tudo — tenta daqui a pouco.',
  listenerJoinFailed: 'Não conseguimos entrar na transmissão. Tenta outra vez.',
  listenerWsFailed: 'Ligação à transmissão perdida. Verifica a rede e tenta novamente.',
  listenerInactive: 'Esta emissão já terminou ou foi cancelada.',
  listenerOffline:
    'O anfitrião está momentaneamente offline. Vamos tentar ligar outra vez…',
  hostReconnecting:
    'O anfitrião perdeu a ligação momentaneamente. Os comentários continuam disponíveis.',
  listenerWaitingHost: 'O anfitrião está a reconectar. Aguarda uns segundos…',
  commentConnectionLost: 'Ligação indisponível. Aguarda um instante antes de comentar.',
  recordingAudioMissing: 'Não há gravação de áudio para publicar.',
  recordingVideoMissing: 'Não há gravação de vídeo. Escolhe publicar só o áudio.',
  reconnectBannerTitle: 'Ligação interrompida',
  reconnectBannerMessage:
    'Estamos a tentar reconectar automaticamente. Se demorar, usa o botão «Reconectar agora».',
} as const;

export const MEDIA_COPY = {
  playbackFailed: 'Não conseguimos reproduzir este episódio. Tenta outra vez mais tarde.',
  autoplayBlocked: 'O browser bloqueou a reprodução. Clica em Reproduzir para começar.',
} as const;

/** Pesquisa de podcasts (RF09). */
export const SEARCH_COPY = {
  placeholder: 'Título, autor, categoria ou tema educativo…',
  exploreTitle: 'Explorar podcasts',
  exploreDescription:
    'Pesquisa episódios por título, autor, categoria ou tema. Entra na tua conta para ouvir e descarregar.',
  loginToListen: 'Entrar para ouvir',
  viewEpisode: 'Ver episódio',
  publicEmpty: 'Ainda não há episódios públicos disponíveis.',
  publicEmptyFilters: 'Nenhum episódio corresponde à pesquisa. Tenta outros termos ou limpa os filtros.',
} as const;

/** Registo de actividades (RF13). */
export const ACTIVITY_COPY = {
  sectionTitle: 'A minha actividade',
  sectionDescription:
    'Últimas acções registadas na tua conta — login, publicações, downloads e alterações de perfil.',
  loading: 'A carregar actividade…',
  empty: 'Ainda não há registos. As acções na plataforma passam a aparecer aqui.',
  refresh: 'Actualizar',
} as const;

/** Gestão de permissões (RF12). */
export const PERMISSIONS_COPY = {
  userDescription: 'Ouve, explora e descarrega episódios. Podes tornar-te criador no perfil.',
  creatorDescription: 'Publica episódios, transmite ao vivo e gere a tua biblioteca.',
  adminDescription: 'Modera utilizadores, publicações, transmissões e segurança — sem publicar conteúdo.',
  creatorOnlyRoute: 'Esta área é reservada a criadores de conteúdo.',
  adminOnlyRoute: 'Esta área é reservada a administradores.',
} as const;

/** Download de episódios (RF11). */
export const DOWNLOAD_COPY = {
  audioButton: 'Descarregar áudio',
  videoButton: 'Descarregar vídeo',
  audioHint: 'Guarda o áudio comprimido no dispositivo para ouvir offline.',
  videoHint: 'Guarda o vídeo comprimido no dispositivo para ver offline.',
  unavailable: 'O download só fica disponível quando a compressão terminar.',
  inProgress: 'A descarregar…',
} as const;

/** Consulta de conteúdos (RF10). */
export const CATALOG_COPY = {
  detailBack: '← Voltar ao catálogo',
  detailEyebrow: 'Detalhe do episódio',
  detailLoginHint: 'Inicia sessão para ouvir, ver o player completo e descarregar o episódio.',
  detailNotFound: 'Este episódio não está disponível no catálogo público.',
} as const;

/** Controlos do leitor multimédia (RF08). */
export const PLAYER_COPY = {
  play: 'Reproduzir',
  pause: 'Pausar',
  stop: 'Parar',
  skipBack: (seconds: number) => `Retroceder ${seconds} segundos`,
  skipForward: (seconds: number) => `Avançar ${seconds} segundos`,
  volume: 'Volume',
  mute: 'Silenciar',
  unmute: 'Activar som',
  seek: 'Posição na faixa',
  fullscreen: 'Ecrã inteiro',
  keyboardHint:
    'Atalhos: Espaço reproduzir/pausar, setas ← → avançar/retroceder, Início parar, M silenciar.',
} as const;

export const VOD_COPY = {
  onDemandTitle: 'Sob demanda',
  onDemandMessage:
    'Este episódio está na biblioteca e podes ouvir ou ver quando quiseres — não é necessário estar em direto.',
  livePublishedNotice:
    'Episódio publicado a partir da transmissão. Já está disponível na biblioteca VOD.',
} as const;

export const EMPTY_STATE_COPY = {
  podcastLoadFailed: 'Não conseguimos carregar este episódio.',
  podcastInvalidId: 'O link deste episódio não é válido.',
} as const;

const REQUIRED_FIELD_PATTERN = /^(.+) é obrigatório$/u;
const MAX_LENGTH_PATTERN = /^(.+) não pode ter mais de (\d+) caracteres$/u;

/** Converte mensagens técnicas do servidor em copy amigável */
export const humanizeServerMessage = (message: string): string => {
  const trimmed = message.trim();
  if (!trimmed) return API_COPY.generic;

  const exact = SERVER_MESSAGE_OVERRIDES[trimmed];
  if (exact) return exact;

  const required = REQUIRED_FIELD_PATTERN.exec(trimmed);
  if (required) {
    return `Preenche o campo «${required[1]}» para continuar.`;
  }

  const maxLen = MAX_LENGTH_PATTERN.exec(trimmed);
  if (maxLen) {
    return `«${maxLen[1]}» não pode ultrapassar ${maxLen[2]} caracteres.`;
  }

  return trimmed;
};

export const httpStatusMessage = (status: number): string | null =>
  HTTP_STATUS_COPY[status] ?? null;

export const liveListenerCloseMessage = (code: number, reason: string): string => {
  if (code === 1008) {
    if (reason === 'Live offline' || reason.includes('reconectar')) {
      return LIVE_COPY.listenerOffline;
    }
    return reason.trim() || LIVE_COPY.listenerInactive;
  }
  if (code === 1006) {
    return LIVE_COPY.listenerConnectFailed;
  }
  return LIVE_COPY.listenerGenericFailed;
};
