import { describe, expect, it } from 'vitest';

import { isSignInAskDue, type SignInAskInput } from './signInAsk';

const due: SignInAskInput = {
  ready: true,
  accountsEnabled: true,
  signedIn: false,
  dismissed: false,
  completedCount: 2,
  lessonId: 'day-002',
  lessonCompleted: true,
  shownOnLessonId: null,
};

describe('isSignInAskDue', () => {
  it('is due after the second completed lesson for a signed-out reader', () => {
    expect(isSignInAskDue(due)).toBe(true);
  });

  it('waits for the second completion', () => {
    expect(isSignInAskDue({ ...due, completedCount: 1 })).toBe(false);
  });

  it('never shows while accounts are off, unanswered, or somebody is signed in', () => {
    expect(isSignInAskDue({ ...due, accountsEnabled: false })).toBe(false);
    expect(isSignInAskDue({ ...due, ready: false })).toBe(false);
    expect(isSignInAskDue({ ...due, signedIn: true })).toBe(false);
  });

  it('respects `Ne sada`, and waits until the dismissal was read', () => {
    expect(isSignInAskDue({ ...due, dismissed: true })).toBe(false);
    expect(isSignInAskDue({ ...due, dismissed: null })).toBe(false);
  });

  it('stays on the lesson it was first shown on in this session', () => {
    expect(isSignInAskDue({ ...due, shownOnLessonId: 'day-002' })).toBe(true);
  });

  it('is not repeated on another lesson in the same session', () => {
    expect(
      isSignInAskDue({ ...due, completedCount: 3, lessonId: 'day-003', shownOnLessonId: 'day-002' }),
    ).toBe(false);
  });

  it('is not due — and so not spent — on a lesson that is not completed', () => {
    expect(isSignInAskDue({ ...due, completedCount: 5, lessonCompleted: false })).toBe(false);
  });

  it('waits until the session record was read', () => {
    expect(isSignInAskDue({ ...due, shownOnLessonId: undefined })).toBe(false);
  });
});
