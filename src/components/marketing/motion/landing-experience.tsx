"use client";

import Image from "next/image";
import { useEffect } from "react";

type LandingVisualKey = "portfolio" | "health" | "action";

type LandingVisualProps = {
  visual: LandingVisualKey;
  priority?: boolean;
};

const sectionVisuals: Record<
  LandingVisualKey,
  { dark: string; light: string; sizes: string }
> = {
  portfolio: {
    dark: "/images/hero-section-image-dark.png",
    light: "/images/hero-section-image-light.png",
    sizes: "(max-width: 760px) 100vw, 55vw",
  },
  health: {
    dark: "/images/core-section-image-dark.png",
    light: "/images/core-section-image-light.png",
    sizes: "(max-width: 760px) 100vw, 52vw",
  },
  action: {
    dark: "/images/connect-section-image-dark.png",
    light: "/images/connect-section-image-light.png",
    sizes: "(max-width: 760px) 100vw, 52vw",
  },
};

export function LandingVisual({
  visual,
  priority = false,
}: LandingVisualProps) {
  const image = sectionVisuals[visual];

  return (
    <div className="landing-visual" data-visual={visual} data-visual-plane>
      <div className="landing-visual-halo" aria-hidden="true" />
      <Image
        src={image.dark}
        alt=""
        fill
        priority={priority}
        sizes={image.sizes}
        quality={95}
        className="landing-visual-image landing-visual-image-dark"
      />
      <Image
        src={image.light}
        alt=""
        fill
        priority={priority}
        sizes={image.sizes}
        quality={95}
        className="landing-visual-image landing-visual-image-light"
      />
    </div>
  );
}

export function useLandingMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let cancelled = false;
    let cleanup = () => {};

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, triggerModule]) => {
        if (cancelled) return;

        const gsap = gsapModule.default;
        const ScrollTrigger = triggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const context = gsap.context(() => {
          gsap.utils
            .toArray<HTMLElement>("[data-story-copy]")
            .forEach((element) => {
              gsap.fromTo(
                element,
                { autoAlpha: 0.36, y: 34 },
                {
                  autoAlpha: 1,
                  y: 0,
                  ease: "power4.out",
                  scrollTrigger: {
                    trigger: element,
                    start: "top 84%",
                    end: "top 56%",
                    scrub: 0.7,
                  },
                },
              );
            });

          gsap.utils
            .toArray<HTMLElement>("[data-visual-plane]")
            .forEach((element) => {
              gsap.fromTo(
                element,
                { autoAlpha: 0.74, y: 28, scale: 0.98 },
                {
                  autoAlpha: 1,
                  y: 0,
                  scale: 1,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: element,
                    start: "top 88%",
                    end: "top 58%",
                    scrub: 0.65,
                  },
                },
              );
            });

          gsap.utils
            .toArray<HTMLElement>("[data-product-plane], [data-reveal]")
            .forEach((element) => {
              gsap.from(element, {
                autoAlpha: 0,
                y: 24,
                duration: 0.78,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 88%",
                  once: true,
                },
              });
            });
        });

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("resize", refresh, { passive: true });
        cleanup = () => {
          window.removeEventListener("resize", refresh);
          context.revert();
        };
        refresh();
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
}
