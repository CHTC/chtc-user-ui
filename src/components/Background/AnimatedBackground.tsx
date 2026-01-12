"use client";

import React, { useEffect, useRef, useState } from "react";

function generateSwirls(count: number) {
  return Array.from({ length: count }, () => {
    const size = 200 + Math.random() * 300; // Size between 200 and 500
    // Allow initial positions to extend to edges
    const edge = size / 20; // percent offset for edge
    const top = Math.random() * (100 + edge * 2) - edge;
    const left = Math.random() * (100 + edge * 2) - edge;
    return { size, initial: { top, left } };
  });
}

function getRandomPosition(size: number) {
  // Allow positions to extend to edges
  const edge = size / 20;
  const top = Math.random() * (100 + edge * 2) - edge;
  const left = Math.random() * (100 + edge * 2) - edge;
  return { top, left };
}

const AnimatedBackground: React.FC = () => {
  const [swirls, setSwirls] = useState<ReturnType<typeof generateSwirls> | null>(null);
  const swirlRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generate swirls only on the client to avoid hydration issues
  useEffect(() => {
    setSwirls(generateSwirls(9));
  }, []);

  // Ensure refs array always matches the number of swirls
  useEffect(() => {
    if (!swirls) return;
    swirlRefs.current = swirlRefs.current.slice(0, swirls.length);
  }, [swirls]);

  useEffect(() => {
    if (!swirls) return;
    let mounted = true;
    function animateSwirl(index: number) {
      if (!mounted) return;
      if (swirls) {
        const swirl = swirls[index];
        const node = swirlRefs.current[index];
        if (!node) return;
        const pos = getRandomPosition(swirl.size);
        node.animate(
          [
            {},
            {
              top: `${pos.top}%`,
              left: `${pos.left}%`,
            },
          ],
          {
            duration: 10000 + Math.random() * 1500,
            fill: "forwards",
            easing: "ease-in-out",
          }
        ).onfinish = () => {
          if (mounted) {
            node.style.top = `${pos.top}%`;
            node.style.left = `${pos.left}%`;
            animateSwirl(index);
          }
        };
      }
    }
    swirls.forEach((_, i) => animateSwirl(i));
    return () => {
      mounted = false;
    };
  }, [swirls]);

  if (!swirls) return null; // Or a fallback

  return (
    <div className="animated-bg">
      {swirls.map((swirl, i) => (
        <div
          key={i}
          ref={el => {
            swirlRefs.current[i] = el;
            // Clean up removed refs
            if (el === null) {
              swirlRefs.current = swirlRefs.current.slice(0, swirls.length);
            }
          }}
          style={{
            position: "absolute",
            width: swirl.size,
            height: swirl.size,
            borderRadius: "50%",
            background: "#B61F24",
            filter: "blur(16px)",
            opacity: 0.5,
            mixBlendMode: "lighten",
            top: `${swirl.initial.top}%`,
            left: `${swirl.initial.left}%`,
            transition: "top 0.5s, left 0.5s",
          }}
        />
      ))}
      <style jsx>{`
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
          background: #000;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
