/**
 * Links to confidential files for staff (migration 0460): never a storage URL — always the app's file route, which
 * asks api.file_access (view logged; the original file for the IT Convener only) and watermarks images.
 */
export type ConfidentialBucket = 'application-docs' | 'receipts' | 'service-docs' | 'form-snapshots';

export function staffFileUrl(bucket: ConfidentialBucket, path: string, download = false): string {
  return `/api/files/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}${download ? '?download=1' : ''}`;
}

/** many at once, keyed by path (the same shape as signedUrls) */
export function staffFileUrls(bucket: ConfidentialBucket, paths: (string | null | undefined)[]): Map<string, string> {
  return new Map(paths.filter((p): p is string => Boolean(p)).map((p) => [p, staffFileUrl(bucket, p)]));
}
