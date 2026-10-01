"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { SceneMotionState } from "../scenes/customer-network-canvas";

const CustomerNetworkCanvas = dynamic(
  () =>
    import("../scenes/customer-network-canvas").then(
      (module) => module.CustomerNetworkCanvas,
    ),
  { ssr: false },
);

export function LandingExperience() {
  const motion = useRef<SceneMotionState>({
    progress: 0,
    pointerX: 0,
    pointerY: 0,
  });
  const [canvasMode, setCanvasMode] = useState<"pending" | "full" | "lite">(
    "pending",
  );

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(
          canvas.getContext("webgl2") || canvas.getContext("webgl"),
        );
      } catch {
        return false;
      }
    })();

    const capabilityFrame = requestAnimationFrame(() => {
      setCanvasMode(
        !reduced && hasWebGL ? (narrow || coarse ? "lite" : "full") : "pending",
      );
    });

    let cancelled = false;
    let cleanup = () => {};
    const updatePointer = (event: PointerEvent) => {
      motion.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      motion.current.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("lenis"),
    ]).then(([gsapModule, triggerModule, lenisModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      const Lenis = lenisModule.default;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = reduced
        ? null
        : new Lenis({
            duration: 1.05,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 0.9,
          });
      const tick = (time: number) => lenis?.raf(time * 1000);
      lenis?.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const context = gsap.context(() => {
        ScrollTrigger.create({
          trigger: "[data-network-story]",
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            motion.current.progress = self.progress;
            document.documentElement.style.setProperty(
              "--network-progress",
              self.progress.toFixed(4),
            );
          },
        });

        if (!reduced) {
          gsap.utils
            .toArray<HTMLElement>("[data-story-copy]")
            .forEach((element) => {
              gsap.fromTo(
                element,
                { autoAlpha: 0.18, y: 54 },
                {
                  autoAlpha: 1,
                  y: 0,
                  ease: "power4.out",
                  scrollTrigger: {
                    trigger: element,
                    start: "top 78%",
                    end: "top 48%",
                    scrub: 0.7,
                  },
                },
              );
            });

          gsap.utils
            .toArray<HTMLElement>("[data-product-plane]")
            .forEach((element) => {
              gsap.fromTo(
                element,
                { autoAlpha: 0.28, y: 72, rotateX: -8, scale: 0.96 },
                {
                  autoAlpha: 1,
                  y: 0,
                  rotateX: 0,
                  scale: 1,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: element,
                    start: "top 88%",
                    end: "top 55%",
                    scrub: 0.8,
                  },
                },
              );
            });

          gsap.utils
            .toArray<HTMLElement>("[data-reveal]")
            .forEach((element) => {
              gsap.from(element, {
                autoAlpha: 0,
                y: 28,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 88%",
                  once: true,
                },
              });
            });
        }
      });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("resize", refresh, { passive: true });
      cleanup = () => {
        window.removeEventListener("resize", refresh);
        context.revert();
        gsap.ticker.remove(tick);
        lenis?.destroy();
      };
      requestAnimationFrame(refresh);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(capabilityFrame);
      window.removeEventListener("pointermove", updatePointer);
      cleanup();
    };
  }, []);

  return (
    <div className="network-canvas-shell" aria-hidden="true">
      <div className="network-static-fallback">
        {Array.from({ length: 14 }, (_, index) => (
          <i key={index} style={{ "--node": index } as React.CSSProperties} />
        ))}
      </div>
      {canvasMode !== "pending" ? (
        <CustomerNetworkCanvas motion={motion} lite={canvasMode === "lite"} />
      ) : null}
    </div>
  );
}
