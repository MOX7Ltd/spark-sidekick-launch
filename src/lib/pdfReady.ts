export async function waitForPdfReadiness(root: HTMLElement): Promise<void> {
  // 1) Wait for next frames to flush layout
  await new Promise(resolve => 
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  // 2) Wait for fonts
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // 3) Wait for images (including inline <img>)
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true }); // fail open
      });
    })
  );
}

export function roughlyHasContent(el: HTMLElement): boolean {
  const text = el.innerText?.trim() ?? '';
  const imgs = el.querySelectorAll('img');
  return text.length > 10 || imgs.length > 0;
}
