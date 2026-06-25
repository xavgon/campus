import { getPool } from '../database/pool';

export interface DownloadRecord {
  id: number;
  podcast_id: string;
  podcast_title: string | null;
  user_id: string | null;
  user_nome: string | null;
  cert_fingerprint: string | null;
  cert_cn: string | null;
  ip_address: string | null;
  downloaded_at: string;
}

export const recordDownload = async (
  podcastId: string,
  userId: string | null,
  certFingerprint: string | null,
  certCn: string | null,
  ipAddress: string | null,
): Promise<void> => {
  await getPool().query(
    `INSERT INTO podcast_downloads (podcast_id, user_id, cert_fingerprint, cert_cn, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [podcastId, userId, certFingerprint, certCn, ipAddress],
  );
};

export const listDownloadsForAdmin = async (limit = 200): Promise<DownloadRecord[]> => {
  const result = await getPool().query(
    `SELECT d.id, d.podcast_id, p.title AS podcast_title,
            d.user_id, u.nome AS user_nome,
            d.cert_fingerprint, d.cert_cn, d.ip_address, d.downloaded_at
     FROM podcast_downloads d
     LEFT JOIN podcasts p ON p.id = d.podcast_id
     LEFT JOIN users u ON u.id = d.user_id
     ORDER BY d.downloaded_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({
    ...r,
    downloaded_at: r.downloaded_at instanceof Date ? r.downloaded_at.toISOString() : String(r.downloaded_at),
  }));
};

export interface PiracyAlert {
  podcast_id: string;
  podcast_title: string | null;
  total_downloads: number;
  unique_certs: number;
  unique_users: number;
  unique_ips: number;
  no_cert_downloads: number;
}

export const detectPiracyAlerts = async (): Promise<PiracyAlert[]> => {
  const result = await getPool().query(
    `SELECT d.podcast_id, p.title AS podcast_title,
            COUNT(*) AS total_downloads,
            COUNT(DISTINCT d.cert_fingerprint) FILTER (WHERE d.cert_fingerprint IS NOT NULL) AS unique_certs,
            COUNT(DISTINCT d.user_id) AS unique_users,
            COUNT(DISTINCT d.ip_address) AS unique_ips,
            COUNT(*) FILTER (WHERE d.cert_fingerprint IS NULL) AS no_cert_downloads
     FROM podcast_downloads d
     LEFT JOIN podcasts p ON p.id = d.podcast_id
     GROUP BY d.podcast_id, p.title
     HAVING COUNT(*) > 1
     ORDER BY unique_certs DESC, total_downloads DESC`,
  );
  return result.rows.map((r) => ({
    podcast_id: r.podcast_id,
    podcast_title: r.podcast_title,
    total_downloads: Number(r.total_downloads),
    unique_certs: Number(r.unique_certs),
    unique_users: Number(r.unique_users),
    unique_ips: Number(r.unique_ips),
    no_cert_downloads: Number(r.no_cert_downloads),
  }));
};
