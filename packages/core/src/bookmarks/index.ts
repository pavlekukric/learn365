export {
  BOOKMARKS_SCHEMA_VERSION,
  BOOKMARKS_STORAGE_KEY,
  type BookmarkActions,
  type BookmarkState,
  type BookmarkStorage,
  type BookmarkStoreState,
  type CourseBookmarks,
  type CourseBookmarksSnapshot,
} from './types.js';

export { createBookmarkStore, type CreateBookmarkStoreOptions } from './store.js';

export { bookmarkCount, bookmarkedLessonIds, isBookmarked } from './selectors.js';

export { EMPTY_BOOKMARKS_SNAPSHOT, mergeCourseBookmarks, toBookmarksSnapshot } from './merge.js';
