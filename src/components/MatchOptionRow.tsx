"use client";

import { type ReactNode, useEffect, useState } from "react";

type MatchOptionRowProps = {
  fading: boolean;
  wrong: boolean;
  children: ReactNode;
};

export function MatchOptionRow({ fading, wrong, children }: MatchOptionRowProps) {
  const [fadeActive, setFadeActive] = useState(false);

  useEffect(() => {
    if (!fading) {
      setFadeActive(false);
      return;
    }

    setFadeActive(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFadeActive(true));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [fading]);

  return (
    <li
      className={[
        "match-row",
        fadeActive && "match-row--fade-out",
        wrong && "match-row--shake",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </li>
  );
}
