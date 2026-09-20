# Explore And Video Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Explore mock cards with searchable social discovery and add a TikTok-style fullscreen vertical video route backed by the same local Social Store.

**Architecture:** Pure discovery and video-ordering modules own filtering/ranking rules and are covered by Vitest. Explore progressively loads the recommended repository into the normalized Social Store, then renders media posts and text posts as discovery-specific layouts. VideoFeed reads the same normalized records and interaction state; reserved video fixtures show honest poster states until licensed playable files are available.

**Tech Stack:** React Native 0.86, Expo 57, React Navigation 7, Zustand 5, Lucide React Native, Vitest 3, TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-09-16-mock-first-app-experience-design.md`

## Global Constraints

- Frontend must work without API, SSH, PostgreSQL, COS, or login.
- Explore is active discovery, not a second copy of Home.
- Search covers author name/handle, body, and hashtags.
- Discovery ranking excludes relationship/following weight.
- Video fixtures with `playbackStatus: 'reserved'` must never receive a fake URI or pretend to play.
- Like, bookmark, comment, and share actions use the existing Social Store and root routes.
- Use Lucide icons for controls; do not add emoji controls, gradients, glow, or nested cards.
- Preserve bottom-tab state and Home scroll position when returning from root routes.

---

### Task 1: Discovery Model

**Files:**
- Replace: `src/screens/explore/exploreSearch.ts`
- Modify: `src/screens/explore/exploreSearch.test.ts`

**Interfaces:**
- Consumes: `SocialPost`, `SocialUser`, and `PostCategoryId`.
- Produces: `rankExplorePosts(input): ExploreResult[]`, `getTrendingTopics(posts, category, limit): TrendingTopic[]`, and `ExploreCategoryId = 'all' | PostCategoryId`.

- [ ] **Step 1: Write failing tests** for author/handle/body/hashtag search, category filtering, no relationship signal, deterministic engagement/freshness ordering, and topic counts.
- [ ] **Step 2: Run `npx vitest run src/screens/explore/exploreSearch.test.ts`** and confirm the new exports are missing.
- [ ] **Step 3: Implement normalized search and deterministic discovery scoring** using category match, logarithmic engagement, and seven-day freshness only.
- [ ] **Step 4: Re-run the targeted tests** and confirm they pass.
- [ ] **Step 5: Commit** with `feat: add social discovery model`.

### Task 2: Explore Experience

**Files:**
- Replace: `src/screens/explore/ExploreScreen.tsx`
- Reuse: `src/features/feed/FeedState.tsx`
- Reuse: `src/features/social/socialStore.ts`

**Interfaces:**
- Consumes: Task 1 discovery model and `useSocialStore`.
- Produces: category/search/topic discovery UI and navigation to `PostDetail`, `UserProfile`, and later `VideoFeed`.

- [ ] **Step 1: Add a pure `partitionExploreResults` test** that separates media-first and text-only records while retaining rank order.
- [ ] **Step 2: Run the targeted test** and confirm it fails for the missing function.
- [ ] **Step 3: Implement complete-feed hydration** by calling `loadFeed('recommended')` followed by serialized `loadMore('recommended')` until `hasMore` is false.
- [ ] **Step 4: Build the fixed search/category header** with Lucide `Search` and `X`, including `全部` plus all seven post categories.
- [ ] **Step 5: Build trending topics, a two-column media grid, compact text rows, and stable loading/error/empty states** without duplicating Feed cards.
- [ ] **Step 6: Verify targeted tests and TypeScript**, then commit with `feat: rebuild explore discovery`.

### Task 3: Video Ordering Model

**Files:**
- Create: `src/screens/video/videoFeedModel.ts`
- Create: `src/screens/video/videoFeedModel.test.ts`

**Interfaces:**
- Consumes: normalized `SocialPost[]` plus `initialPostId`.
- Produces: `orderVideoPosts(posts, initialPostId): SocialPost[]` with the initial video first and related category/style videos ahead of unrelated videos.

- [ ] **Step 1: Write failing tests** for initial-first ordering, filtering non-video posts, relation ordering, deterministic fallback, and missing initial IDs.
- [ ] **Step 2: Run the targeted test** and confirm the module is missing.
- [ ] **Step 3: Implement deterministic ordering** without mutating input arrays.
- [ ] **Step 4: Re-run the targeted tests** and confirm they pass.
- [ ] **Step 5: Commit** with `feat: add video feed ordering`.

### Task 4: Fullscreen Video Feed

**Files:**
- Create: `src/screens/video/VideoFeedScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: Task 3 ordering, `useSocialStore`, and route `{ initialPostId: string }`.
- Produces: root Stack route `VideoFeed` with vertical paging, reserved poster states, and shared interactions.

- [ ] **Step 1: Add the typed `VideoFeed` route** before any caller navigates to it.
- [ ] **Step 2: Build a full-window vertical `FlatList`** using `pagingEnabled`, stable item height, active-index tracking, safe-area back button, and poster backgrounds.
- [ ] **Step 3: Add bottom author/body/hashtags metadata and right-side Lucide interaction controls** for profile, like, comment, bookmark, and share.
- [ ] **Step 4: Render reserved fixtures as non-playing poster states** with an explicit availability label; only ready assets may expose playback controls.
- [ ] **Step 5: Run model tests and TypeScript**, then commit with `feat: add fullscreen video feed`.

### Task 5: Entry Points And Verification

**Files:**
- Modify: `src/features/feed/FeedPost.tsx`
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/screens/explore/ExploreScreen.tsx`
- Modify: `docs/superpowers/specs/2026-09-16-mock-first-app-experience-design.md`

**Interfaces:**
- Consumes: `RootStackParamList['VideoFeed']`.
- Produces: video-post navigation from Home media and Explore cards while preserving non-video detail navigation.

- [ ] **Step 1: Add an optional `onOpenMedia` callback to `FeedPost`** and route Home video media to `VideoFeed` while keeping row/body taps on `PostDetail`.
- [ ] **Step 2: Route Explore video cards to `VideoFeed`** and all other cards to `PostDetail`.
- [ ] **Step 3: Update the spec** to record reserved-poster behavior as the current licensed-asset limitation.
- [ ] **Step 4: Run `npm test`, `npx tsc --noEmit`, `npx expo export --platform ios`, and `git diff --check`**.
- [ ] **Step 5: Validate iPhone simulator screenshots** for Explore and VideoFeed at desktop-sized and narrow-device layouts, including no overlap and nonblank posters.
- [ ] **Step 6: Commit** with `feat: connect discovery and video navigation`.
