import type { StoreApi } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { CourseId, LessonId } from '@learn365/content/types';

import {
  DEFAULT_STORAGE_KEY,
  PROGRESS_SCHEMA_VERSION,
  type CourseProgress,
  type ProgressStorage,
  type ProgressStoreState,
} from './types.js';

export interface CreateProgressStoreOptions {
  /** Platform-provided storage adapter (web: localStorage; mobile: AsyncStorage). */
  readonly storage: ProgressStorage;
  /** Override the persistence key. Defaults to `learn365:progress:v1`. */
  readonly storageKey?: string;
  /** Override the date function — useful in tests. */
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function emptyCourse(now: () => string): CourseProgress {
  return {
    completedLessonIds: new Set<LessonId>(),
    lastOpenedLessonId: null,
    updatedAt: now(),
  };
}

/**
 * Builds the progress store. No React imports — call this from a
 * platform-specific provider that wires it into a hook.
 *
 * Persistence treats `Set<LessonId>` as an array on disk; revival
 * restores the Set shape so equality / size operations stay O(1).
 */
export function createProgressStore(
  options: CreateProgressStoreOptions,
): StoreApi<ProgressStoreState> {
  const now = options.now ?? defaultNow;
  const storage = options.storage as StateStorage;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  return createStore<ProgressStoreState>()(
    persist(
      (set, get) => ({
        byCourse: {},

        toggleComplete(courseId: CourseId, lessonId: LessonId) {
          const prev = get().byCourse[courseId] ?? emptyCourse(now);
          const next = new Set(prev.completedLessonIds);
          if (next.has(lessonId)) {
            next.delete(lessonId);
          } else {
            next.add(lessonId);
          }
          set({
            byCourse: {
              ...get().byCourse,
              [courseId]: {
                completedLessonIds: next,
                lastOpenedLessonId: prev.lastOpenedLessonId,
                updatedAt: now(),
              },
            },
          });
        },

        markOpened(courseId: CourseId, lessonId: LessonId) {
          const prev = get().byCourse[courseId] ?? emptyCourse(now);
          if (prev.lastOpenedLessonId === lessonId) return;
          set({
            byCourse: {
              ...get().byCourse,
              [courseId]: {
                completedLessonIds: prev.completedLessonIds,
                lastOpenedLessonId: lessonId,
                updatedAt: now(),
              },
            },
          });
        },

        resetCourse(courseId: CourseId) {
          const { [courseId]: _dropped, ...rest } = get().byCourse;
          void _dropped;
          set({ byCourse: rest });
        },
      }),
      {
        name: storageKey,
        version: PROGRESS_SCHEMA_VERSION,
        storage: createJSONStorage(() => storage, {
          replacer: (_key, value) =>
            value instanceof Set ? Array.from(value as Set<LessonId>) : value,
          reviver: (key, value) =>
            key === 'completedLessonIds' && Array.isArray(value)
              ? new Set(value as LessonId[])
              : value,
        }),
        partialize: (state) => ({ byCourse: state.byCourse }),
        migrate: (persistedState, _version) => persistedState as ProgressStoreState,
      },
    ),
  );
}
