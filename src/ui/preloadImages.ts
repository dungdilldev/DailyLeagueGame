// Kept alive so the browser does not drop a request before it has finished and cached the file.
const requested = new Set<string>();

/** Starts fetching images so they are in the browser cache by the time a round shows them. */
export function preloadImages(urls: readonly string[]): void {
  for (const url of urls) {
    if (requested.has(url)) continue;
    requested.add(url);
    new Image().src = url;
  }
}
