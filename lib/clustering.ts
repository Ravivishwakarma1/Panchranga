import crypto from 'crypto';
import { cosineSimilarity } from './embeddings';
import { RawItem, TopicHub } from './types';

export const SIMILARITY_THRESHOLD = 0.45; // Multilingual cosine similarity threshold for clustering same-event items

export interface ClusteredResult {
  hubs: TopicHub[];
  clusteredItems: RawItem[];
}

/**
 * Cluster raw items into Topic Hubs based on Cosine Similarity of 384-dim vector embeddings.
 */
export function clusterRawItems(
  existingHubs: TopicHub[],
  rawItems: RawItem[],
  threshold = SIMILARITY_THRESHOLD
): ClusteredResult {
  const hubs: TopicHub[] = JSON.parse(JSON.stringify(existingHubs));
  const clusteredItems: RawItem[] = JSON.parse(JSON.stringify(rawItems));

  for (const item of clusteredItems) {
    if (!item.embedding || item.embedding.length === 0) continue;

    let bestHub: TopicHub | null = null;
    let maxSimilarity = -1;

    // Compare item against existing topic hubs
    for (const hub of hubs) {
      if (!hub.items || hub.items.length === 0) continue;

      // Calculate max similarity against items inside the hub
      for (const hubItem of hub.items) {
        if (hubItem.embedding && hubItem.embedding.length > 0) {
          const sim = cosineSimilarity(item.embedding, hubItem.embedding);
          if (sim > maxSimilarity) {
            maxSimilarity = sim;
            bestHub = hub;
          }
        }
      }
    }

    if (bestHub && maxSimilarity >= threshold) {
      // Attach to existing hub
      item.cluster_id = bestHub.id;
      if (!bestHub.items) bestHub.items = [];
      
      // Avoid duplicate URL inside hub
      if (!bestHub.items.some((i) => i.url === item.url)) {
        bestHub.items.push(item);
        bestHub.item_count = bestHub.items.length;
        bestHub.last_updated_at = new Date().toISOString();
      }
    } else {
      // Create new topic hub for this event
      const newHubId = crypto.randomUUID();
      item.cluster_id = newHubId;

      const newHub: TopicHub = {
        id: newHubId,
        title: item.title,
        first_seen_at: item.published_at || new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        item_count: 1,
        mainstream_count: item.lane === 'mainstream' ? 1 : 0,
        grassroots_count: item.lane === 'grassroots' ? 1 : 0,
        discourse_count: item.lane === 'discourse' ? 1 : 0,
        items: [item],
      };

      hubs.push(newHub);
    }
  }

  // Recalculate lane counts & clean up empty hubs
  const finalHubs = hubs.map((hub) => {
    const itemsInHub = hub.items || [];
    const mainstream = itemsInHub.filter((i) => i.lane === 'mainstream').length;
    const grassroots = itemsInHub.filter((i) => i.lane === 'grassroots').length;
    const discourse = itemsInHub.filter((i) => i.lane === 'discourse').length;

    return {
      ...hub,
      item_count: itemsInHub.length,
      mainstream_count: mainstream,
      grassroots_count: grassroots,
      discourse_count: discourse,
    };
  }).sort((a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime());

  return {
    hubs: finalHubs,
    clusteredItems,
  };
}
