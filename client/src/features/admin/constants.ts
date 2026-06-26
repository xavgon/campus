export interface AdminNavItem {
  to: string;
  label: string;
  description: string;
  end?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin',
    label: 'Painel',
    description: 'Resumo e métricas da plataforma',
    end: true,
  },
  {
    to: '/admin/users',
    label: 'Utilizadores',
    description: 'Contas, papéis e moderação',
  },
  {
    to: '/admin/posts',
    label: 'Publicações',
    description: 'Podcasts e episódios publicados',
  },
  {
    to: '/admin/transmissions',
    label: 'Transmissões',
    description: 'Emissões ao vivo e agendadas',
  },
  {
    to: '/admin/notifications',
    label: 'Notificações',
    description: 'Alertas importantes da plataforma',
  },
  {
    to: '/admin/logs',
    label: 'Auditoria',
    description: 'Logs assinados e não repúdio',
  },
  {
    to: '/admin/certs',
    label: 'Certificados',
    description: 'CA-CAMPUS — emissão e revogação',
  },
  {
    to: '/admin/allowlist',
    label: 'Excepções',
    description: 'Allowlist — IPs sem certificado',
  },
  {
    to: '/admin/piracy',
    label: 'Anti-pirataria',
    description: 'Downloads rastreados e alertas',
  },
];
