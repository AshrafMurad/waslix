import { useEffect } from "react";

import type { CoreMotionState, CoreQuality } from "../types";

function smoothstep(value: number, minimum: number, maximum: number) {
  const normalized = Math.min(
    1,
    Math.max(0, (value - minimum) / (maximum - minimum)),
  );
  return normalized * normalized * (3 - 2 * normalized);
}

function hasWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function useSceneTimeline({
  shell,
  setMotionState,
  setCanvasReady,
  setCanvasMode,
  setCanvasActive,
}: {
  shell: React.RefObject<HTMLDivElement | null>;
  setMotionState: (state: Partial<CoreMotionState>) => void;
  setCanvasReady: (ready: boolean) => void;
  setCanvasMode: (mode: "pending" | CoreQuality) => void;
  setCanvasActive: (active: boolean) => void;
}) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    const tablet = window.matchMedia("(max-width: 1100px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const hasWebGL = hasWebGLSupport();
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    setMotionState({ reduced: reduced.matches });
    let activeMode: "pending" | CoreQuality = "pending";
    const evaluateQuality = () => {
      const lowEnd =
        navigator.hardwareConcurrency <= 4 ||
        (deviceMemory !== undefined && deviceMemory <= 4) ||
        saveData === true;
      const constrained = narrow.matches || tablet.matches || coarse.matches;
      setMotionState({ reduced: reduced.matches });
      const nextMode =
        !reduced.matches && hasWebGL
          ? lowEnd
            ? "minimal"
            : constrained || reduced.matches
              ? "lite"
              : "full"
          : "pending";
      if (nextMode === activeMode) return;
      activeMode = nextMode;
      setCanvasReady(false);
      setCanvasMode(nextMode);
    };
    const capabilityFrame = requestAnimationFrame(evaluateQuality);
    reduced.addEventListener("change", evaluateQuality);
    narrow.addEventListener("change", evaluateQuality);
    tablet.addEventListener("change", evaluateQuality);
    coarse.addEventListener("change", evaluateQuality);

    let cancelled = false;
    let cleanup = () => {};
    const updatePointer = (event: PointerEvent) => {
      if (reduced.matches || narrow.matches || coarse.matches) return;
      setMotionState({
        pointerX: (event.clientX / window.innerWidth - 0.5) * 2,
        pointerY: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    const resetPointer = () => {
      setMotionState({ pointerX: 0, pointerY: 0 });
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetPointer);
    if (reduced.matches) {
      return () => {
        cancelAnimationFrame(capabilityFrame);
        reduced.removeEventListener("change", evaluateQuality);
        narrow.removeEventListener("change", evaluateQuality);
        tablet.removeEventListener("change", evaluateQuality);
        coarse.removeEventListener("change", evaluateQuality);
        window.removeEventListener("pointermove", updatePointer);
        document.documentElement.removeEventListener(
          "pointerleave",
          resetPointer,
        );
      };
    }
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

      const lenis = reduced.matches
        ? null
        : new Lenis({
            duration: 1.05,
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 0.9,
          });
      const tick = (time: number) => lenis?.raf(time * 1000);
      lenis?.on("scroll", ScrollTrigger.update);
      if (lenis) {
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      const context = gsap.context(() => {
        const workflowCards = shell.current?.querySelectorAll<HTMLElement>(
          ".workflow-overlays article",
        );
        const healthScore = shell.current?.querySelector<HTMLElement>(
          ".scene-health-score > strong",
        );
        ScrollTrigger.create({
          trigger: "[data-core-story]",
          start: "top top",
          end: "bottom top",
          onUpdate: (self) => {
            if (!reduced.matches) setMotionState({ progress: self.progress });
            shell.current?.style.setProperty(
              "--scene-progress",
              String(self.progress),
            );
            if (shell.current) {
              shell.current.dataset.scene =
                self.progress < 0.32
                  ? "portfolio"
                  : self.progress < 0.7
                    ? "health"
                    : "workflow";
            }
            const activeWorkflowStep =
              self.progress < 0.7
                ? 0
                : Math.max(
                    1,
                    Math.min(5, Math.floor((self.progress - 0.73) / 0.05) + 1),
                  );
            workflowCards?.forEach((card, index) => {
              card.dataset.state =
                index === activeWorkflowStep - 1
                  ? "current"
                  : index === activeWorkflowStep - 2
                    ? "previous"
                    : index < activeWorkflowStep - 2
                      ? "completed"
                      : "future";
            });
            if (healthScore) {
              const scoreProgress = smoothstep(self.progress, 0.43, 0.58);
              healthScore.textContent = String(
                Math.round(78 + (64 - 78) * scoreProgress),
              );
            }
            const retirement = smoothstep(self.progress, 0.88, 0.99);
            if (shell.current)
              shell.current.style.opacity = String(1 - retirement);
          },
          onEnter: () => setCanvasActive(true),
          onEnterBack: () => setCanvasActive(true),
          onLeave: () => setCanvasActive(false),
        });

        if (!reduced.matches) {
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
        if (lenis) gsap.ticker.remove(tick);
        lenis?.destroy();
      };
      requestAnimationFrame(refresh);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(capabilityFrame);
      reduced.removeEventListener("change", evaluateQuality);
      narrow.removeEventListener("change", evaluateQuality);
      tablet.removeEventListener("change", evaluateQuality);
      coarse.removeEventListener("change", evaluateQuality);
      window.removeEventListener("pointermove", updatePointer);
      document.documentElement.removeEventListener(
        "pointerleave",
        resetPointer,
      );
      cleanup();
    };
  }, [setCanvasActive, setCanvasMode, setCanvasReady, setMotionState, shell]);
}
