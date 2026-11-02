import Image from 'next/image';

/** the design's two-layer logo: a fixed outer ring and an inner wheel that never stops turning */
export function Logo() {
  return (
    <span className="logo" aria-hidden>
      <Image src="/images/landing/logo-ring.png" alt="" width={96} height={96} />
      <Image className="logo-wheel" src="/images/landing/logo-wheel.png" alt="" width={96} height={96} />
    </span>
  );
}
