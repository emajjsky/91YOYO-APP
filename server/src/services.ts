export interface HealthService {
  checkDatabase(): Promise<boolean>;
  checkCos(): Promise<boolean>;
}

export interface FeedPage {
  items: unknown[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedService {
  listPublic(input: { limit: number; cursor: string | null }): Promise<FeedPage>;
}

export interface AppServices {
  health: HealthService;
  feed: FeedService;
}
