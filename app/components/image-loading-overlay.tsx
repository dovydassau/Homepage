export function ImageLoadingOverlay({ loaded }: { loaded: boolean }) {
  return (
    <>
      <div
        className={`preview-shimmer absolute inset-0 transition-opacity duration-300 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-[var(--surface-hover)] transition-opacity duration-200 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="preview-progress-bar h-full w-1/3 rounded-full bg-[var(--accent)]" />
      </div>
    </>
  )
}

export function markImageLoaded(
  node: HTMLImageElement | null,
  loaded: boolean,
  onLoad: () => void,
) {
  if (node?.complete && node.naturalWidth > 0 && !loaded) {
    // Handle images already available from the browser cache.
    setTimeout(onLoad, 0)
  }
}
