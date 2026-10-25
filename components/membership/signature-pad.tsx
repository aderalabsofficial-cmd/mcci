'use client';

import { Check, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/shared/modal';

/**
 * Signature pad (prototype M.signPad, actions wiz.sign / sign.clear / sign.save): finger or mouse on a 560 × 200
 * canvas, transparent background, navy ink. "Upload image instead" hands over to the photo upload.
 */
export interface PadText {
  title: string;
  intro: string;
  clear: string;
  upload: string;
  use: string;
  empty: string;
  close: string;
  working: string;
}

export function SignaturePad({
  open,
  text,
  busy,
  onClose,
  onUpload,
  onSave,
}: {
  open: boolean;
  text: PadText;
  busy: boolean;
  onClose: () => void;
  onUpload: () => void;
  onSave: (png: Blob) => void;
}) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<[number, number] | null>(null);
  const [drawn, setDrawn] = useState(false);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (open) {
      setDrawn(false);
      setWarn(false);
    }
  }, [open]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) * 560) / r.width, ((e.clientY - r.top) * 200) / r.height];
  };
  const clear = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, 560, 200);
    setDrawn(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={text.title}
      closeLabel={text.close}
      wide
      footer={
        <>
          <button type="button" className="btn" onClick={clear} data-action="sign.clear" disabled={busy}>
            <RefreshCw size={16} aria-hidden /> {text.clear}
          </button>
          <button type="button" className="btn" onClick={onUpload} data-action="wiz.sign.upload" disabled={busy}>
            {text.upload}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-action="sign.save"
            disabled={busy}
            onClick={() => {
              if (!drawn) return setWarn(true);
              canvas.current?.toBlob((b) => b && onSave(b), 'image/png');
            }}
          >
            <Check size={16} aria-hidden /> {busy ? text.working : text.use}
          </button>
        </>
      }
    >
      <div className="proto">
        <p className="muted" style={{ marginBottom: 10 }}>
          {text.intro}
        </p>
        <canvas
          ref={(el) => {
            canvas.current = el;
            if (el) {
              const x = el.getContext('2d')!;
              x.lineWidth = 2.6;
              x.lineCap = 'round';
              x.lineJoin = 'round';
              x.strokeStyle = '#0b2a5b';
            }
          }}
          className="sigpad"
          width={560}
          height={200}
          aria-label={text.title}
          style={{ touchAction: 'none', width: '100%' }}
          onPointerDown={(e) => {
            last.current = point(e);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!last.current) return;
            const p = point(e);
            const x = e.currentTarget.getContext('2d')!;
            x.beginPath();
            x.moveTo(...last.current);
            x.lineTo(...p);
            x.stroke();
            last.current = p;
            if (!drawn) setDrawn(true);
          }}
          onPointerUp={() => {
            last.current = null;
          }}
        />
        {warn && !drawn && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 700, marginTop: 8 }}>
            {text.empty}
          </p>
        )}
      </div>
    </Modal>
  );
}
