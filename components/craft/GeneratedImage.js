'use client';

/**
 * Permukaan "generate gambar" gaya beUI (agents/image-generation):
 * aspect-ratio stabil, overlay dither dot-field saat antre/generate/refine,
 * media blur-to-sharp saat selesai, status text + retry saat gagal.
 *
 * Status dikontrol parent:
 *   queued / generating / refining / complete / error
 */
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, CircleAlert, RotateCcw } from 'lucide-react';

const EASE_OUT = [0.16, 1, 0.3, 1];

const STATUS_TEXT = {
  queued: 'Waiting to generate',
  generating: 'Generating image',
  refining: 'Refining details',
  complete: 'Image ready',
  error: 'Generation failed',
};

const MEDIA_STATE = {
  queued: { filter: 'blur(4px) saturate(0.75)', opacity: 0, scale: 1.02 },
  generating: { filter: 'blur(3px) saturate(0.85)', opacity: 0, scale: 1.015 },
  refining: { filter: 'blur(1.5px) saturate(0.95)', opacity: 0.62, scale: 1.005 },
  complete: { filter: 'blur(0px) saturate(1)', opacity: 1, scale: 1 },
  error: { filter: 'blur(2px) saturate(0.5)', opacity: 0.28, scale: 1 },
};

const OVERLAY_OPACITY = { queued: 1, generating: 1, refining: 0.48, complete: 0, error: 0 };

function DitherField({ status, reduce }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    const dotColor = getComputedStyle(canvas).color;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 208;
      height = rect.height || 208;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.tx = pointer.x;
      pointer.ty = pointer.y;
    };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, width, height);
      pointer.tx = width / 2 + (reduce ? 0 : Math.sin(t / 1700) * width * 0.12);
      pointer.ty = height / 2 + (reduce ? 0 : Math.cos(t / 2100) * height * 0.1);
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const gap = 10;
      const radius = Math.min(width, height) * 0.38;
      ctx.fillStyle = dotColor;
      for (let row = 0; row < Math.ceil(height / gap) + 1; row++) {
        for (let col = 0; col < Math.ceil(width / gap) + 1; col++) {
          const ax = col * gap;
          const ay = row * gap;
          const dx = ax - pointer.x;
          const dy = ay - pointer.y;
          const dist = Math.hypot(dx, dy);
          const prox = Math.max(0, 1 - dist / radius);
          const infl = prox * prox * (3 - 2 * prox);
          const disp = infl * infl * 9;
          const x = ax + (dist > 0 ? (dx / dist) * disp : 0);
          const y = ay + (dist > 0 ? (dy / dist) * disp : 0);
          ctx.globalAlpha = 0.17 + infl * 0.72;
          ctx.beginPath();
          ctx.arc(x, y, 0.65 + infl * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!reduce) frame = requestAnimationFrame(draw);
    };

    resize();
    canvas.addEventListener('pointermove', onMove);
    draw(0);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    ro?.observe(canvas);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro?.disconnect();
      canvas.removeEventListener('pointermove', onMove);
    };
  }, [reduce]);

  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: OVERLAY_OPACITY[status] }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="absolute inset-0 overflow-hidden bg-sand/70"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full text-ink/70" />
    </motion.div>
  );
}

function DitherMark({ status, reduce }) {
  if (status === 'complete') return <Check aria-hidden="true" className="size-3.5" />;
  if (status === 'error') return <CircleAlert aria-hidden="true" className="size-3.5" />;
  return (
    <motion.span
      aria-hidden="true"
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
      className="grid size-3.5 grid-cols-2 place-items-center gap-0.5"
    >
      <span className="size-1 rounded-[1px] bg-current" />
      <span className="size-1 rounded-[1px] bg-current opacity-55" />
      <span className="size-1 rounded-[1px] bg-current opacity-55" />
      <span className="size-1 rounded-[1px] bg-current" />
    </motion.span>
  );
}

export default function GeneratedImage({
  status,
  src,
  prompt,
  resolution = '1024 × 1024',
  aspectRatio = '1 / 1',
  onRetry,
  onMediaLoad,
  statusText,
}) {
  const reduce = useReducedMotion() ?? false;
  const active = status === 'queued' || status === 'generating' || status === 'refining';
  const mediaState = MEDIA_STATE[status] || MEDIA_STATE.queued;
  const text = statusText || STATUS_TEXT[status] || '';

  return (
    <div data-state={status} aria-busy={active} className="w-full">
      <div className="mx-auto w-full max-w-md">
        <div
          role="img"
          aria-label={prompt ? `${text}: ${prompt}` : text}
          style={{ aspectRatio }}
          className="relative isolate w-full overflow-hidden rounded-[28px] bg-sand/60"
        >
          {src ? (
            <motion.div
              initial={false}
              animate={reduce ? { opacity: mediaState.opacity } : mediaState}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={prompt || 'Buket hasil generate'}
                onLoad={() => onMediaLoad?.()}
                className="h-full w-full object-cover"
              />
            </motion.div>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-meadow/25 via-sky/25 to-sand/40"
              style={{ opacity: mediaState.opacity, filter: mediaState.filter }}
            >
              <span className="absolute inset-0 grid place-items-center select-none font-display text-7xl text-cloud/80">
                ✿
              </span>
            </div>
          )}

          <DitherField status={status} reduce={reduce} />

          {resolution ? (
            <span className="absolute top-3 right-3 z-10 rounded-full bg-cloud/85 px-2 py-0.5 font-mono text-[10px] tracking-tight text-ink/70">
              {resolution}
            </span>
          ) : null}

          {active && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-ink/25 to-transparent px-4 pt-10 pb-4 text-[12px] font-medium tracking-nav text-cloud">
              <DitherMark status={status} reduce={reduce} />
              {text}
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-pill border border-ink/20 px-4 py-2 text-[12px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
            >
              <RotateCcw size={13} />
              COBA LAGI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
