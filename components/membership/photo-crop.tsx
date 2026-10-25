'use client';

import { Check, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/shared/modal';

/**
 * Passport photo crop to the form's 35 × 45 mm box (prototype M.cropper, docs/08): drag to move, zoom and brightness
 * sliders, dark photos brightened automatically, the face centred where the browser offers FaceDetector. The result is
 * a 350 × 450 JPEG; the server re-encodes it (lib/membership/images.ts).
 */
const OW = 350;
const OH = 450;

type Check = { ok: 'tick' | 'x' | 'spark'; text: string };

export interface CropText {
  title: string;
  intro: string;
  zoom: string;
  brightness: string;
  retake: string;
  save: string;
  close: string;
  resolutionOk: string;
  resolutionLow: string;
  brightFixed: string;
  brightOk: string;
  face: string;
  working: string;
}

export function PhotoCrop({
  file,
  text,
  busy,
  onCancel,
  onRetake,
  onSave,
}: {
  file: File | null;
  text: CropText;
  busy: boolean;
  onCancel: () => void;
  onRetake: () => void;
  onSave: (jpeg: Blob) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({ img: null as HTMLImageElement | null, x: 0, y: 0, z: 1, base: 1, b: 100 });
  const drag = useRef<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(100);
  const [bright, setBright] = useState(100);
  const [checks, setChecks] = useState<Check[]>([]);

  const draw = () => {
    const c = canvas.current;
    const s = st.current;
    if (!c || !s.img) return;
    const x = c.getContext('2d')!;
    x.fillStyle = '#fff';
    x.fillRect(0, 0, OW, OH);
    x.filter = `brightness(${s.b}%) contrast(${s.b > 100 ? 104 : 100}%)`;
    const k = s.base * s.z;
    x.drawImage(s.img, s.x, s.y, s.img.width * k, s.img.height * k);
    x.filter = 'none';
  };

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = st.current;
      s.img = img;
      s.base = Math.max(OW / img.width, OH / img.height);
      s.z = 1;
      s.x = (OW - img.width * s.base) / 2;
      s.y = Math.min(0, (OH - img.height * s.base) * 0.3);
      const t = document.createElement('canvas');
      t.width = 40;
      t.height = 40;
      const tc = t.getContext('2d')!;
      tc.drawImage(img, 0, 0, 40, 40);
      const px = tc.getImageData(0, 0, 40, 40).data;
      let lum = 0;
      for (let i = 0; i < px.length; i += 4) lum += 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
      lum /= 1600;
      s.b = lum < 95 ? 122 : lum < 120 ? 110 : 100;
      setBright(s.b);
      setZoom(100);
      const list: Check[] = [
        img.width >= 300 && img.height >= 380
          ? { ok: 'tick', text: text.resolutionOk.replace('{size}', `${img.width}×${img.height}`) }
          : { ok: 'x', text: text.resolutionLow },
        s.b > 100 ? { ok: 'spark', text: text.brightFixed } : { ok: 'tick', text: text.brightOk },
      ];
      const finish = () => {
        setChecks(list);
        draw();
      };
      const FD = (
        window as unknown as {
          FaceDetector?: new (o: object) => {
            detect: (i: HTMLImageElement) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
          };
        }
      ).FaceDetector;
      if (FD) {
        new FD({ fastMode: true })
          .detect(img)
          .then((faces) => {
            const f = faces[0];
            if (f) {
              const b = f.boundingBox;
              const cx = (b.x + b.width / 2) * s.base;
              const cy = (b.y + b.height / 2) * s.base;
              s.z = Math.min(2.4, Math.max(1, (OH * 0.42) / (b.height * s.base)));
              s.x = OW / 2 - cx * s.z;
              s.y = OH * 0.42 - cy * s.z;
              setZoom(Math.round(s.z * 100));
              list.push({ ok: 'tick', text: text.face });
            }
            finish();
          })
          .catch(finish);
      } else finish();
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new file restarts the crop; text is stable
  }, [file]);

  const onZoom = (v: number) => {
    const s = st.current;
    const nz = v / 100;
    const cx = OW / 2;
    const cy = OH / 2;
    s.x = cx - ((cx - s.x) * nz) / s.z;
    s.y = cy - ((cy - s.y) * nz) / s.z;
    s.z = nz;
    setZoom(v);
    draw();
  };

  const save = () => {
    canvas.current?.toBlob((b) => b && onSave(b), 'image/jpeg', 0.9);
  };

  return (
    <Modal
      open={Boolean(file)}
      onOpenChange={(o) => !o && onCancel()}
      title={text.title}
      closeLabel={text.close}
      footer={
        <>
          <button type="button" className="btn" onClick={onRetake} data-action="photo.retake" disabled={busy}>
            {text.retake}
          </button>
          <button type="button" className="btn btn-primary" onClick={save} data-action="photo.save" disabled={busy}>
            <Check size={16} aria-hidden /> {busy ? text.working : text.save}
          </button>
        </>
      }
    >
      <div className="proto">
        <p className="muted" style={{ marginBottom: 10 }}>
          {text.intro}
        </p>
        <div className="crop">
          <canvas
            ref={canvas}
            width={OW}
            height={OH}
            aria-label={text.title}
            onPointerDown={(e) => {
              drag.current = [e.clientX, e.clientY, st.current.x, st.current.y];
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const k = OW / e.currentTarget.getBoundingClientRect().width;
              st.current.x = drag.current[2] + (e.clientX - drag.current[0]) * k;
              st.current.y = drag.current[3] + (e.clientY - drag.current[1]) * k;
              draw();
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            style={{ touchAction: 'none' }}
          />
          <div className="crop-g" />
        </div>
        <label className="crop-z">
          {text.zoom}{' '}
          <input type="range" min={100} max={300} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} />
        </label>
        <label className="crop-z">
          {text.brightness}{' '}
          <input
            type="range"
            min={70}
            max={140}
            value={bright}
            onChange={(e) => {
              st.current.b = Number(e.target.value);
              setBright(st.current.b);
              draw();
            }}
          />
        </label>
        <div className="crop-chk" role="status">
          {checks.map((c, i) => (
            <span key={i}>
              {c.ok === 'x' ? (
                <X size={16} color="#ef4444" aria-hidden />
              ) : c.ok === 'spark' ? (
                <Sparkles size={16} color="#1fa34a" aria-hidden />
              ) : (
                <Check size={16} color="#1fa34a" aria-hidden />
              )}{' '}
              {c.text}
            </span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
