import type { StoreApi } from 'zustand';

import {
  diffSets,
  toBookmarksSnapshot,
  type BookmarkStoreState,
  type CourseBookmarksSnapshot,
} from '@learn365/core';

import { BOOKMARKS_MARKER_KEY } from '@/lib/auth/localKeys';

import { localStorageMarker, type Marker } from './marker';
import type { SyncAdapter } from './syncEngine';
import { BOOKMARKS_ENDPOINT, type BookmarksDeltaWire } from './wire';

/** Accumulated local bookmark changes for one course. */
export interface BookmarksDelta {
  readonly add: ReadonlySet<string>;
  readonly remove: ReadonlySet<string>;
}

export function parseBookmarksWire(value: unknown): CourseBookmarksSnapshot | null {
  if (value === null || typeof value !== 'object') return null;
  const { lessonIds, updatedAt } = value as Record<string, unknown>;
  if (!Array.isArray(lessonIds) || !lessonIds.every((id) => typeof id === 'string')) return null;
  if (typeof updatedAt !== 'string') return null;
  return { lessonIds: lessonIds as string[], updatedAt };
}

export function mergeBookmarksDelta(into: BookmarksDelta, next: BookmarksDelta): BookmarksDelta {
  const add = new Set(into.add);
  const remove = new Set(into.remove);
  for (const id of next.remove) {
    add.delete(id);
    remove.add(id);
  }
  for (const id of next.add) {
    remove.delete(id);
    add.add(id);
  }
  return { add, remove };
}

export function withPendingBookmarks(
  snapshot: CourseBookmarksSnapshot,
  pending: BookmarksDelta | undefined,
): CourseBookmarksSnapshot {
  if (pending === undefined) return snapshot;
  const ids = new Set(snapshot.lessonIds);
  for (const id of pending.add) ids.add(id);
  for (const id of pending.remove) ids.delete(id);
  return { lessonIds: [...ids], updatedAt: snapshot.updatedAt };
}

export function createBookmarkAdapter(
  store: StoreApi<BookmarkStoreState>,
  marker: Marker = localStorageMarker(BOOKMARKS_MARKER_KEY),
): SyncAdapter<BookmarksDelta> {
  return {
    endpoint: BOOKMARKS_ENDPOINT,
    marker,

    subscribe(onDelta) {
      return store.subscribe((state, prev) => {
        if (state.byCourse === prev.byCourse) return;
        const courseIds = new Set([...Object.keys(prev.byCourse), ...Object.keys(state.byCourse)]);
        for (const courseId of courseIds) {
          const before = prev.byCourse[courseId];
          const after = state.byCourse[courseId];
          if (before === after) continue;
          const { added, removed } = diffSets(before?.lessonIds, after?.lessonIds);
          if (added.length === 0 && removed.length === 0) continue;
          onDelta(courseId, { add: new Set(added), remove: new Set(removed) });
        }
      });
    },

    readLocal(courseId) {
      const snapshot = toBookmarksSnapshot(store.getState().byCourse[courseId]);
      return { lessonIds: snapshot.lessonIds, updatedAt: snapshot.updatedAt };
    },

    applyRemote(courseId, remote, pending) {
      const snapshot = parseBookmarksWire(remote);
      if (snapshot === null) throw new Error('bookmarks payload is malformed');
      store.getState().replaceCourseBookmarks(courseId, withPendingBookmarks(snapshot, pending));
    },

    mergeDelta: mergeBookmarksDelta,

    serializeDelta(courseId, delta) {
      const body: BookmarksDeltaWire = { courseId, add: [...delta.add], remove: [...delta.remove] };
      return body as unknown as Record<string, unknown>;
    },
  };
}
