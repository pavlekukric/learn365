/** Geometry of a scrolling list and one row inside it, in viewport pixels. */
export interface RevealGeometry {
  /** Top edge of the list's visible box. */
  readonly listTop: number;
  /** Height of the list's visible box. */
  readonly listHeight: number;
  /** The list's current `scrollTop`. */
  readonly scrollTop: number;
  /** Top edge of the row, as currently painted. */
  readonly rowTop: number;
  readonly rowHeight: number;
}

/**
 * Where to scroll a list so a row that is (partly) outside its visible box
 * ends up centred in it. `null` when the row is already fully visible — a
 * list the reader can see their place in is left alone.
 */
export function revealScrollTop(geometry: RevealGeometry): number | null {
  const { listTop, listHeight, scrollTop, rowTop, rowHeight } = geometry;
  if (listHeight <= 0) return null;
  const rowBottom = rowTop + rowHeight;
  const listBottom = listTop + listHeight;
  if (rowTop >= listTop && rowBottom <= listBottom) return null;
  const centred = scrollTop + (rowTop - listTop) - (listHeight - rowHeight) / 2;
  return Math.max(0, Math.round(centred));
}
