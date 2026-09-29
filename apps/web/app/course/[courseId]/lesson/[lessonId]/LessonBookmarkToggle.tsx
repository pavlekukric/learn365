'use client';

import { isBookmarked } from '@learn365/core';
import { LessonBookmarkButton } from '@learn365/ui-web';

import { useBookmarkStore } from '@/lib/bookmarks/BookmarkStoreProvider';

interface LessonBookmarkToggleProps {
  courseId: string;
  lessonId: string;
}

/** The header's save-for-later toggle, wired to the bookmark store. */
export function LessonBookmarkToggle({ courseId, lessonId }: LessonBookmarkToggleProps) {
  const bookmarked = useBookmarkStore((state) => isBookmarked(state, courseId, lessonId));
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  return (
    <LessonBookmarkButton
      isBookmarked={bookmarked}
      onToggle={() => {
        toggleBookmark(courseId, lessonId);
      }}
    />
  );
}
