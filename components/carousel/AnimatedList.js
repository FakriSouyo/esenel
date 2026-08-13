'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedList — looping vertical list.
 *
 * Each tick a new item springs in at the TOP (mount animation, same pop-in
 * style as the original), the previous items stay in place, and the oldest
 * item is unmounted by React. Keys are absolute sequence positions, so the
 * sequence cycles 1 → 2 → 3 → 1 → 2 → 3 … forever instead of resetting to a
 * single item. No AnimatePresence: the DOM always holds exactly N items, so
 * the loop can never accumulate or stall.
 *
 * `delay` is the interval between items.
 */
const AnimatedList = React.memo(function AnimatedList({
  children,
  className,
  delay = 1000,
  ...props
}) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
  const n = childrenArray.length;

  useEffect(() => {
    if (n === 0) return undefined;

    const timeout = setTimeout(() => {
      setIndex((prevIndex) => prevIndex + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [index, delay, n]);

  // The visible stack: the last min(n, index + 1) entries of the infinite
  // sequence childrenArray[index % n], newest at the top. Absolute keys mean
  // the newest item is a fresh mount (pops in), old keys unmount instantly.
  const stack = useMemo(() => {
    const out = [];
    for (let k = Math.max(0, index - n + 1); k <= index; k += 1) {
      out.unshift({ item: childrenArray[k % n], key: k });
    }
    return out;
  }, [index, n, childrenArray]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`} {...props}>
      {stack.map(({ item, key }) => (
        <motion.div
          key={key}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, originY: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 40 }}
          layout
          className="mx-auto w-full"
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
});

AnimatedList.displayName = 'AnimatedList';

export default AnimatedList;
