/** Resposta da API — snake_case */
export interface PodcastApi {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  cover_url: string | null;
  original_size: number | null;
  compressed_size: number | null;
  compression_ratio: number | null;
  processing_time_ms: number | null;
  duration_seconds: number | null;
  media_format: string | null;
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  author_cert_fingerprint: string | null;
  author_cert_cn: string | null;
  created_at: string;
}

/** Catálogo público (RF09) — sem URLs de media nem certificados. */
export interface PublicPodcastApi {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  category_id: number | null;
  category_name: string | null;
  author_nome: string;
  created_at: string;
}
