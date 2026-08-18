"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { firePreloaderExit } from "@/lib/preloaderBus";

// True when the app is rendering a 404. The not-found page tags <body> with
// this class in a layout effect (which runs before any passive effect), so by
// the time this effect runs the preloader can bail out cleanly.
const isNotFoundPage = () =>
  typeof document !== "undefined" &&
  document.body.classList.contains("route-notfound");

// Preloader hanya main SEKALI per sesi tab: flag ini di-set saat greeting
// selesai, jadi kembali ke home dari halaman lain tidak memutar preloader
// lagi (langsung ke hero).
const PRELOADER_DONE_KEY = "esenel.preloaderDone.v1";

/**
 * ESENEL preloader — a Skiper8-style "word preloader" (Hello in 9 languages,
 * dead center) rendered as the FIRST SECTION of the document.
 *
 * When the words finish, the page is not "removed" — it hand-scrolls down
 * by one screen with a manual-scroll easing (Lenis scrollTo), so the
 * preloader slides away exactly like scrolling between two sections and the
 * hero comes into view naturally.
 *
 * Timeline:
 *   0 ms      — preloader section fills the viewport, "Hello" centered
 *   800 ms    — words start cycling (a new greeting every ~180ms)
 *   2240 ms   — page hand-scrolls down (1.3s easeInOutCubic); the wavy
 *               bottom edge of the section is the last thing to leave
 *   3540 ms   — section unmounts from the document (viewport stays put)
 */
const WORDS = [
  "Hello", // English
  "bonjour", // French
  "Ciao", // Italian
  "Olà", // Portuguese
  "Hola", // Spanish
  "やあ", // Japanese
  "Hallå", // Swedish
  "Guten tag", // German
  "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ", // Punjabi
];

const FIRST_MS = 800; // how long the first greeting lingers
const STEP_MS = 180; // then each greeting swaps this fast (Skiper8 cadence)
const HOLD_MS = FIRST_MS + (WORDS.length - 1) * STEP_MS; // 2240 — all 9 shown
const SCROLL_MS = 1300; // hand-scroll duration to the next section

