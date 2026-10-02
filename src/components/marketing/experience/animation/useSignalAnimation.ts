import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { sampleConnectionPoint, smooth } from "../config/scene.constants";
import { colors } from "../config/scene.materials";
import {
  customerPositions,
  signalPositions,
  systemCenter,
  workflowPositions,
} from "../config/scene.positions";
import type { CoreMotionRef, CoreQuality } from "../types";
import { updateCameraMotion } from "./useCameraMotion";

export function useSignalAnimation({
  motion,
  quality,
  hoveredCustomer,
  onReady,
}: {
  motion: CoreMotionRef;
  quality: CoreQuality;
  hoveredCustomer: number;
  onReady: () => void;
}) {
  const world = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const portfolio = useRef<THREE.Group>(null);
  const signals = useRef<THREE.Group>(null);
  const workflow = useRef<THREE.Group>(null);
  const rings = useRef<Array<THREE.Group | null>>([]);
  const portfolioMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const signalMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const signalNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const particles = useRef<Array<THREE.Mesh | null>>([]);
  const particlePosition = useRef(new THREE.Vector3());
  const sourceVector = useRef(new THREE.Vector3());
  const signalEvent = useRef({
    active: false,
    sourceIndex: 0,
    startAt: 0,
    nextAt: 1.2,
    responseUntil: 0,
    mode: "portfolio" as "portfolio" | "health",
  });
  const ready = useRef(false);

  useFrame((state, delta) => {
    if (
      !world.current ||
      !core.current ||
      !portfolio.current ||
      !signals.current ||
      !workflow.current
    ) {
      return;
    }

    const reduced = motion.current.reduced;
    const progress = reduced
      ? 0
      : THREE.MathUtils.clamp(motion.current.progress, 0, 1);
    const focus = smooth(progress, 0.25, 0.4);
    const health =
      smooth(progress, 0.36, 0.5) * (1 - smooth(progress, 0.64, 0.75));
    const action = smooth(progress, 0.66, 0.78);
    const time = reduced ? 0 : state.clock.elapsedTime;
    const damping = 1 - Math.exp(-delta * 4.2);
    const hover = hoveredCustomer;
    const event = signalEvent.current;
    const eventMode = health > 0.05 ? "health" : "portfolio";

    if (!reduced && !event.active && action < 0.48 && time >= event.nextAt) {
      const sourceCount =
        eventMode === "health"
          ? signalPositions.length
          : customerPositions.length;
      event.active = true;
      event.mode = eventMode;
      event.sourceIndex =
        eventMode === "portfolio" && hover >= 0
          ? hover
          : (event.sourceIndex + 2) % sourceCount;
      event.startAt = time;
    }

    const activeSourcePositions =
      event.mode === "health" ? signalPositions : customerPositions;
    const sourcePosition =
      activeSourcePositions[event.sourceIndex] ?? activeSourcePositions[0];
    const travelDuration = sourcePosition
      ? THREE.MathUtils.clamp(
          sourceVector.current.set(...sourcePosition).distanceTo(systemCenter) *
            0.34,
          0.72,
          1.16,
        )
      : 0.9;
    const eventProgress = event.active
      ? THREE.MathUtils.clamp((time - event.startAt) / travelDuration, 0, 1)
      : 0;

    if (event.active && eventProgress >= 1) {
      event.active = false;
      event.responseUntil = time + 0.34;
      event.nextAt = time + 2.6 + (event.sourceIndex % 3) * 0.42;
    }

    const response = reduced
      ? 0
      : Math.max(0, 1 - Math.max(0, time - event.responseUntil + 0.34) / 0.34);

    world.current.position.x +=
      (THREE.MathUtils.lerp(0.68, quality === "full" ? 0.56 : 0.72, focus) -
        world.current.position.x) *
      damping;
    world.current.rotation.y +=
      (THREE.MathUtils.lerp(-0.08, 0.08, action) - world.current.rotation.y) *
      damping;

    const portfolioOpacity = 1 - focus;
    portfolio.current.visible = portfolioOpacity > 0.01;
    portfolio.current.position.z = -focus * 1.6;
    portfolioMaterials.current.forEach((material, index) => {
      if (!material) return;
      const isEventPath =
        event.mode === "portfolio" && event.sourceIndex === index;
      const isHovered = hover === index;
      const hasFocusPath = event.active || response > 0 || hover >= 0;
      const emphasis =
        isEventPath && (event.active || response > 0)
          ? 1
          : isHovered
            ? 0.8
            : hasFocusPath
              ? 0.38
              : 0.58;
      material.color.set(
        isEventPath && (event.active || response > 0)
          ? colors.brand
          : colors.line,
      );
      material.opacity =
        portfolioOpacity * THREE.MathUtils.lerp(0.16, 0.42, emphasis);
      material.linewidth =
        isEventPath && (event.active || response > 0) ? 1.35 : 1;
    });

    core.current.position.x = THREE.MathUtils.lerp(0, 1.85, health);
    core.current.position.z = THREE.MathUtils.lerp(0, -1.15, health);
    core.current.scale.setScalar(THREE.MathUtils.lerp(1.28, 0.88, health));
    const signalPhase = health > 0.05 ? (time * 1.25) % 1 : (time * 0.32) % 1;
    const eventPulse = Math.sin(response * Math.PI) * 0.018;
    core.current.scale.multiplyScalar(1 + eventPulse);
    rings.current.forEach((ring, index) => {
      if (!ring || reduced) return;
      ring.rotation.y += delta * (0.018 + index * 0.007);
      ring.rotation.z = eventPulse * 9 * (index === 1 ? 1 : -0.45);
    });

    signals.current.visible = health > 0.01;
    signals.current.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, health));
    const activeSignal = Math.floor(time * 1.25) % signalPositions.length;
    signalMaterials.current.forEach((material, index) => {
      if (!material) return;
      const arrival = smooth(health, index * 0.08, index * 0.08 + 0.34);
      const isEventPath =
        event.mode === "health" && event.sourceIndex === index;
      const hasActivePath =
        event.mode === "health" && (event.active || response > 0);
      material.color.set(
        isEventPath && hasActivePath ? colors.brand : colors.line,
      );
      material.opacity =
        arrival *
        (isEventPath && hasActivePath
          ? 0.5
          : hasActivePath
            ? 0.12
            : index === activeSignal
              ? 0.26
              : 0.14);
      material.linewidth = isEventPath && hasActivePath ? 1.35 : 1;
    });
    signalNodes.current.forEach((node, index) => {
      if (!node) return;
      const isActive = index === activeSignal;
      node.scale.setScalar(isActive ? 1.08 : 1);
      const material = (node.children[1] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      const isEventNode =
        event.mode === "health" && event.sourceIndex === index;
      material.emissiveIntensity =
        isEventNode && (event.active || response > 0)
          ? 0.18
          : isActive
            ? 0.1
            : 0.025;
      material.opacity =
        isEventNode && (event.active || response > 0)
          ? 0.8
          : isActive
            ? 0.76
            : 0.48;
    });

    workflow.current.visible = action > 0.01;
    workflow.current.position.y = THREE.MathUtils.lerp(-0.35, 0, action);
    workflow.current.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, action));
    const workflowProgress = smooth(progress, 0.74, 0.98) * 5;
    workflowNodes.current.forEach((node, index) => {
      if (!node) return;
      const activation = THREE.MathUtils.clamp(workflowProgress - index, 0, 1);
      const activeIndex = Math.min(4, Math.floor(workflowProgress));
      const isCurrent = index === activeIndex;
      const isPrevious = index === activeIndex - 1;
      node.position.y =
        workflowPositions[index][1] + Math.sin(activation * Math.PI) * 0.09;
      node.scale.setScalar(
        isCurrent ? 1.06 : isPrevious ? 1 : index > activeIndex ? 0.94 : 0.97,
      );
      const material = (node.children[1] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isCurrent ? 0.22 : isPrevious ? 0.08 : 0.015;
      material.opacity = isCurrent
        ? 1
        : isPrevious
          ? 0.88
          : index > activeIndex
            ? 0.5
            : 0.68;
    });
    workflowMaterials.current.forEach((material, index) => {
      if (!material) return;
      const segmentActivation = THREE.MathUtils.clamp(
        workflowProgress - index,
        0,
        1,
      );
      const activeSegment = Math.min(3, Math.floor(workflowProgress));
      const isCurrent = index === activeSegment;
      material.color.set(isCurrent ? colors.brand : colors.line);
      material.opacity = action * segmentActivation * (isCurrent ? 0.48 : 0.26);
      material.linewidth = isCurrent ? 1.25 : 1;
    });

    particles.current.forEach((particle, index) => {
      if (!particle) return;
      if (reduced || index > 0 || !event.active || !sourcePosition) {
        particle.visible = false;
        return;
      }
      particle.visible = true;
      sampleConnectionPoint(
        sourcePosition,
        [0, 0, 0],
        event.sourceIndex,
        THREE.MathUtils.smoothstep(eventProgress, 0, 1),
        particlePosition.current,
      );
      particle.position.copy(particlePosition.current);
      particle.scale.setScalar(
        THREE.MathUtils.lerp(0.82, 1.08, Math.sin(eventProgress * Math.PI)),
      );
    });

    updateCameraMotion({ state, damping, focus, action, motion });

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return {
    world,
    core,
    portfolio,
    signals,
    workflow,
    rings,
    registerPortfolioMaterial: (
      index: number,
      value: THREE.LineBasicMaterial | null,
    ) => {
      portfolioMaterials.current[index] = value;
    },
    registerSignalMaterial: (
      index: number,
      value: THREE.LineBasicMaterial | null,
    ) => {
      signalMaterials.current[index] = value;
    },
    registerSignalNode: (index: number, value: THREE.Group | null) => {
      signalNodes.current[index] = value;
    },
    registerWorkflowNode: (index: number, value: THREE.Group | null) => {
      workflowNodes.current[index] = value;
    },
    registerWorkflowMaterial: (
      index: number,
      value: THREE.LineBasicMaterial | null,
    ) => {
      workflowMaterials.current[index] = value;
    },
    registerParticle: (index: number, value: THREE.Mesh | null) => {
      particles.current[index] = value;
    },
  };
}
