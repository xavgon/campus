/** Identidade visual CAMPUS — amarelo · preto · prata */
export const BRAND = {
  name: 'CAMPUS',
  logo: '/images/campus-logo.png',
  /** Emblema 3D (sem wordmark) — usar na navegação */
  logoEmblem: '/images/campus-emblem.png',
  logoIcon: '/images/campus-emblem.png',
  logoMark: '/images/campus-logo-mark.png',
  logoAlt: 'CAMPUS — Podcast educativo',
  tagline: 'Podcasts educativos, onde aprendes.',
  description:
    'Plataforma multimédia para publicar, comprimir e ouvir conteúdos áudio no contexto escolar.',
  year: 'Multimédia 2026',
  colors: {
    yellow: '#F5C518',
    yellowDark: '#D4A800',
    black: '#0A0A0A',
    blackElevated: '#1A1A1A',
    silver: '#B8B8B8',
    silverMuted: '#8A8A8A',
    border: '#2E2E2E',
    foreground: '#FAFAFA',
    onPrimary: '#0A0A0A',
  },
} as const;

export const FEATURES = [
  {
    title: 'Upload inteligente',
    description: 'Publica episódios com capa e metadados num fluxo simples.',
  },
  {
    title: 'Compressão FFmpeg',
    description: 'Reduz o tamanho dos ficheiros mantendo qualidade de áudio.',
  },
  {
    title: 'Streaming & offline',
    description: 'Ouve online com progresso ou descarrega para mais tarde.',
  },
] as const;
