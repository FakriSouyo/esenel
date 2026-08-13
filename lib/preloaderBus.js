"use client";

/**
 * Tiny in-memory bus that lets the preloader tell the rest of the page
 * (the hero, mainly) that the curtain is starting to lift. The hero rises
 * with the curtain, so both need to move in sync.
 *
 * If a listener subscribes after the exit already fired, it is invoked
 * immediately — so the hero never ends up stuck below the viewport.
 */
let exited = false;
const listeners = new Set();

export function onPreloaderExit(fn) {
  if (exited) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function firePreloaderExit() {
  exited = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}
