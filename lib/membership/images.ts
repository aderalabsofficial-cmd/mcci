import 'server-only';
import sharp from 'sharp';

/**
 * Server-side image work for the application (docs/08 "Passport photo", "Signature & stamp"). Every image is decoded
 * and re-encoded here, so whatever the browser sent (metadata, odd encodings) never reaches storage as is.
 */

/** 35 × 45 mm passport photo: exactly 350 × 450 px JPEG (quality 0.9); the client sends the crop it chose */
export async function passportPhoto(input: Uint8Array): Promise<Buffer> {
  return sharp(input, { failOn: 'error' })
    .rotate() // honour the camera's orientation, then drop EXIF
    .resize(350, 450, { fit: 'cover', position: 'attention' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/**
 * Signature or stamp photographed on paper → transparent PNG: near-white paper becomes transparent, the ink keeps its
 * colour, the edges are trimmed and the result is at most 900 px wide (it is printed small on the form).
 */
export async function cleanInk(input: Uint8Array, threshold = 200): Promise<Buffer> {
  const base = sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true });
  const { data, info } = await base.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const light = (r + g + b) / 3;
    if (light >= threshold) data[i + 3] = 0;
    else data[i + 3] = Math.min(255, Math.round(((threshold - light) / threshold) * 255 * 1.6));
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
  try {
    return await sharp(png)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return png; // nothing to trim (blank image)
  }
}

/** the drawn signature from the pad is already transparent: trim it and cap its size */
export async function trimDrawn(input: Uint8Array): Promise<Buffer> {
  const png = await sharp(input, { failOn: 'error' })
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  try {
    return await sharp(png)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } catch {
    return png;
  }
}
