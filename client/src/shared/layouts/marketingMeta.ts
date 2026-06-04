export type MarketingRoute = '/' | '/explorar' | '/login' | '/register';

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
      'Ouve e descobre episódios de diferentes áreas. O catálogo público expande-se com o Módulo 2.',
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
};

export const isMarketingRoute = (path: string): path is MarketingRoute =>
  path === '/' || path === '/explorar' || path === '/login' || path === '/register';
