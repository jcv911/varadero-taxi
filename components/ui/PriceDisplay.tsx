"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatUsd } from "@/lib/routes";
import { cn } from "@/lib/cn";

export function PriceDisplay({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const displayRef = useRef(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(displayRef.current, value, {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        displayRef.current = v;
        setDisplay(v);
      },
      onComplete: () => {
        displayRef.current = value;
        setDisplay(value);
      },
    });
    return () => {
      controls.stop();
      displayRef.current = value;
      setDisplay(value);
    };
  }, [value, reduce]);

  return (
    <span className={cn("tabular-nums", className)}>
      {formatUsd(Math.round(display))}
    </span>
  );
}