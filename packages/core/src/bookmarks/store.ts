import type { StoreApi } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { CourseId, LessonId } from '@learn365/content/types';

import {
  BOOKMARKS_SCHEMA_VERSION,
  BOOKMARKS_STORAGE_KEY,
  type BookmarkStorage,
  type BookmarkStoreState,
  type CourseBookmarks,
  type CourseBookmarksSnapshot,
} from './types.js';

export interface CreateBookmarkStoreOptions {
  /** Platform-provided storage adapter (web: localStorage; mobile: AsyncStorage). */
  readonly storage: BookmarkStorage;
  /** Override the persistence key. Defaults to `learn365:bookmarks:v1`. */
  readonly storageKey?: string;
  /** Override the date function — useful in tests. */
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function emptyCourse(now: () => string): CourseBookmarks {
  return {
    lessonIds: new Set<LessonId>(),
    updatedAt: now(),
  };
}

/**
 * Builds the bookmark store. Mirrors `createProgressStore` exactly so the
 * same swap-seam pattern carries to Phase 8 — no React imports, no DOM
 * coupling. `Set<LessonId>` is flattened to an array on disk and rehydrated
 * back to a Set on read.
 */
export function createBookmarkStore(
  options: CreateBookmarkStoreOptions,
): StoreApi<BookmarkStoreState> {
  const now = options.now ?? defaultNow;
  const storage = options.storage as StateStorage;
  const storageKey = options.storageKey ?? BOOKMARKS_STORAGE_KEY;

  return createStore<BookmarkStoreState>()(
    persist(
      (set, get) => ({
        byCourse: {},

        toggleBookmark(courseId: CourseId, lessonId: LessonId) {
          const prev = get().byCourse[courseId] ?? emptyCourse(now);
          const next = new Set(prev.lessonIds);
          if (next.has(lessonId)) {
            next.delete(lessonId);
          } else {
            next.add(lessonId);
          }
          set({
            byCourse: {
              ...get().byCourse,
              [courseId]: {
                lessonIds: next,
                updatedAt: now(),
              },
            },
          });
        },

        clearCourse(courseId: CourseId) {
          const { [courseId]: _dropped, ...rest } = get().byCourse;
          void _dropped;
          set({ byCourse: rest });
        },

        replaceCourseBookmarks(courseId: CourseId, snapshot: CourseBookmarksSnapshot) {
          set({
            byCourse: {
              ...get().byCourse,
              [courseId]: {
                lessonIds: new Set(snapshot.lessonIds),
                updatedAt: snapshot.updatedAt,
              },
            },
          });
        },
      }),
      {
        name: storageKey,
        version: BOOKMARKS_SCHEMA_VERSION,
        storage: createJSONStorage(() => storage, {
          replacer: (_key, value) =>
            value instanceof Set ? Array.from(value as Set<LessonId>) : value,
          reviver: (key, value) =>
            key === 'lessonIds' && Array.isArray(value) ? new Set(value as LessonId[]) : value,
        }),
        partialize: (state) => ({ byCourse: state.byCourse }),
        migrate: (persistedState, _version) => persistedState as BookmarkStoreState,
      },
    ),
  );
}
