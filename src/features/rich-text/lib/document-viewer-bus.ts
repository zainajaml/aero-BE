const OPEN_EVENT = "spacescope:open-document";

/** Open the shared document preview modal for a document id. */
export function openDocumentViewer(documentId: string) {
  if (typeof window === "undefined" || !documentId) return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: documentId }));
}

export function onOpenDocumentViewer(cb: (id: string) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
