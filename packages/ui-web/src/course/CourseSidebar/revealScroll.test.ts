import { describe, expect, it } from 'vitest';

import { revealScrollTop } from './revealScroll.js';

// A sidebar list 836 px tall that starts under the 64 px TopBar.
const list = { listTop: 64, listHeight: 836 };

describe('revealScrollTop', () => {
  it('leaves the list alone when the row is fully visible', () => {
    expect(revealScrollTop({ ...list, scrollTop: 0, rowTop: 400, rowHeight: 60 })).toBeNull();
    expect(revealScrollTop({ ...list, scrollTop: 300, rowTop: 64, rowHeight: 60 })).toBeNull();
    expect(revealScrollTop({ ...list, scrollTop: 300, rowTop: 840, rowHeight: 60 })).toBeNull();
  });

  it('centres a row that sits below the visible box', () => {
    // Row 1200 px down the page: 1136 px into the list, centred at (836 - 60) / 2 = 388.
    expect(revealScrollTop({ ...list, scrollTop: 0, rowTop: 1200, rowHeight: 60 })).toBe(748);
  });

  it('centres a row that sits above the visible box', () => {
    // Scrolled 900 px; the row is 200 px above the list's top edge.
    expect(revealScrollTop({ ...list, scrollTop: 900, rowTop: -136, rowHeight: 60 })).toBe(312);
  });

  it('reveals a row that is only partly visible', () => {
    expect(revealScrollTop({ ...list, scrollTop: 0, rowTop: 870, rowHeight: 60 })).toBe(418);
  });

  it('never scrolls above the top of the list', () => {
    expect(revealScrollTop({ ...list, scrollTop: 40, rowTop: 30, rowHeight: 60 })).toBe(0);
  });

  it('does nothing for a list that is not laid out (hidden sidebar)', () => {
    expect(
      revealScrollTop({ listTop: 0, listHeight: 0, scrollTop: 0, rowTop: 0, rowHeight: 0 }),
    ).toBeNull();
  });
});
