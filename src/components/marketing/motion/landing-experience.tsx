"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useSceneTimeline } from "../experience/animation/useSceneTimeline";
import { CustomerOverlay } from "../experience/overlays/CustomerOverlay";
import { HealthOverlay } from "../experience/overlays/HealthOverlay";
import { WorkflowOverlay } from "../experience/overlays/WorkflowOverlay";
import type {
  CoreMotionState,
  CoreQuality,
  LandingExperienceLabels,
} from "../experience/types";

const WaslixExperience = dynamic(
  () =>
    import("../experience/WaslixExperience").then(
      (module) => module.WaslixExperience,
    ),
  { ssr: false },
);

type SceneErrorBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

type LandingExperienceProps = {
  labels: LandingExperienceLabels;
};

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
  const setMotionState = useCallback((state: Partial<CoreMotionState>) => {
    Object.assign(motion.current, state);
  }, []);

  useSceneTimeline({
    shell,
    setMotionState,
    setCanvasReady,
    setCanvasMode,
    setCanvasActive,
  });

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
          <CustomerOverlay labels={labels} />
          <HealthOverlay labels={labels} />
          <WorkflowOverlay labels={labels} />
        </div>
        {canvasMode !== "pending" ? (
          <SceneErrorBoundary
            onFailure={() => {
              setCanvasReady(false);
              setCanvasMode("pending");
            }}
          >
            <WaslixExperience
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
