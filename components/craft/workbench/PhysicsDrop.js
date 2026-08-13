'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Image as KonvaImage } from 'react-konva';
import { useHtmlImage } from '@/hooks/useHtmlImage';
import { getCraftAsset } from '@/lib/craftAssets';

const MIN_FALL_MS = 500;
const MAX_FALL_MS = 1300;
const SETTLE_SPEED = 0.45;

/**
 * Matter.js world used ONLY for the brief moment a flower falls into the
 * vase. Gravity, the vase walls/floor, AND the already-settled flowers
 * (as static bodies) collide with the falling body, so flowers pile up
 * naturally instead of all landing in one layer. As soon as a body
 * settles (or times out) it is removed and the caller receives its final
 * x / y / rotation to hand off to a plain Konva node.
 */
export function PhysicsDrop({ dropQueue, boundary, settled, onDropConsumed, onSettle }) {
  const engineRef = useRef(null);
  const wallsRef = useRef([]); // static vase floor + walls
  const settledBodiesRef = useRef(new Map()); // static bodies for settled flowers
  const bodiesRef = useRef(new Map()); // falling dynamic bodies
  const nodesRef = useRef(new Map());
  const rafRef = useRef(null);
  const watchRef = useRef(null); // setTimeout watchdog (rAF stall fallback)
  const loopRef = useRef(false); // is the physics loop scheduled?
  const lastFrameRef = useRef(0);
  const [activeIds, setActiveIds] = useState([]);

  // Create the engine once for the lifetime of the canvas.
  useEffect(() => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1.15;
    engineRef.current = engine;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    };
  }, []);

  // Rebuild the vase walls whenever the canvas resizes.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || boundary.radius <= 0) return;

    if (wallsRef.current.length) Matter.World.remove(engine.world, wallsRef.current);

    const floorY = boundary.cy + boundary.radius * 0.42;
    const floor = Matter.Bodies.rectangle(boundary.cx, floorY, boundary.radius * 2.4, 26, {
      isStatic: true,
      friction: 0.7,
    });
    const wallHeight = boundary.radius * 1.9;
    const leftWall = Matter.Bodies.rectangle(boundary.cx - boundary.radius * 0.82, boundary.cy, 26, wallHeight, {
      isStatic: true,
      angle: 0.14,
      friction: 0.5,
    });
    const rightWall = Matter.Bodies.rectangle(boundary.cx + boundary.radius * 0.82, boundary.cy, 26, wallHeight, {
      isStatic: true,
      angle: -0.14,
      friction: 0.5,
    });

    wallsRef.current = [floor, leftWall, rightWall];
    Matter.World.add(engine.world, wallsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary.cx, boundary.cy, boundary.radius]);

  // Keep a static collision body for every settled flower, so new drops
  // pile up on top of the ones already in the vase.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Remove bodies whose flower moved, resized, or vanished.
    settledBodiesRef.current.forEach((entry, id) => {
      const s = settled.find((x) => x.id === id);
      const moved =
        !s ||
        Math.hypot(s.x - entry.body.position.x, s.y - entry.body.position.y) > 3 ||
        Math.abs(s.radius - entry.radius) > 2;
      if (moved) {
        Matter.World.remove(engine.world, entry.body);
        settledBodiesRef.current.delete(id);
      }
    });

    // Add bodies for new flowers.
    settled.forEach((s) => {
      if (settledBodiesRef.current.has(s.id)) return;
      const body = Matter.Bodies.circle(s.x, s.y, s.radius, { isStatic: true, friction: 0.8 });
      Matter.World.add(engine.world, body);
      settledBodiesRef.current.set(s.id, { body, radius: s.radius });
    });
  }, [settled]);

  // Watch for newly requested drops and give each one a physics body.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    dropQueue.forEach((req) => {
      if (bodiesRef.current.has(req.reqId)) return;
      const asset = getCraftAsset(req.assetId);
      if (!asset) return;
      const spread = boundary.radius * 0.4;
      const startX = boundary.cx + (Math.random() - 0.5) * spread;
      const startY = boundary.cy - boundary.radius - 70;

      const body = Matter.Bodies.circle(startX, startY, asset.radius, {
        restitution: 0.32,
        friction: 0.6,
        frictionAir: 0.015,
        density: 0.0022,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.16);
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.6, y: 0 });

      Matter.World.add(engine.world, body);
      bodiesRef.current.set(req.reqId, { body, assetId: req.assetId, startTime: performance.now() });
      setActiveIds((ids) => [...ids, req.reqId]);
      onDropConsumed(req.reqId);
      ensureLoopRunning();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropQueue, boundary.cx, boundary.cy, boundary.radius]);

  function ensureLoopRunning() {
    // One loop at a time; the watchdog keeps it alive even if rAF stalls
    // (background tab / throttled environment), so a drop always settles.
    if (loopRef.current) return;
    loopRef.current = true;

    const step = (now) => {
      lastFrameRef.current = now;
      const engine = engineRef.current;
      if (!engine) return;

      Matter.Engine.update(engine, 1000 / 60);
      const t = performance.now();
      const settledIds = [];

      bodiesRef.current.forEach((entry, reqId) => {
        const node = nodesRef.current.get(reqId);
        if (node) {
          node.position({ x: entry.body.position.x, y: entry.body.position.y });
          node.rotation((entry.body.angle * 180) / Math.PI);
        }
        const speed = Matter.Vector.magnitude(entry.body.velocity);
        const elapsed = t - entry.startTime;
        if ((elapsed > MIN_FALL_MS && speed < SETTLE_SPEED) || elapsed > MAX_FALL_MS) {
          settledIds.push(reqId);
        }
      });

      nodesRef.current.forEach((node) => node.getLayer()?.batchDraw());

      if (settledIds.length) {
        settledIds.forEach((reqId) => {
          const entry = bodiesRef.current.get(reqId);
          if (!entry) return;
          Matter.World.remove(engine.world, entry.body);
          bodiesRef.current.delete(reqId);
          nodesRef.current.delete(reqId);
          onSettle(reqId, entry.assetId, {
            x: entry.body.position.x,
            y: entry.body.position.y,
            rotation: (entry.body.angle * 180) / Math.PI,
          });
        });
        setActiveIds((ids) => ids.filter((id) => !settledIds.includes(id)));
      }

      if (bodiesRef.current.size > 0) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        loopRef.current = false;
        if (watchRef.current) {
          clearTimeout(watchRef.current);
          watchRef.current = null;
        }
      }
    };

    // Watchdog: if requestAnimationFrame is throttled to a crawl, drive the
    // physics manually with setTimeout so the flower still settles.
    const watch = () => {
      const stalled = performance.now() - lastFrameRef.current > 500;
      if (stalled && bodiesRef.current.size > 0) {
        step(performance.now());
      }
      if (bodiesRef.current.size > 0 && loopRef.current) {
        watchRef.current = setTimeout(watch, 400);
      } else {
        watchRef.current = null;
      }
    };

    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    watchRef.current = setTimeout(watch, 400);
  }

  return (
    <>
      {activeIds.map((id) => {
        const entry = bodiesRef.current.get(id);
        if (!entry) return null;
        const asset = getCraftAsset(entry.assetId);
        if (!asset) return null;
        return (
          <FallingFlower
            key={id}
            src={asset.src}
            size={asset.radius * 2}
            registerNode={(node) => {
              if (node) nodesRef.current.set(id, node);
            }}
          />
        );
      })}
    </>
  );
}

function FallingFlower({ src, size, registerNode }) {
  const image = useHtmlImage(src);
  if (!image) return null;
  return (
    <KonvaImage
      ref={registerNode}
      image={image}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
      listening={false}
      shadowColor="#23301F"
      shadowOpacity={0.18}
      shadowBlur={8}
      shadowOffsetY={6}
    />
  );
}
