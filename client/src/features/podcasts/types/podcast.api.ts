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
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  created_at: string;
}
