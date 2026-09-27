/**
 * JSON shapes shared by the `/api/me/progress*` and `/api/me/bookmarks*`
 * route handlers and the browser sync layer. Field names mirror
 * `docs/CONTENT_MODEL.md` → `UserProgress`. No `server-only` here: both
 * sides import it.
 */
export const PROGRESS_ENDPOINT = '/api/me/progress';
export const BOOKMARKS_ENDPOINT = '/api/me/bookmarks';

/** GET / POST sync response and POST sync request body. */
export interface ProgressWire {
  readonly courseId: string;
  readonly completedLessonIds: readonly string[];
  readonly lastOpenedLessonId: string | null;
  readonly updatedAt: string;
}

/** PATCH body: what changed since the last flush. */
export interface ProgressDeltaWire {
  readonly courseId: string;
  readonly complete?: readonly string[];
  readonly uncomplete?: readonly string[];
  /** Absent = unchanged; `null` = cleared. */
  readonly lastOpenedLessonId?: string | null;
}

export interface BookmarksWire {
  readonly courseId: string;
  readonly lessonIds: readonly string[];
  readonly updatedAt: string;
}

export interface BookmarksDeltaWire {
  readonly courseId: string;
  readonly add?: readonly string[];
  readonly remove?: readonly string[];
}
