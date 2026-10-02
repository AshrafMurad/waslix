"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

import type {
  CoreMotionState,
  CoreQuality,
} from "../scenes/signal-core-canvas";

const SignalCoreCanvas = dynamic(
  () =>
    import("../scenes/signal-core-canvas").then(
      (module) => module.SignalCoreCanvas,
    ),
  { ssr: false },
);

type SceneErrorBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

type LandingExperienceProps = {
  labels: {
    health: string;
    renewal: string;
    owner: string;
    attention: string;
    healthy: string;
    risk: string;
    illustrative: string;
    healthScore: string;
    signals: string[];
    factors: Array<[string, string, "attention" | "healthy" | "risk"]>;
    evidence: [string, string];
    workflow: Array<
      [string, string, "risk" | "attention" | "brand" | "healthy"]
    >;
  };
};

function smoothstep(value: number, minimum: number, maximum: number) {
  const normalized = Math.min(
    1,
    Math.max(0, (value - minimum) / (maximum - minimum)),
  );
  return normalized * normalized * (3 - 2 * normalized);
}

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function LandingExperience({ labels }: LandingExperienceProps) {
  const shell = useRef<HTMLDivElement>(null);
  const motion = useRef<CoreMotionState>({
    progress: 0,
    pointerX: 0,
    pointerY: 0,
    reduced: false,
  });
  const [canvasMode, setCanvasMode] = useState<"pending" | CoreQuality>(
    "pending",
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasActive, setCanvasActive] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    const tablet = window.matchMedia("(max-width: 1100px)");
    const coarse = window.matchMedia("(pointer: coarse)");
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
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    motion.current.reduced = reduced.matches;
    let activeMode: "pending" | CoreQuality = "pending";
    const evaluateQuality = () => {
      const lowEnd =
        navigator.hardwareConcurrency <= 4 ||
        (deviceMemory !== undefined && deviceMemory <= 4) ||
        saveData === true;
      const constrained = narrow.matches || tablet.matches || coarse.matches;
      motion.current.reduced = reduced.matches;
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
      motion.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      motion.current.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const resetPointer = () => {
      motion.current.pointerX = 0;
      motion.current.pointerY = 0;
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
            if (!reduced.matches) motion.current.progress = self.progress;
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
  }, []);

  return (
    <div
      ref={shell}
      className="signal-core-canvas-shell"
      data-ready={canvasReady}
      data-scene="portfolio"
      style={{ "--scene-progress": 0 } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="signal-core-sticky">
        <div className="signal-core-fallback">
          <svg viewBox="0 0 620 620" role="presentation">
            <g className="core-fallback-paths">
              <path d="M95 190 310 310M145 420 310 310M478 165 310 310M520 380 310 310M310 90 310 310" />
            </g>
            <g className="core-fallback-nodes">
              <circle cx="95" cy="190" r="20" />
              <circle cx="145" cy="420" r="20" />
              <circle cx="478" cy="165" r="20" />
              <circle cx="520" cy="380" r="20" />
              <circle cx="310" cy="90" r="20" />
            </g>
            <g className="core-fallback-hub">
              <circle cx="310" cy="310" r="86" />
              <circle cx="310" cy="310" r="62" />
              <path d="M267 292 290 335 310 292 332 335 354 292" />
            </g>
            <path
              className="core-fallback-orbit"
              d="M215 291a100 74 0 0 1 184 28"
            />
          </svg>
        </div>
        <div className="system-overlays">
          <div className="portfolio-overlays">
            <article
              className="scene-account-card"
              data-customer="0"
              data-tone="attention"
            >
              <header>
                <strong>Northstar Analytics</strong>
                <span>64</span>
              </header>
              <p>
                {labels.health} · {labels.renewal} 31
              </p>
              <footer>
                <i />
                {labels.attention} <span>{labels.owner} · Maya Chen</span>
              </footer>
            </article>
            <article
              className="scene-account-card"
              data-customer="1"
              data-tone="healthy"
            >
              <header>
                <strong>NovaLedger</strong>
                <span>87</span>
              </header>
              <p>
                {labels.health} · {labels.renewal} 142
              </p>
              <footer>
                <i />
                {labels.healthy}
              </footer>
            </article>
            <article
              className="scene-account-card"
              data-customer="3"
              data-tone="risk"
            >
              <header>
                <strong>Summit Forge</strong>
                <span>48</span>
              </header>
              <p>
                {labels.health} · {labels.renewal} 45
              </p>
              <footer>
                <i />
                {labels.risk}
              </footer>
            </article>
          </div>

          <div className="signal-overlays">
            {labels.signals.map((signal, index) => (
              <span
                key={signal}
                style={{ "--signal-index": index } as React.CSSProperties}
              >
                <i />
                {signal}
              </span>
            ))}
            <article className="scene-health-panel">
              <header>
                <div>
                  <small>{labels.illustrative}</small>
                  <strong>Northstar Analytics</strong>
                </div>
                <span>{labels.attention}</span>
              </header>
              <div className="scene-health-score">
                <strong>64</strong>
                <span>
                  {labels.healthScore} <small>78 → 64</small>
                </span>
              </div>
              <div className="scene-health-factors">
                {labels.factors.map(([label, value, tone]) => (
                  <div key={label} data-tone={tone}>
                    <span>{label}</span>
                    <i>
                      <b style={{ width: `${value}%` }} />
                    </i>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <footer>
                <span>{labels.evidence[0]}</span>
                <span>{labels.evidence[1]}</span>
              </footer>
            </article>
          </div>

          <div className="workflow-overlays">
            {labels.workflow.map(([title, detail, tone], index) => (
              <article
                key={title}
                data-tone={tone}
                style={{ "--workflow-index": index } as React.CSSProperties}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
        {canvasMode !== "pending" ? (
          <SceneErrorBoundary
            onFailure={() => {
              setCanvasReady(false);
              setCanvasMode("pending");
            }}
          >
            <SignalCoreCanvas
              motion={motion}
              quality={canvasMode}
              active={canvasActive}
              onReady={() => setCanvasReady(true)}
              onFailure={() => {
                setCanvasReady(false);
                setCanvasMode("pending");
              }}
            />
          </SceneErrorBoundary>
        ) : null}
      </div>
    </div>
  );
}
