import type { ReactNode } from 'react';

/**
 * The design's two text animations, rendered on the server (never by rewriting React's DOM in the browser):
 *   words   section headings whose words slide up out of a mask ([data-words]); Urdu stays one run of text
 *   letters the English hero title, letter by letter (Urdu letters must join, so never split)
 * The CSS starts them when WebFx marks the heading .in.
 */
export function textFx(ur: boolean) {
  let delay = 0.3;
  const words = (text: string): ReactNode =>
    ur
      ? text
      : text
          .trim()
          .split(/\s+/)
          .map((w, i, all) => (
            <span key={i}>
              <span className="wm">
                <span className="wi" style={{ '--w': i } as React.CSSProperties}>
                  {w}
                </span>
              </span>
              {i < all.length - 1 ? ' ' : ''}
            </span>
          ));
  const letters = (text: string): ReactNode => {
    if (ur) return text;
    // the letters are hidden from screen readers, so the words are there once more, read but not shown
    return (
      <>
        <span className="sr">{text}</span>
        <span className="line" aria-hidden>
          {text.split(' ').map((word, wi, all) => (
            <span key={wi}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                {word.split('').map((c, ci) => {
                  const at = delay;
                  delay += 0.04;
                  return (
                    <span key={ci} className="ch" style={{ animationDelay: `${at}s` }}>
                      {c}
                    </span>
                  );
                })}
              </span>
              {wi < all.length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      </>
    );
  };
  return { words, letters };
}
