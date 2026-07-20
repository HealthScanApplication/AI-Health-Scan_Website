/*
 * appIconCover — the ONE deterministic "app-icon" framing every protocol cover
 * gets, so the suggested-routine shelf reads as a single branded set. It takes
 * any source image and composites a square-in-square look: a sharp, rounded
 * inner square (the icon) centred on a heavily-blurred, zoomed copy of the SAME
 * image (the wallpaper) — exactly like an iOS icon on a blurred background,
 * matching the reference Self-Heal-by-Design cover.
 *
 * Applied to BOTH AI-generated and uploaded images, so the framing is identical
 * regardless of source. The matching generation prompt (a clean centred emblem,
 * no built-in blur) lives in PROTOCOL_COVER_STYLE — the canvas adds the frame.
 */

export interface AppIconCoverOpts {
  size?: number;   // output canvas edge in px (square). default 1024
  inset?: number;  // inner-square edge as a fraction of size. default 0.72
  blur?: number;   // background blur radius in px. default 48
  radius?: number; // inner-square corner radius as a fraction of its edge. default 0.18
  bgZoom?: number; // background scale so the blur never reveals canvas edges. default 1.18
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Public Supabase storage URLs send Access-Control-Allow-Origin: * so the
    // canvas stays untainted and toBlob() works. Data URLs are same-origin.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load source image (CORS or 404)'));
    img.src = url;
  });
}

// The largest centred square crop of an iw×ih image (object-cover to a square).
function coverSquare(iw: number, ih: number) {
  const s = Math.min(iw, ih);
  return { sx: (iw - s) / 2, sy: (ih - s) / 2, ss: s };
}

function traceRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Frame `srcUrl` into the app-icon template and return a PNG blob. */
export async function composeAppIconCover(srcUrl: string, opts: AppIconCoverOpts = {}): Promise<Blob> {
  const size = opts.size ?? 1024;
  const inset = opts.inset ?? 0.72;
  const blur = opts.blur ?? 48;
  const radius = opts.radius ?? 0.18;
  const bgZoom = opts.bgZoom ?? 1.18;

  const img = await loadImage(srcUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const { sx, sy, ss } = coverSquare(img.naturalWidth || img.width, img.naturalHeight || img.height);

  // 1) blurred, zoomed background — the same image cover-filling the whole frame.
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  const bg = size * bgZoom;
  const off = (size - bg) / 2;
  ctx.drawImage(img, sx, sy, ss, ss, off, off, bg, bg);
  ctx.restore();

  // 2) subtle on-brand scrim for depth + contrast behind the inset.
  ctx.fillStyle = 'rgba(22, 20, 15, 0.14)'; // ROUTINE³ ink, low alpha
  ctx.fillRect(0, 0, size, size);

  const inEdge = Math.round(size * inset);
  const inXY = Math.round((size - inEdge) / 2);
  const r = Math.round(inEdge * radius);

  // 3a) solid paper backing + soft drop shadow so the icon lifts off the blur.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = Math.round(size * 0.045);
  ctx.shadowOffsetY = Math.round(size * 0.012);
  traceRoundRect(ctx, inXY, inXY, inEdge, inEdge, r);
  ctx.fillStyle = '#FAF5EC';
  ctx.fill();
  ctx.restore();

  // 3b) the sharp source image, clipped to the same rounded square.
  ctx.save();
  traceRoundRect(ctx, inXY, inXY, inEdge, inEdge, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, ss, ss, inXY, inXY, inEdge, inEdge);
  ctx.restore();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed (tainted?)'))), 'image/png');
  });
}

/** Convenience: frame → File, ready to hand to uploadProtocolImage. */
export async function composeAppIconCoverFile(
  srcUrl: string,
  name = 'cover.png',
  opts?: AppIconCoverOpts,
): Promise<File> {
  const blob = await composeAppIconCover(srcUrl, opts);
  return new File([blob], name, { type: 'image/png' });
}
