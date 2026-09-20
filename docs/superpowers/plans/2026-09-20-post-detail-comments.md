# Post Detail And Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move post detail onto the normalized Social Store and deliver persistent first-level Mock comments with working interaction states.

**Architecture:** Comments become stable social-domain records in the same persisted Zustand store as posts and likes. The detail screen reuses shared post header/media/actions so Home, Explore, VideoFeed, and detail reflect one normalized source of truth. Direct detail routes can fetch one Mock post by ID without loading an entire feed.

**Tech Stack:** React Native 0.86, Expo 57, Zustand 5 persist middleware, AsyncStorage 2, Lucide React Native, Vitest 3, TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-09-16-mock-first-app-experience-design.md`

## Global Constraints

- First release supports first-level comments only; no reply tree.
- Comment body is trimmed, cannot be blank, and is limited to 280 characters.
- New comments and comment likes persist locally and reset with demo data.
- Post comment counts update in every screen through the same normalized post record.
- Detail media uses the shared `PostMedia`; video media enters `VideoFeed`.
- No login, API, PostgreSQL, COS, or cloud work in this phase.
- Use Lucide icons instead of emoji controls.

---

### Task 1: Comment Domain And Fixtures

**Files:**
- Modify: `src/features/social/types.ts`
- Create: `src/features/social/mockComments.ts`
- Modify: `src/features/social/fixtures.test.ts`
- Modify: `src/screens/post/postDetailModel.ts`
- Modify: `src/screens/post/postDetailModel.test.ts`

**Interfaces:**
- Produces: `SocialComment`, `mockComments`, `commentsForPost`, and `normalizeCommentBody`.

- [x] Write failing tests for stable comment IDs, valid post/author links, chronological ordering, trim, blank rejection, and 280-character rejection.
- [x] Run targeted tests and confirm expected failures.
- [x] Add comment types, fixtures, and pure helpers.
- [x] Re-run targeted tests and commit `feat: add mock comment domain`.

### Task 2: Persisted Comment State

**Files:**
- Modify: `src/features/social/socialStore.ts`
- Modify: `src/features/social/socialStore.test.ts`

**Interfaces:**
- Produces: `commentsById`, `likedCommentIds`, `createdCommentsById`, `loadPost`, `addComment`, and `toggleCommentLike`.

- [x] Write failing store tests for direct post loading, comment creation/count synchronization, comment likes, persistence hydration, malformed records, and reset.
- [x] Run targeted tests and confirm expected failures.
- [x] Implement normalized comment state and versioned persistence validation.
- [x] Re-run targeted tests and commit `feat: persist mock comments`.

### Task 3: Shared Detail Experience

**Files:**
- Replace: `src/screens/post/PostDetailScreen.tsx`
- Reuse: `src/features/feed/PostHeader.tsx`
- Reuse: `src/features/feed/PostMedia.tsx`
- Reuse: `src/features/feed/PostActions.tsx`
- Delete: `src/stores/feedStore.ts`

**Interfaces:**
- Consumes: Task 2 Social Store state/actions.
- Produces: synchronized detail, comment list, and fixed composer.

- [x] Replace the legacy adapter read with normalized post/author/comment selectors and `loadPost` fallback.
- [x] Rebuild the post body with shared components and route video media to `VideoFeed`.
- [x] Render first-level comments with author, relative time, body, and local like controls.
- [x] Add a keyboard-safe 280-character composer with inline validation and immediate insertion.
- [x] Remove the unused feed adapter, run TypeScript, and commit `feat: rebuild post detail comments`.

### Task 4: Verification And Integration

**Files:**
- Modify: `docs/ROADMAP.md`
- Modify: `docs/superpowers/plans/2026-09-20-post-detail-comments.md`

- [x] Validate detail, comment creation, comment like, persistence, and video entry on iPhone simulator.
- [x] Run `npm test`, `npx tsc --noEmit`, `npx expo export --platform ios`, and `git diff --check`.
- [x] Update roadmap and plan completion state.
- [x] Commit, fast-forward `main`, re-run merged tests, push GitHub, and restore Metro on `8081`.
