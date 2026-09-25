export type LaneType = 'mainstream' | 'grassroots' | 'discourse';
export type SourceType = 'rss' | 'youtube' | 'reddit';

export interface Source {
  id: string;
  name: string;
  lane: LaneType;
  type: SourceType;
  feed_url: string;
  language: string;
  region?: string;
  is_active: boolean;
  created_at: string;
}

export interface RawItem {
  id: string;
  source_id: string;
  source_name?: string;
  lane?: LaneType;
  title: string;
  url: string;
  published_at: string;
  raw_summary?: string;
  og_image?: string;
  og_description?: string;
  embedding?: number[];
  cluster_id?: string;
  fetched_at: string;
  // Joined fields
  source?: Source;
  sources?: Source;
}

export interface TopicHub {
  id: string;
  title: string;
  ai_summary?: string;
  first_seen_at: string;
  last_updated_at: string;
  item_count: number;
  mainstream_count?: number;
  grassroots_count?: number;
  discourse_count?: number;
  items?: RawItem[];
}
