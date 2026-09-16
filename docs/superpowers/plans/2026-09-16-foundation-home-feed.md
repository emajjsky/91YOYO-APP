# Foundation And Home Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable Mock data foundation and replace the current API-dependent home screen with a polished X-style recommendation/following feed whose state stays synchronized across the App.

**Architecture:** Domain fixtures live behind an asynchronous `contentRepository`; screens never import fixture arrays. A pure deterministic ranker produces the recommendation order, while a persisted Zustand store owns feed pages and local interactions. Feed rendering is split by content type so later Explore, detail, and video work reuse the same post components.

**Tech Stack:** React Native 0.86, Expo 57, TypeScript 6, Zustand 5, AsyncStorage, lucide-react-native, React Navigation 7, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-09-16-mock-first-app-experience-design.md`

## Global Constraints

- Do not add or modify login, database, COS, production API, domain, HTTPS, SMS, or cloud deployment behavior.
- Use X-style flat information hierarchy and TikTok-style media entry without copying trademarks or branded assets.
- Core action icons must use a consistent vector icon library; Emoji may not be used for navigation or interaction buttons.
- Feed cards are unframed and separated by thin dividers; repeated cards must not be nested.
- Tap targets must be at least 44pt and text must remain readable under system font scaling.
- Mock recommendation order must be deterministic and directly testable.
- All cross-page entities use stable IDs and are read from one Store; no detail screen may own a copied post.
- This phase must work without an API URL or SSH tunnel.

---

### Task 1: Install UI And Persistence Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Expo SDK 57 package compatibility.
- Produces: `@react-native-async-storage/async-storage` and `lucide-react-native` imports for later tasks.

- [ ] **Step 1: Confirm the dependencies are absent**

Run:

```bash
npm ls @react-native-async-storage/async-storage lucide-react-native
```

Expected: non-zero exit status or `(empty)` for both packages.

- [ ] **Step 2: Install SDK-compatible packages**

Run:

```bash
PATH=/Users/tanyihua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  npx expo install @react-native-async-storage/async-storage lucide-react-native
```

Expected: `package.json` and lockfile include both packages with no Expo compatibility warning.

- [ ] **Step 3: Verify dependency resolution**

Run:

```bash
npm ls @react-native-async-storage/async-storage lucide-react-native
```

Expected: both packages resolve to one installed version.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add app UI dependencies"
```

### Task 2: Define Mock Social Domain And Fixtures

**Files:**
- Create: `src/features/social/types.ts`
- Create: `src/features/social/mockUsers.ts`
- Create: `src/features/social/mockPosts.ts`
- Create: `src/features/social/mockProfiles.ts`
- Create: `src/features/social/fixtures.test.ts`
- Modify: `src/types/feed.ts`
- Modify: `src/constants/categories.ts`

**Interfaces:**
- Consumes: existing `PostCategoryId` and `StyleTagType`.
- Produces: `SocialUser`, `SocialPost`, `ViewerProfile`, `RecommendationReason`, `mockUsers`, `mockPosts`, and `currentViewer`.

- [ ] **Step 1: Write fixture integrity tests**

Create tests that assert the actual fixture collections satisfy these invariants:

```ts
expect(mockUsers.length).toBeGreaterThanOrEqual(12);
expect(mockPosts.length).toBeGreaterThanOrEqual(40);
expect(new Set(mockUsers.map((user) => user.id)).size).toBe(mockUsers.length);
expect(new Set(mockPosts.map((post) => post.id)).size).toBe(mockPosts.length);
expect(mockPosts.every((post) => mockUsers.some((user) => user.id === post.authorId))).toBe(true);
expect(new Set(mockPosts.map((post) => post.category))).toEqual(new Set(POST_CATEGORIES.map((item) => item.id)));
expect(mockPosts.filter((post) => post.media.type === 'video').length).toBeGreaterThanOrEqual(8);
expect(mockPosts.filter((post) => post.media.type === 'audio').length).toBeGreaterThanOrEqual(6);
```

- [ ] **Step 2: Run the fixture test and verify it fails**

Run:

```bash
npm test -- src/features/social/fixtures.test.ts
```

Expected: FAIL because the social fixture modules do not exist.

- [ ] **Step 3: Add domain types**

Define these stable contracts in `src/features/social/types.ts`:

