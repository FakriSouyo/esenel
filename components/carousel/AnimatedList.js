'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedListItem({ children }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

const AnimatedList = React.memo(function AnimatedList({
  children,
  className,
  delay = 1000,
  ...props
}) {
  const [index, setIndex] = useState(0);
  const childrenArray = useMemo(() => React.Children.toArray(children), [children]);

  useEffect(() => {
    if (childrenArray.length === 0) return undefined;

    const timeout = setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
    }, delay);

    return () => clearTimeout(timeout);
  }, [index, delay, childrenArray.length]);

  const itemsToShow = useMemo(() => {
    return childrenArray.slice(0, index + 1).reverse();
  }, [index, childrenArray]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`} {...props}>
      <AnimatePresence>
        {itemsToShow.map((item) => (
          <AnimatedListItem key={item.key}>{item}</AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
});

AnimatedList.displayName = 'AnimatedList';

export default AnimatedList;