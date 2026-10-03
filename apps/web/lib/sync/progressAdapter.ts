import type { StoreApi } from 'zustand';

import {
  diffSets,
  toProgressSnapshot,
  type CourseProgressSnapshot,
  type ProgressStoreState,
} from '@learn365/core';

import { PROGRESS_MARKER_KEY } from '@/lib/auth/localKeys';

import { localStorageMarker, type Marker } from './marker';
import type { DeltaCodec } from './pendingQueue';
import type { SyncAdapter } from './syncEngine';
import { PROGRESS_ENDPOINT, type ProgressDeltaWire } from './wire';

/** Accumulated local changes for one course, not yet acknowledged by the server. */
export interface ProgressDelta {
  readonly complete: ReadonlySet<string>;
  readonly uncomplete: ReadonlySet<string>;
  /** Absent = unchanged; `null` = cleared. */
  readonly lastOpened?: string | null;
}

/** Defensive parse of a `ProgressWire` body into a snapshot; `null` if malformed. */
export function parseProgressWire(value: unknown): CourseProgressSnapshot | null {
  if (value === null || typeof value !== 'object') return null;
  const { completedLessonIds, lastOpenedLessonId, updatedAt } = value as Record<string, unknown>;
  if (
    !Array.isArray(completedLessonIds) ||
    !completedLessonIds.every((id) => typeof id === 'string')
  ) {
    return null;
  }
  if (lastOpenedLessonId !== null && typeof lastOpenedLessonId !== 'string') return null;
  if (typeof updatedAt !== 'string') return null;
  return { completedLessonIds: completedLessonIds as string[], lastOpenedLessonId, updatedAt };
}

export function mergeProgressDelta(into: ProgressDelta, next: ProgressDelta): ProgressDelta {
  const complete = new Set(into.complete);
  const uncomplete = new Set(into.uncomplete);
  for (const id of next.uncomplete) {
    complete.delete(id);
    uncomplete.add(id);
  }
  for (const id of next.complete) {
    uncomplete.delete(id);
    complete.add(id);
  }
  const lastOpened = next.lastOpened !== undefined ? next.lastOpened : into.lastOpened;
  return lastOpened === undefined ? { complete, uncomplete } : { complete, uncomplete, lastOpened };
}

/** What `queued` still owes once `sent` has been delivered (`pendingQueue` ack). */
export function subtractProgressDelta(queued: ProgressDelta, sent: ProgressDelta): ProgressDelta {
  const complete = new Set([...queued.complete].filter((id) => !sent.complete.has(id)));
  const uncomplete = new Set([...queued.uncomplete].filter((id) => !sent.uncomplete.has(id)));
  const lastOpened =
    queued.lastOpened !== undefined && queued.lastOpened !== sent.lastOpened
      ? queued.lastOpened
      : undefined;
  return lastOpened === undefined ? { complete, uncomplete } : { complete, uncomplete, lastOpened };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const progressDeltaCodec: DeltaCodec<ProgressDelta> = {
  merge: mergeProgressDelta,
  subtract: subtractProgressDelta,
  isEmpty: (delta) =>
    delta.complete.size === 0 && delta.uncomplete.size === 0 && delta.lastOpened === undefined,
  toJSON: (delta) => ({
    complete: [...delta.complete],
    uncomplete: [...delta.uncomplete],
    ...(delta.lastOpened !== undefined ? { lastOpened: delta.lastOpened } : {}),
  }),
  fromJSON(value) {
    if (value === null || typeof value !== 'object') return null;
    const { complete, uncomplete, lastOpened } = value as Record<string, unknown>;
    if (!isStringArray(complete) || !isStringArray(uncomplete)) return null;
    if (lastOpened !== undefined && lastOpened !== null && typeof lastOpened !== 'string')
      return null;
    const base = { complete: new Set(complete), uncomplete: new Set(uncomplete) };
    return lastOpened === undefined ? base : { ...base, lastOpened };
  },
};

/** Put a delta back on top of a snapshot (used when a change raced a load). */
export function withPendingProgress(
  snapshot: CourseProgressSnapshot,
  pending: ProgressDelta | undefined,
): CourseProgressSnapshot {
  if (pending === undefined) return snapshot;
  const ids = new Set(snapshot.completedLessonIds);
  for (const id of pending.complete) ids.add(id);
  for (const id of pending.uncomplete) ids.delete(id);
  return {
    completedLessonIds: [...ids],
    lastOpenedLessonId:
      pending.lastOpened !== undefined ? pending.lastOpened : snapshot.lastOpenedLessonId,
    updatedAt: snapshot.updatedAt,
  };
}

export function createProgressAdapter(
  store: StoreApi<ProgressStoreState>,
  marker: Marker = localStorageMarker(PROGRESS_MARKER_KEY),
): SyncAdapter<ProgressDelta> {
  return {
    endpoint: PROGRESS_ENDPOINT,
    marker,

    subscribe(onDelta) {
      return store.subscribe((state, prev) => {
        if (state.byCourse === prev.byCourse) return;
        const courseIds = new Set([...Object.keys(prev.byCourse), ...Object.keys(state.byCourse)]);
        for (const courseId of courseIds) {
          const before = prev.byCourse[courseId];
          const after = state.byCourse[courseId];
          if (before === after) continue;
          const { added, removed } = diffSets(
            before?.completedLessonIds,
            after?.completedLessonIds,
          );
          const lastBefore = before?.lastOpenedLessonId ?? null;
          const lastAfter = after?.lastOpenedLessonId ?? null;
          if (added.length === 0 && removed.length === 0 && lastBefore === lastAfter) continue;
          const delta: ProgressDelta =
            lastBefore === lastAfter
              ? { complete: new Set(added), uncomplete: new Set(removed) }
              : { complete: new Set(added), uncomplete: new Set(removed), lastOpened: lastAfter };
          onDelta(courseId, delta);
        }
      });
    },

    readLocal(courseId) {
      const snapshot = toProgressSnapshot(store.getState().byCourse[courseId]);
      return {
        completedLessonIds: snapshot.completedLessonIds,
        lastOpenedLessonId: snapshot.lastOpenedLessonId,
        updatedAt: snapshot.updatedAt,
      };
    },

    applyRemote(courseId, remote, pending) {
      const snapshot = parseProgressWire(remote);
      if (snapshot === null) throw new Error('progress payload is malformed');
      store.getState().replaceCourseProgress(courseId, withPendingProgress(snapshot, pending));
    },

    serializeDelta(courseId, delta) {
      const body: ProgressDeltaWire = {
        courseId,
        complete: [...delta.complete],
        uncomplete: [...delta.uncomplete],
        ...(delta.lastOpened !== undefined ? { lastOpenedLessonId: delta.lastOpened } : {}),
      };
      return body as unknown as Record<string, unknown>;
    },
  };
}