// Ease-in-out cubic — the pace of a deliberate manual scroll.
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function Preloader() {
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [leaving, setLeaving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [notFound, setNotFound] = useState(false);
  const exitFiredRef = useRef(false);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  // When the preloader unmounts, the document loses its 100svh first
  // section. Snap the scroll back to the top in the SAME layout pass (before
  // paint) so the hero is already in place when the frame renders — without
  // this, the unmount paints one frame where the page has collapsed and the
  // hero has jumped down, which Chrome records as a large layout shift
  // (CLS ~0.67 in Lighthouse).
  useLayoutEffect(() => {
    if (!removed || notFound) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [removed, notFound]);

  useEffect(() => {
    // 404 — no preloader at all. The not-found page tags <body> with
    // `route-notfound` in a layout effect, so the class is already present
    // when this passive effect runs. Let anything waiting on the exit signal
    // (the navbar) proceed so it doesn't stay hidden after leaving the page.
    if (isNotFoundPage()) {
      setNotFound(true);
      if (!exitFiredRef.current) {
        exitFiredRef.current = true;
        firePreloaderExit();
      }
      return;
    }

    // Sudah pernah main di sesi ini (kembali ke home) — lewati total, tapi
    // tetap beri sinyal exit supaya navbar tidak diam terkunci.
    if (typeof window !== "undefined" && window.sessionStorage?.getItem(PRELOADER_DONE_KEY)) {
      setRemoved(true);
      if (!exitFiredRef.current) {
        exitFiredRef.current = true;
        firePreloaderExit();
      }
      return;
    }

    // NOTE: no once-per-load guard here on purpose. In dev, React StrictMode
    // mounts, cleans up, and mounts again — the cleanup clears the timers
    // below, so the second run must re-arm them or the preloader freezes on
    // the first word forever. The effect is idempotent, so re-running is safe.

    setSize({ w: window.innerWidth, h: window.innerHeight });

    // Word cycling: "Hello" lingers, then each language swaps in fast.
    let idx = 0;
    let cycleTimer;
    const advance = () => {
      setPrev(idx);
      idx = (idx + 1) % WORDS.length;
      setActive(idx);
      cycleTimer = setTimeout(advance, STEP_MS);
    };
    const first = setTimeout(advance, FIRST_MS);

    // Lock the page while the preloader holds.
    document.body.style.overflow = "hidden";
    lenisRef.current?.stop();

    const lift = setTimeout(() => {
      clearTimeout(cycleTimer);
      setLeaving(true);
      if (!exitFiredRef.current) {
        exitFiredRef.current = true;
        firePreloaderExit();
      }

      // Unlock, then hand-scroll down by one screen — the preloader slides
      // away like scrolling from one section to the next.
      document.body.style.overflow = "";
      lenisRef.current?.start();
      const target = sectionRef.current?.offsetHeight ?? window.innerHeight;

      let done = false;
      let watchdog;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(watchdog);
        // Preloader sudah tampil penuh — jangan main lagi saat kembali ke
        // home dalam sesi tab yang sama.
        try {
          window.sessionStorage?.setItem(PRELOADER_DONE_KEY, "1");
        } catch {
          // private mode / storage penuh — abaikan, preloader tetap jalan
        }
        // The section leaves the document, so the hero becomes the first
        // section. The scroll-back-to-top happens synchronously in a layout
        // effect (see above) — BEFORE the unmount frame paints — so the hero
        // is in place with no intermediate collapsed frame (no CLS).
        setRemoved(true);
      };

      if (lenisRef.current) {
        const started = performance.now();
        let lastY = window.scrollY;
        // Watchdog: if the smooth scroll stalls (throttled tab / low-power
        // device), snap to the target so the preloader never sticks.
        watchdog = setInterval(() => {
          const y = window.scrollY;
          const moved = Math.abs(y - lastY) > 2;
          lastY = y;
          if (y >= target - 4) finish();
          else if (performance.now() - started > SCROLL_MS + 600 && !moved) {
            window.scrollTo({ top: target, behavior: "auto" });
            finish();
          }
        }, 200);

        lenisRef.current.scrollTo(target, {
          duration: SCROLL_MS / 1000,
          easing: easeInOutCubic,
          force: true,
          onComplete: finish,
        });
      } else {
        // No lenis (unlikely) — native smooth scroll as a fallback.
        window.scrollTo({ top: target, behavior: "smooth" });
        setTimeout(finish, SCROLL_MS);
      }
    }, HOLD_MS);

    return () => {
      clearTimeout(first);
      clearTimeout(cycleTimer);
      clearTimeout(lift);
      document.body.style.overflow = "";
      lenisRef.current?.start();
    };
  }, [notFound]);

  if (removed || notFound) return null;

  // Wavy bottom edge — the section's silhouette as it scrolls away, so the
  // reveal into the hero has the same soft curve as the previous curtain.
  const wave = `M0 0 L${size.w} 0 L${size.w} ${size.h} Q${size.w / 2} ${size.h + 120} 0 ${size.h} Z`;

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="preloader-root relative h-[100svh] w-full bg-[#23301F]"
    >
      {size.h > 0 && (
        <svg
          className="absolute left-0 top-0 w-full"
          style={{ height: size.h + 120 }}
          aria-hidden="true"
        >
          <path d={wave} fill="#23301F" />
        </svg>
      )}

      <div className="absolute inset-0">
        {/* "Hello" in 9 languages — dead center, each rising smoothly into
            place as the previous one lifts away above it. */}
        <div className="relative flex h-full w-full items-center justify-center">
          {WORDS.map((word, i) => (
            <span
              key={word}
              className="absolute max-w-[88vw] px-4 text-center font-display text-4xl tracking-tight text-cloud sm:text-6xl"
              style={{
                opacity: i === active ? 1 : 0,
                transform:
                  i === active
                    ? "translateY(0)"
                    : i === prev
                      ? "translateY(-22px)"
                      : "translateY(22px)",
                filter: i === active ? "blur(0px)" : "blur(5px)",
                transition:
                  "opacity 180ms ease-out, transform 180ms ease-out, filter 180ms ease-out",
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Thin progress line — fills while the words play, no text */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-cloud/70"
          style={{
            transform: `scaleX(${leaving ? 1 : 0})`,
            transition: `transform ${HOLD_MS - 400}ms cubic-bezier(0.76, 0, 0.24, 1)`,
          }}
        />
      </div>
    </section>
  );
}
