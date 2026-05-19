/**
 * Entity contracts for course content.
 * Mirrors docs/APP_ARCHITECTURE.md §7 and docs/CONTENT_MODEL.md.
 *
 * These types are the canonical shape used across `@learn365/core`,
 * `@learn365/ui-web`, and any app. The data files (course/era/section/lesson)
 * live alongside these types in `src/courses/<course-id>/`.
 */

export type CourseId = string;
export type EraId = string;
export type SectionId = string;
export type LessonId = string;

export type Language = 'sr';
export type Script = 'latin' | 'cyrillic';

export interface Course {
  readonly id: CourseId;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly totalLessons: number;
  readonly language: Language;
  readonly defaultScript: Script;
  readonly estimatedMinutesPerLesson: number;
  readonly coverImage?: string;
}

/**
 * High-level chronological band shown on the historical timeline.
 * 8 eras span the first course. Eras drive the timeline; sections drive the sidebar.
 */
export interface Era {
  readonly id: EraId;
  readonly courseId: CourseId;
  /** Roman numeral display, e.g. "II". */
  readonly num: string;
  readonly title: string;
  readonly description: string;
  readonly yearStart: number;
  readonly yearEnd: number;
  /** Display string for the era's year range, e.g. "1166–1371". */
  readonly yearsLabel: string;
  /** Short tag for compact contexts (timeline, chips). */
  readonly eraShort: string;
  readonly order: number;
}

/**
 * Sidebar accordion unit inside an Era. Lesson counts per section
 * are 8–18; section ranges are contiguous within a course.
 */
export interface Section {
  readonly id: SectionId;
  readonly courseId: CourseId;
  readonly eraId: EraId;
  readonly title: string;
  readonly subtitle?: string;
  readonly order: number;
  readonly startDay: number;
  readonly endDay: number;
}

export type LessonBlock =
  | { readonly type: 'paragraph'; readonly text: string; readonly dropcap?: boolean }
  | { readonly type: 'heading'; readonly level: 2 | 3; readonly text: string }
  | { readonly type: 'quote'; readonly text: string; readonly attribution?: string }
  | {
      readonly type: 'image';
      readonly src: string;
      readonly alt: string;
      /** Intrinsic pixel width of the source asset. Required for next/image. */
      readonly width: number;
      /** Intrinsic pixel height of the source asset. Required for next/image. */
      readonly height: number;
      /**
       * Caption rendered under the figure. By v1 convention this also
       * carries the attribution string (e.g. "Foto: …, CC BY-SA 4.0,
       * Wikimedia Commons.") so there is no separate attribution field.
       */
      readonly caption?: string;
    };

/**
 * Single citation entry shown in a lesson's "Izvori" block.
 * Optional everywhere on `Lesson`; the renderer omits the block when absent.
 */
export type SourceKind = 'book' | 'article' | 'museum' | 'archive' | 'web';

export interface Source {
  readonly kind: SourceKind;
  readonly title: string;
  readonly author?: string;
  /** Year of publication (book/article) or year accessed (web). Display-only. */
  readonly year?: number;
  /** Absolute URL. Must parse via `new URL(...)` when present. */
  readonly url?: string;
}

/**
 * Editorial attribution rendered as a small caption under the lesson title.
 * Both roles are independently optional; if both are absent, the byline line
 * is not rendered at all (no generic course-wide fallback in v1).
 */
export interface LessonByline {
  readonly author?: string;
  readonly reviewer?: string;
}

export interface Lesson {
  readonly id: LessonId;
  readonly courseId: CourseId;
  readonly sectionId: SectionId;
  readonly eraId: EraId;
  /** 1..365 unique within a course. */
  readonly dayNumber: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly readingTimeMinutes: number;
  readonly year: number;
  /** Display label for the lesson's date/period, e.g. "1166." or "oko 9500–6000. p.n.e.". */
  readonly dateLabel?: string;
  /** Compact label for timeline pin, e.g. "9500 BCE". */
  readonly timelinePosition?: string;
  readonly content: readonly LessonBlock[];
  /**
   * True for auto-generated stub lessons that are not yet authored.
   * The reader renders a calm "upcoming" state instead of body content,
   * and completion is disabled. Authored lessons leave this unset.
   */
  readonly isPlaceholder?: boolean;
  readonly summary?: string;
  readonly keyPeople?: readonly string[];
  readonly keyPlaces?: readonly string[];
  /** Editorial attribution. When absent, no byline line is rendered. */
  readonly byline?: LessonByline;
  /**
   * ISO date (YYYY-MM-DD) recording when the lesson's facts were last
   * editorially reviewed. Rendered alongside the byline; nothing rendered
   * when absent.
   */
  readonly lastReviewedAt?: string;
  /**
   * Citations for the historical claims in the lesson body. Rendered as
   * a closing "Izvori" block. Optional in v1 — many lessons predate the
   * editorial review pass and carry no sources yet.
   */
  readonly sources?: readonly Source[];
  /** Position within the parent Section, 1-indexed. */
  readonly order: number;
}

/**
 * Local progress state for a single course.
 * Persisted by `@learn365/core`'s ProgressStore.
 */
export interface UserProgress {
  readonly courseId: CourseId;
  readonly completedLessonIds: ReadonlySet<LessonId>;
  readonly lastOpenedLessonId: LessonId | null;
  readonly updatedAt: string;
}

/**
 * Derived lesson state, computed from `UserProgress` + the currently-open lesson.
 * Not persisted.
 */
export type LessonState = 'completed' | 'active' | 'not_started';
