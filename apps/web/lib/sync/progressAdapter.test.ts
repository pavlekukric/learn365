import { describe, expect, it } from 'vitest';

import { createProgressStore, type ProgressStorage } from '@learn365/core';

import { memoryMarker } from './marker';
import {
  createProgressAdapter,
  mergeProgressDelta,
  parseProgressWire,
  withPendingProgress,
  type ProgressDelta,
} from './progressAdapter';

class InMemoryStorage implements ProgressStorage {
  private readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const COURSE = 'istorija-srbije-365';
const T = '2026-09-27T10:00:00.000Z';

function setup() {
  const store = createProgressStore({ storage: new InMemoryStorage(), now: () => T });
  const adapter = createProgressAdapter(store, memoryMarker());
  const deltas: { courseId: string; delta: ProgressDelta }[] = [];
  const unsubscribe = adapter.subscribe((courseId, delta) => deltas.push({ courseId, delta }));
  return { store, adapter, deltas, unsubscribe };
}

describe('progress adapter', () => {
  it('reports completions, un-completions and last-opened changes as deltas', () => {
    const { store, deltas } = setup();
    store.getState().toggleComplete(COURSE, 'day-001');
    store.getState().markOpened(COURSE, 'day-002');
    store.getState().toggleComplete(COURSE, 'day-001');

    expect(deltas).toEqual([
      { courseId: COURSE, delta: { complete: new Set(['day-001']), uncomplete: new Set() } },
      {
        courseId: COURSE,
        delta: { complete: new Set(), uncomplete: new Set(), lastOpened: 'day-002' },
      },
      { courseId: COURSE, delta: { complete: new Set(), uncomplete: new Set(['day-001']) } },
    ]);
  });

  it('reports a reset course as un-completing everything', () => {
    const { store, deltas } = setup();
    store.getState().toggleComplete(COURSE, 'day-001');
    store.getState().markOpened(COURSE, 'day-001');
    deltas.length = 0;
    store.getState().resetCourse(COURSE);
    expect(deltas).toEqual([
      {
        courseId: COURSE,
        delta: { complete: new Set(), uncomplete: new Set(['day-001']), lastOpened: null },
      },
    ]);
  });

  it('reads the local snapshot and applies a remote one with pending changes on top', () => {
    const { store, adapter } = setup();
    store.getState().toggleComplete(COURSE, 'day-005');
    expect(adapter.readLocal(COURSE)).toEqual({
      completedLessonIds: ['day-005'],
      lastOpenedLessonId: null,
      updatedAt: T,
    });

    adapter.applyRemote(
      COURSE,
      {
        courseId: COURSE,
        completedLessonIds: ['day-001', 'day-002'],
        lastOpenedLessonId: 'day-003',
        updatedAt: T,
      },
      { complete: new Set(['day-009']), uncomplete: new Set(['day-002']), lastOpened: 'day-009' },
    );
    const course = store.getState().byCourse[COURSE];
    expect(course?.completedLessonIds).toEqual(new Set(['day-001', 'day-009']));
    expect(course?.lastOpenedLessonId).toBe('day-009');

    expect(() => adapter.applyRemote(COURSE, { nope: true }, undefined)).toThrow();
  });

  it('serialises a delta to the PATCH shape', () => {
    const { adapter } = setup();
    expect(
      adapter.serializeDelta(COURSE, {
        complete: new Set(['a']),
        uncomplete: new Set(['b']),
        lastOpened: null,
      }),
    ).toEqual({ courseId: COURSE, complete: ['a'], uncomplete: ['b'], lastOpenedLessonId: null });
    expect(adapter.serializeDelta(COURSE, { complete: new Set(), uncomplete: new Set() })).toEqual({
      courseId: COURSE,
      complete: [],
      uncomplete: [],
    });
  });
});

describe('mergeProgressDelta / withPendingProgress / parseProgressWire', () => {
  it('lets the newer delta win per lesson and keeps the latest lastOpened', () => {
    const merged = mergeProgressDelta(
      { complete: new Set(['a', 'b']), uncomplete: new Set(['c']), lastOpened: 'x' },
      { complete: new Set(['c']), uncomplete: new Set(['a']) },
    );
    expect(merged).toEqual({
      complete: new Set(['b', 'c']),
      uncomplete: new Set(['a']),
      lastOpened: 'x',
    });
    expect(
      mergeProgressDelta(
        { complete: new Set(), uncomplete: new Set() },
        { complete: new Set(), uncomplete: new Set(), lastOpened: null },
      ),
    ).toEqual({
      complete: new Set(),
      uncomplete: new Set(),
      lastOpened: null,
    });
  });

  it('re-applies pending on a snapshot and validates wire payloads', () => {
    const snapshot = { completedLessonIds: ['a'], lastOpenedLessonId: 'a', updatedAt: T };
    expect(withPendingProgress(snapshot, undefined)).toBe(snapshot);
    expect(
      withPendingProgress(snapshot, { complete: new Set(['b']), uncomplete: new Set(['a']) }),
    ).toEqual({
      completedLessonIds: ['b'],
      lastOpenedLessonId: 'a',
      updatedAt: T,
    });
    expect(
      parseProgressWire({ completedLessonIds: ['a'], lastOpenedLessonId: null, updatedAt: T }),
    ).toEqual({
      completedLessonIds: ['a'],
      lastOpenedLessonId: null,
      updatedAt: T,
    });
    expect(
      parseProgressWire({ completedLessonIds: [1], lastOpenedLessonId: null, updatedAt: T }),
    ).toBeNull();
    expect(
      parseProgressWire({ completedLessonIds: [], lastOpenedLessonId: 5, updatedAt: T }),
    ).toBeNull();
    expect(parseProgressWire(null)).toBeNull();
  });
});
