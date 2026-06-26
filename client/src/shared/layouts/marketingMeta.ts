export type MarketingRoute = '/' | '/explorar' | '/ajuda' | '/login' | '/register' | '/reset-password';

export interface MarketingMeta {
  eyebrow: string;
  title: string;
  description: string;
}

export interface MarketingBackground {
  /** Caminho em public/ (ex.: /images/bg-home.jpg) */
  src: string;
  position?: string;
  /** Classe Tailwind extra para o overlay escuro */
  overlayClass?: string;
}

export const MARKETING_BACKGROUNDS: Record<MarketingRoute, MarketingBackground> = {
  '/': {
    src: '/images/bg-home.jpg',
    position: 'center',
    overlayClass: 'from-black/88 via-campus-surface-dark/82 to-black/92',
  },
  '/explorar': {
    src: '/images/bg-home.jpg',
    position: 'center',
    overlayClass: 'from-black/88 via-campus-surface-dark/82 to-black/92',
  },
  '/ajuda': {
    src: '/images/bg-home.jpg',
    position: 'center',
    overlayClass: 'from-black/90 via-campus-surface-dark/85 to-black/92',
  },
  '/login': {
    src: '/images/bg-login.png',
    position: 'center',
    overlayClass: 'from-black/88 via-black/70 to-campus-surface-dark/92',
  },
  '/register': {
    src: '/images/bg-register.jpg',
    position: 'center top',
    overlayClass: 'from-black/85 via-campus-surface-dark/80 to-black/90',
  },
  '/reset-password': {
    src: '/images/bg-login.png',
    position: 'center',
    overlayClass: 'from-black/88 via-black/70 to-campus-surface-dark/92',
  },
};

export const getMarketingBackground = (path: string): MarketingBackground => {
  if (isMarketingRoute(path)) {
    return MARKETING_BACKGROUNDS[path];
  }
  return MARKETING_BACKGROUNDS['/'];
};

export const MARKETING_META: Record<MarketingRoute, MarketingMeta> = {
  '/': {
    eyebrow: 'Bem-vindo',
    title: 'Aprende em movimento com podcasts feitos para ti.',
    description:
      'O CAMPUS reúne criação, compressão e reprodução numa experiência pensada para contexto educativo.',
  },
  '/explorar': {
    eyebrow: 'Catálogo',
    title: 'Explora podcasts educativos.',
    description:
      'Pesquisa por título, autor, categoria ou tema. Entra na tua conta para ouvir episódios completos.',
  },
  '/ajuda': {
    eyebrow: 'Documentação',
    title: 'Manual de utilizador do CAMPUS.',
    description:
      'Guia por papel — visitante, utilizador, criador e administrador. Segurança, publicação e moderação.',
  },
  '/login': {
    eyebrow: 'Entrar',
    title: 'Continua de onde paraste.',
    description: 'Acede à tua biblioteca, uploads e estatísticas num painel único.',
  },
  '/register': {
    eyebrow: 'Criar conta',
    title: 'Começa a publicar em minutos.',
    description: 'Registo gratuito para explorares a plataforma e preparares o teu primeiro episódio.',
  },
  '/reset-password': {
    eyebrow: 'Recuperação',
    title: 'Define uma nova password.',
    description: 'O link é válido por 1 hora. Depois de guardares, inicia sessão com a nova password.',
  },
};

export const isMarketingRoute = (path: string): path is MarketingRoute =>
  path === '/' ||
  path === '/explorar' ||
  path === '/ajuda' ||
  path === '/login' ||
  path === '/register' ||
  path === '/reset-password';
