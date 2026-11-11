// Resolve only author-editable object IDs. Helpers, lights, grid and floors are excluded.
export function resolveEditorHit(hits, validIds) {
  if (!Array.isArray(hits)) return null;
  for (const hit of hits) {
    let node = hit?.object;
    while (node) {
      const id = node.userData?.editorId;
      if (typeof id === 'string' && validIds.has(id)) return id;
      node = node.parent;
    }
  }
  return null;
}
export function isSelectionTap(start, event, threshold=7) {
  return Boolean(start && event && Number.isFinite(event.clientX) &&
    Number.isFinite(event.clientY) &&
    Math.hypot(event.clientX-start.x,event.clientY-start.y)<=threshold);
}
