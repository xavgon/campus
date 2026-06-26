export type ManualAudience = 'all' | 'visitor' | 'user' | 'creator' | 'admin';

export interface ManualStep {
  title: string;
  body: string;
}

export interface ManualLink {
  label: string;
  to: string;
}

export interface ManualSection {
  id: string;
  title: string;
  summary: string;
  audience: ManualAudience[];
  paragraphs: string[];
  steps?: ManualStep[];
  links?: ManualLink[];
}

export const MANUAL_PAGE = {
  eyebrow: 'Documentação',
  title: 'Manual de utilizador',
  description:
    'Guia completo do CAMPUS — explorar conteúdos, gerir a tua conta, publicar como criador e administrar a plataforma.',
  updated: 'Junho 2026',
} as const;

export const MANUAL_AUDIENCE_LABELS: Record<ManualAudience, string> = {
  all: 'Todos',
  visitor: 'Visitante',
  user: 'Utilizador',
  creator: 'Criador',
  admin: 'Administrador',
};

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'introducao',
    title: 'O que é o CAMPUS',
    summary: 'Visão geral da plataforma',
    audience: ['all'],
    paragraphs: [
      'O CAMPUS é uma plataforma académica de podcasts educativos. Permite publicar episódios com áudio e vídeo, comprimir ficheiros automaticamente, ouvir em streaming, descarregar para offline e transmitir ao vivo.',
      'A comunicação entre o browser (ou app Electron) e o servidor é feita por API REST segura (HTTPS + certificados). Cada acção importante fica registada para auditoria.',
    ],
    links: [
      { label: 'Explorar catálogo público', to: '/explorar' },
      { label: 'Criar conta', to: '/register' },
    ],
  },
  {
    id: 'papeis',
    title: 'Papéis na plataforma',
    summary: 'Utilizador, criador e administrador',
    audience: ['all'],
    paragraphs: [
      'Cada conta tem um papel que define o que podes fazer. O papel aparece no perfil e no token de sessão após login.',
    ],
    steps: [
      {
        title: 'Utilizador (user)',
        body: 'Papel por defeito. Explora o catálogo, ouve episódios na biblioteca, assiste transmissões ao vivo e descarrega conteúdo comprimido. Podes activar o modo criador no perfil.',
      },
      {
        title: 'Criador (creator)',
        body: 'Publica episódios (upload multipart), gere a tua biblioteca, transmite ao vivo e publica gravações como VOD. Não acede ao painel de administração.',
      },
      {
        title: 'Administrador (admin)',
        body: 'Gere a plataforma: utilizadores, publicações, transmissões, notificações, auditoria, certificados, excepções de acesso e anti-pirataria. Não publica nem transmite — a criação de conteúdo é exclusiva do criador.',
      },
    ],
  },
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos',
    summary: 'Conta, login e recuperação de password',
    audience: ['visitor', 'user'],
    paragraphs: [
      'Para ouvir episódios completos, descarregar ou personalizar a experiência, precisas de uma conta gratuita.',
    ],
    steps: [
      {
        title: 'Criar conta',
        body: 'Em Criar conta, preenche nome, email e password (mínimo 6 caracteres). Recebes sessão automática após o registo.',
      },
      {
        title: 'Entrar',
        body: 'Em Entrar, usa o teu email e password. Se a sessão expirar, voltas a ver o ecrã de login.',
      },
      {
        title: 'Esqueci a password',
        body: 'No login, pede recuperação por email. Em desenvolvimento o link pode aparecer no log do servidor; em produção chega por SMTP.',
      },
      {
        title: 'Nova password',
        body: 'Abre o link recebido (válido cerca de 1 hora) em Redefinir password e define uma nova credencial.',
      },
    ],
    links: [
      { label: 'Registo', to: '/register' },
      { label: 'Login', to: '/login' },
    ],
  },
  {
    id: 'explorar',
    title: 'Explorar podcasts',
    summary: 'Catálogo público sem login',
    audience: ['all'],
    paragraphs: [
      'A página Explorar mostra episódios já comprimidos e prontos para consulta. Podes pesquisar por título, autor, categoria ou palavras na descrição.',
      'O detalhe público mostra metadados; para ouvir o episódio completo ou descarregar, entra na tua conta.',
    ],
    steps: [
      {
        title: 'Pesquisa e filtros',
        body: 'Usa a barra de pesquisa (com debounce), filtra por categoria e ordena por data ou título. A paginação aparece quando há muitos resultados.',
      },
      {
        title: 'Entrar para ouvir',
        body: 'No detalhe de um episódio, o botão Entrar para ouvir redirecciona para login e depois para a biblioteca autenticada.',
      },
    ],
    links: [{ label: 'Ir a Explorar', to: '/explorar' }],
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca e reprodução',
    summary: 'Ouvir, player e download',
    audience: ['user', 'creator'],
    paragraphs: [
      'Em Podcasts tens a biblioteca completa com pesquisa, filtros e paginação. Cada episódio abre numa página de detalhe com player multimédia.',
    ],
    steps: [
      {
        title: 'Player',
        body: 'Play, pause, stop, avançar, retroceder, volume e barra de progresso. Atalhos de teclado: espaço (play/pause), setas (seek), M (mudo).',
      },
      {
        title: 'Streaming',
        body: 'O áudio é transmitido em streaming — não precisas de descarregar primeiro. O servidor suporta pedidos Range para seek.',
      },
      {
        title: 'Download offline',
        body: 'Quando a compressão terminar, usa Descarregar áudio ou vídeo no detalhe do episódio. Durante o processamento o download fica bloqueado.',
      },
      {
        title: 'Dashboard',
        body: 'No Dashboard vês estatísticas, episódios recentes e quantos utilizadores estão ligados agora.',
      },
    ],
    links: [
      { label: 'Biblioteca', to: '/podcasts' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    id: 'perfil',
    title: 'Perfil e conta',
    summary: 'Dados pessoais, segurança e actividade',
    audience: ['user', 'creator', 'admin'],
    paragraphs: [
      'No Perfil actualizas nome, foto, password e consultas a tua actividade recente (acções registadas no servidor).',
    ],
    steps: [
      {
        title: 'Foto de perfil',
        body: 'Envia uma imagem (máx. 5 MB) ou remove a foto actual. Formatos comuns JPG/PNG.',
      },
      {
        title: 'Ligação segura',
        body: 'A secção anti-MITM mostra protocolo TLS, CA-CAMPUS e estado da ligação ao servidor.',
      },
      {
        title: 'A minha actividade',
        body: 'Lista das últimas acções na tua conta: login, alterações de perfil, publicações, downloads, etc.',
      },
    ],
    links: [{ label: 'Abrir perfil', to: '/profile' }],
  },
  {
    id: 'criador',
    title: 'Conta de criador',
    summary: 'Publicar e gerir episódios',
    audience: ['user', 'creator'],
    paragraphs: [
      'Qualquer utilizador pode tornar-se criador no perfil (confirmação obrigatória). Ao deixar de ser criador, os teus episódios e transmissões são eliminados.',
    ],
    steps: [
      {
        title: 'Activar criador',
        body: 'Perfil → Conta de criador → aceita os termos → Tornar-me criador. O menu passa a mostrar Publicar.',
      },
      {
        title: 'Publicar episódio',
        body: 'Publicar → título, descrição, categoria, áudio (obrigatório), vídeo e capa opcionais. O servidor comprime em MP3 e regista autoria pelo certificado do dispositivo.',
      },
      {
        title: 'Editar ou eliminar',
        body: 'Na página do teu episódio, edita metadados ou elimina. Só o autor criador gere conteúdo pela biblioteca.',
      },
      {
        title: 'Compressão',
        body: 'Após upload, acompanha o progresso no detalhe. Badges na biblioteca indicam «a processar» ou «pronto».',
      },
    ],
    links: [{ label: 'Publicar episódio', to: '/podcasts/new' }],
  },
  {
    id: 'ao-vivo',
    title: 'Transmissões ao vivo',
    summary: 'Emitir e assistir em tempo real',
    audience: ['creator', 'user'],
    paragraphs: [
      'Criadores iniciam transmissões com câmara e/ou microfone. Todos os utilizadores autenticados podem ver emissões activas e comentar.',
    ],
    steps: [
      {
        title: 'Assistir',
        body: 'Ao vivo lista sessões em curso. Entra numa transmissão para ver e ouvir via WebSocket.',
      },
      {
        title: 'Transmitir',
        body: 'Iniciar transmissão → escolhe áudio, vídeo ou ambos → partilha o ecrã da emissão. O servidor pode gravar para VOD.',
      },
      {
        title: 'Publicar VOD',
        body: 'Após uma live, em Gravações VOD (servidor) publica a gravação como episódio na biblioteca.',
      },
    ],
    links: [
      { label: 'Hub ao vivo', to: '/live' },
      { label: 'Transmitir', to: '/live/broadcast' },
    ],
  },
  {
    id: 'administracao',
    title: 'Painel de administração',
    summary: 'Gestão da plataforma (só admin)',
    audience: ['admin'],
    paragraphs: [
      'Administradores acedem a /admin após login. O papel admin foca-se em moderação e operação — não em criar podcasts.',
    ],
    steps: [
      {
        title: 'Utilizadores',
        body: 'Lista contas, altera nome e papel (user / creator / admin), elimina contas (excepto a principal). Promove criadores aqui.',
      },
      {
        title: 'Publicações',
        body: 'Modera episódios: editar metadados ou remover conteúdo inadequado. O admin não faz upload de novos episódios.',
      },
      {
        title: 'Transmissões',
        body: 'Gere metadados de transmissões agendadas na base de dados (título, anfitrião, estado).',
      },
      {
        title: 'Notificações',
        body: 'Alertas automáticos: novos registos, episódios publicados, lives iniciadas, pedidos de reset, etc.',
      },
    ],
    links: [{ label: 'Abrir painel admin', to: '/admin' }],
  },
  {
    id: 'seguranca',
    title: 'Segurança e auditoria',
    summary: 'Módulos exclusivos do administrador',
    audience: ['admin'],
    paragraphs: [
      'Estas áreas protegem a plataforma e permitem investigar incidentes. Todas as acções ficam em Auditoria com assinatura digital.',
    ],
    steps: [
      {
        title: 'Auditoria (/admin/logs)',
        body: 'Registo global de acções com verificação de assinatura (não repúdio). Usa para saber quem fez login, publicou, revogou certificados, etc.',
      },
      {
        title: 'Certificados (/admin/certs)',
        body: 'Regista e revoga dispositivos autorizados na CA-CAMPUS. Revoga portáteis perdidos ou comprometidos.',
      },
      {
        title: 'Excepções (/admin/allowlist)',
        body: 'Autoriza IPs específicos sem certificado de cliente (ex.: sala de aula). Em produção usa só quando necessário e com motivo registado.',
      },
      {
        title: 'Anti-pirataria (/admin/piracy)',
        body: 'Histórico de downloads com fingerprint e IP. Alertas quando um episódio é descarregado por muitos dispositivos ou sem certificado.',
      },
    ],
    links: [
      { label: 'Auditoria', to: '/admin/logs' },
      { label: 'Certificados', to: '/admin/certs' },
      { label: 'Excepções', to: '/admin/allowlist' },
      { label: 'Anti-pirataria', to: '/admin/piracy' },
    ],
  },
  {
    id: 'faq',
    title: 'Perguntas frequentes',
    summary: 'Dúvidas comuns',
    audience: ['all'],
    paragraphs: [],
    steps: [
      {
        title: 'Porque preciso de certificado no servidor?',
        body: 'O CAMPUS usa mTLS em desenvolvimento e produção. O browser ou Electron apresenta um certificado de cliente assinado pela CA-CAMPUS. Sem cert válido (ou IP na allowlist), a API recusa a ligação.',
      },
      {
        title: 'O admin pode publicar podcasts?',
        body: 'Não. A separação de papéis exige que só criadores publiquem. O admin modera em Admin → Publicações.',
      },
      {
        title: 'O download não funciona',
        body: 'Aguarda a compressão terminar (badge no episódio). Precisas de estar autenticado.',
      },
      {
        title: 'Como corro os testes do projecto?',
        body: 'Na pasta server: npm run dev num terminal e npm run test:all noutro, para validar RF01–RF14.',
      },
    ],
  },
];