```ts
export type MediaContent =
  | { type: 'none' }
  | { type: 'images'; assets: { id: string; uri: number | string; aspectRatio: number; alt: string }[] }
  | { type: 'video'; asset: { id: string; uri: number | string; posterUri: number | string; durationSeconds: number; aspectRatio: number; title: string } }
  | { type: 'audio'; asset: { id: string; uri: number | string; coverUri: number | string; title: string; artist: string; bpm: number; durationSeconds: number } };

export interface SocialUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUri: number | string;
  bio: string;
  city: string;
  styleTags: StyleTagType[];
  roleLabel?: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  content: string;
  category: PostCategoryId;
  styleTags: StyleTagType[];
  hashtags: string[];
  createdAt: string;
  media: MediaContent;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  visibility: 'public' | 'followers';
}

export interface ViewerProfile {
  userId: string;
  interestStyles: StyleTagType[];
  interestCategories: PostCategoryId[];
  followedUserIds: string[];
}
```

- [ ] **Step 4: Add representative fixtures**

Create at least 12 users and 40 posts. The fixture set must cover all categories, 1A-5A, all four media variants, followed and non-followed authors, multiple cities, old/new timestamps, and low/high engagement. Use fixed ISO timestamps anchored to `2026-09-15T12:00:00.000Z`; do not call `Date.now()` while declaring fixtures.

For media entries, use local asset module references when an asset exists. Until the asset plan is executed, use a typed `string` URL from a stable public source and keep all media references centralized in `mockPosts.ts`, never inline in screens.

- [ ] **Step 5: Run the fixture test and typecheck**

Run:

```bash
npm test -- src/features/social/fixtures.test.ts
npx tsc --noEmit
```

Expected: PASS and no TypeScript diagnostics.

- [ ] **Step 6: Commit**

```bash
git add src/features/social src/types/feed.ts src/constants/categories.ts
git commit -m "feat: add social mock domain"
```

### Task 3: Implement Deterministic Recommendation And Following Feeds

**Files:**
- Create: `src/features/social/feedRanking.ts`
- Create: `src/features/social/feedRanking.test.ts`

**Interfaces:**
- Consumes: `SocialPost[]`, `SocialUser[]`, `ViewerProfile`, and an explicit ISO `now` string.
- Produces:

```ts
export interface RankedPost {
  post: SocialPost;
  score: number;
  reason: string | null;
}

export function rankRecommendedPosts(input: {
  posts: SocialPost[];
  users: SocialUser[];
  viewer: ViewerProfile;
  now: string;
}): RankedPost[];

export function selectFollowingPosts(posts: SocialPost[], viewer: ViewerProfile): SocialPost[];
```

- [ ] **Step 1: Write failing ranking tests**

Cover these behaviors with small inline fixtures:

```ts
it('ranks an interest match above an unrelated post with equal engagement');
it('adds relationship weight for a followed author');
it('uses freshness and engagement without allowing either to exceed one');
it('uses createdAt descending as the deterministic tie breaker');
it('returns a human-readable reason for non-followed recommendations');
it('returns only followed authors in newest-first order');
```

- [ ] **Step 2: Run the ranking test and verify it fails**

Run:

```bash
npm test -- src/features/social/feedRanking.test.ts
```

Expected: FAIL because `feedRanking.ts` does not exist.

- [ ] **Step 3: Implement normalized scoring**

Use the approved weights exactly:

```ts
const score = interestMatch * 0.4
  + freshness * 0.25
  + engagement * 0.2
  + relationship * 0.15;
```

Calculate `interestMatch` from matching style and category preferences. Calculate `freshness` over a seven-day window and clamp to `[0, 1]`. Calculate `engagement` from likes, comments, shares, and views using a logarithmic transform then clamp to `[0, 1]`. Set `relationship` to `1` only for followed authors. Filter out the current user's non-public posts.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
npm test -- src/features/social/feedRanking.test.ts
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/social/feedRanking.ts src/features/social/feedRanking.test.ts
git commit -m "feat: add mock feed ranking"
```

### Task 4: Add Async Mock Content Repository

**Files:**
- Create: `src/features/social/contentRepository.ts`
- Create: `src/features/social/contentRepository.test.ts`

**Interfaces:**
- Consumes: fixtures and ranking functions from Tasks 2-3.
- Produces:

```ts
export type FeedMode = 'recommended' | 'following';

