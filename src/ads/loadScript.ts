const pendingLoads = new Map<string, Promise<boolean>>();

/** Adds a script to the page once; resolves `false` if it cannot be loaded (e.g. an ad blocker). */
export function loadScriptOnce(src: string, doc: Document = document): Promise<boolean> {
  const pending = pendingLoads.get(src);
  // A script that was taken out of the page again has to be added again.
  if (pending && doc.querySelector(`script[src="${src}"]`)) return pending;

  const load = new Promise<boolean>((resolve) => {
    const script = doc.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = src;
    script.addEventListener('load', () => {
      resolve(true);
    });
    script.addEventListener('error', () => {
      script.remove();
      resolve(false);
    });
    doc.head.append(script);
  });
  pendingLoads.set(src, load);
  return load;
}
