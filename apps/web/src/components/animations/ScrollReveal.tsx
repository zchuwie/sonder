"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const variants = {
  left: { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
};

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: keyof typeof variants;
  duration?: number;
  delay?: number;
  once?: boolean;
  className?: string;
  id?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  duration = 0.6,
  delay = 0,
  once = true,
  className,
  id,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ref, inView] = useInView({ triggerOnce: once, threshold: 0.1 });

  if (shouldReduceMotion) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      variants={variants[direction]}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