export interface ContentPage {
  items: RankedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ContentRepository {
  getFeed(input: { mode: FeedMode; cursor?: string | null; limit?: number }): Promise<ContentPage>;
  getPost(postId: string): Promise<SocialPost | null>;
}

export function createMockContentRepository(options?: {
  latencyMs?: number;
  failNextRequest?: boolean;
}): ContentRepository;
```

- [ ] **Step 1: Write failing repository tests**

Test first page size, cursor continuation without duplicates, following-only filtering, stable recommendation order, unknown post returning `null`, and one-shot failure mode.

- [ ] **Step 2: Run the repository test and verify it fails**

Run:

```bash
npm test -- src/features/social/contentRepository.test.ts
```

Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Implement cursor pagination and simulated latency**

Encode cursors as a stable item offset string (`mock:<offset>`). Reject malformed cursors with `Error('内容游标无效')`. Default to `latencyMs: 180` and `limit: 10`; tests pass `latencyMs: 0`.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
npm test -- src/features/social/contentRepository.test.ts
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/social/contentRepository.ts src/features/social/contentRepository.test.ts
git commit -m "feat: add mock content repository"
```

### Task 5: Replace Feed Store With Persisted Social State

**Files:**
- Create: `src/features/social/socialStore.ts`
- Create: `src/features/social/socialStore.test.ts`
- Modify: `src/stores/feedStore.ts`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `ContentRepository`, `FeedMode`, `RankedPost`, AsyncStorage.
- Produces:

```ts
export interface SocialState {
  feeds: Record<FeedMode, { ids: string[]; nextCursor: string | null; hasMore: boolean }>;
  postsById: Record<string, SocialPost>;
  usersById: Record<string, SocialUser>;
  likedPostIds: string[];
  bookmarkedPostIds: string[];
  followedUserIds: string[];
  loadFeed(mode: FeedMode, refresh?: boolean): Promise<void>;
  loadMore(mode: FeedMode): Promise<void>;
  toggleLike(postId: string): void;
  toggleBookmark(postId: string): void;
  toggleFollow(userId: string): void;
  resetDemoData(): Promise<void>;
}
```

- [ ] **Step 1: Write failing Store behavior tests**

Use a memory storage adapter and zero-latency repository. Assert that recommendation and following pages remain separate, duplicate loads do not duplicate IDs, like count changes exactly once, bookmark state toggles, unfollowing removes that author's posts from the following feed, and persisted interaction arrays rehydrate.

- [ ] **Step 2: Run the Store test and verify it fails**

Run:

```bash
npm test -- src/features/social/socialStore.test.ts
```

Expected: FAIL because `socialStore.ts` does not exist.

- [ ] **Step 3: Implement Store factory and production Store**

Export a `createSocialStore(repository, storage)` factory for tests and one `useSocialStore` instance configured with AsyncStorage. Persist only interaction state and user-created records, not transient loading/error fields. Keep `src/stores/feedStore.ts` as a temporary typed adapter only if another screen still imports it; mark removal for the detail-phase plan.

- [ ] **Step 4: Remove API configuration as an App launch gate**

Change `RootNavigator` so missing `EXPO_PUBLIC_API_BASE_URL` never blocks Mock mode. Keep `SetupRequiredScreen` available for later server phases but do not render it in this phase.

- [ ] **Step 5: Run Store tests, full tests, and typecheck**

Run:

```bash
npm test -- src/features/social/socialStore.test.ts
npm test
npx tsc --noEmit
```

Expected: all tests pass and no TypeScript diagnostics.

- [ ] **Step 6: Commit**

```bash
git add App.tsx src/features/social/socialStore.ts src/features/social/socialStore.test.ts src/stores/feedStore.ts src/navigation/RootNavigator.tsx
git commit -m "feat: persist mock social state"
```

### Task 6: Build Reusable X-Style Feed Components

**Files:**
- Create: `src/features/feed/FeedPost.tsx`
- Create: `src/features/feed/PostHeader.tsx`
- Create: `src/features/feed/PostMedia.tsx`
- Create: `src/features/feed/PostActions.tsx`
- Create: `src/features/feed/FeedState.tsx`
- Modify: `src/constants/colors.ts`
- Modify: `src/components/FeedCard.tsx`

**Interfaces:**
- Consumes: `SocialPost`, `SocialUser`, liked/bookmarked state, callback props.
- Produces:

```ts
export interface FeedPostProps {
  post: SocialPost;
  author: SocialUser;
  recommendationReason?: string | null;
  isLiked: boolean;
  isBookmarked: boolean;
  onOpen(): void;
  onOpenAuthor(): void;
  onLike(): void;
  onBookmark(): void;
  onComment(): void;
  onShare(): void;
}
```

- [ ] **Step 1: Establish restrained design tokens**

Keep the near-black theme but replace scattered literals with `background`, `surface`, `border`, `textPrimary`, `textSecondary`, `textMuted`, `brand`, and `like` tokens. Use one cyan brand color and pink only for liked state. Do not add gradients, glow, or decorative cards.

- [ ] **Step 2: Implement small feed components**

Use Lucide icons for `MessageCircle`, `Repeat2`, `Heart`, `Bookmark`, `Share`, `MoreHorizontal`, `Play`, and `Music2`. Every icon button must have a 44pt hit area and an accessibility label. Prevent child actions from invoking the card's `onOpen` callback.

- [ ] **Step 3: Implement media-specific stable layouts**

Reserve aspect ratios before media loads. Use one image at 4:3, two images in equal columns, and 3-9 images in a stable three-column grid. Video uses its declared aspect ratio clamped between `0.8` and `1.78`, with a centered Play icon. Audio uses a compact horizontal row, not a nested card.

- [ ] **Step 4: Remove the old duplicated FeedCard implementation**

Turn `src/components/FeedCard.tsx` into a temporary re-export of `FeedPost` or update all imports and delete it. There must be one feed rendering implementation.

- [ ] **Step 5: Typecheck and export iOS bundle**

Run:

```bash
npx tsc --noEmit
PATH=/Users/tanyihua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  npx expo export --platform ios --output-dir /tmp/91yoyo-foundation-feed-components
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/feed src/constants/colors.ts src/components/FeedCard.tsx
git commit -m "feat: build reusable social feed"
```

### Task 7: Rebuild Home Recommendation And Following Tabs

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/navigation/MainTabNavigator.tsx`
- Modify: `src/components/TabBarIcons.tsx`

**Interfaces:**
- Consumes: `useSocialStore`, `FeedPost`, `FeedMode`.
- Produces: working `推荐` and `关注` feeds with independent state and navigation callbacks.

- [ ] **Step 1: Replace API feed hooks with social selectors**

Map UI labels exactly as `推荐` and `关注`. Select post IDs from the active feed, resolve post and author records by ID, and pass recommendation reasons only in `recommended` mode.

- [ ] **Step 2: Preserve independent list position and state**

Render two `FlatList` instances in a horizontal pager or keep both mounted and hide the inactive list without resetting its data. Store each list's last offset in a ref and restore it after switching tabs.

- [ ] **Step 3: Wire all local interactions**

Like and bookmark update `useSocialStore`. Comment opens the post detail route. Share uses React Native `Share`. Author press opens `UserProfile`. Video press opens the future `VideoFeed` route only after that route exists; during this phase it opens `PostDetail` and never displays an Alert placeholder.

- [ ] **Step 4: Implement loading, empty, error, refresh, and pagination states**

Recommendation empty copy: `正在整理适合你的内容`. Following empty copy: `关注喜欢的球手后，他们的新动态会出现在这里`. The following empty state includes one `去探索` command that navigates to Explore.

- [ ] **Step 5: Normalize bottom navigation**

Use consistent Lucide-derived SVG icons or the existing SVG icon set without Emoji. Keep the center create action circular and 52pt, but remove glow effects and ensure all five slots have stable widths.

- [ ] **Step 6: Run automated verification**

Run:

```bash
npm test
npx tsc --noEmit
PATH=/Users/tanyihua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
  npx expo export --platform ios --output-dir /tmp/91yoyo-foundation-home
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 7: Run simulator interaction verification**

Exercise this exact flow on iPhone 17 Pro:

```text
launch -> 推荐 renders -> like a post -> bookmark it -> switch to 关注
-> verify only followed authors -> switch back -> verify interaction state and scroll position
-> pull to refresh -> scroll to pagination -> open a post -> return
```

Capture screenshots for recommendation feed, following feed, and one media post. Inspect for text clipping, image gaps, overlapping action buttons, framework error overlays, and stale loading states.

- [ ] **Step 8: Commit**

```bash
git add src/screens/home/HomeScreen.tsx src/navigation/MainTabNavigator.tsx src/components/TabBarIcons.tsx
git commit -m "feat: rebuild home social feeds"
```

### Task 8: Phase Review And Documentation

**Files:**
- Modify: `docs/ROADMAP.md`
- Modify: `docs/TEST_STRATEGY.md`

**Interfaces:**
- Consumes: verified Task 1-7 implementation.
- Produces: accurate status and a clear handoff into the Explore/video phase.

- [ ] **Step 1: Update status without overstating backend completion**

Document that Home uses deterministic local Mock recommendation and following feeds, local interactions persist, and production authentication/data synchronization remain deliberately deferred.

- [ ] **Step 2: Run final phase verification**

Run:

```bash
npm test
npx tsc --noEmit
git diff --check
git status --short
```

Expected: tests and typecheck pass; only intended documentation changes remain before commit.

- [ ] **Step 3: Commit**

```bash
git add docs/ROADMAP.md docs/TEST_STRATEGY.md
git commit -m "docs: record mock home feed milestone"
```

- [ ] **Step 4: Push the completed phase**

```bash
git push origin main
```

Expected: remote `main` contains every phase commit and the worktree is clean.
