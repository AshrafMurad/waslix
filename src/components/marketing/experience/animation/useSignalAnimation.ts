import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { smooth } from "../config/scene.constants";
import {
  customerVectors,
  signalPositions,
  signalVectors,
  systemCenter,
  workflowPositions,
  workflowVectors,
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
  const signalMaterials = useRef<Array<THREE.Material | null>>([]);
  const signalNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const particles = useRef<Array<THREE.Mesh | null>>([]);
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
      const emphasis = hover < 0 ? 1 : hover === index ? 2.6 : 0.3;
      material.opacity = portfolioOpacity * 0.24 * emphasis;
    });

    core.current.position.x = THREE.MathUtils.lerp(0, 1.85, health);
    core.current.position.z = THREE.MathUtils.lerp(0, -1.15, health);
    core.current.scale.setScalar(THREE.MathUtils.lerp(1.28, 0.88, health));
    const signalPhase = health > 0.05 ? (time * 1.25) % 1 : (time * 0.32) % 1;
    const eventPulse =
      reduced || signalPhase < 0.84
        ? 0
        : Math.sin(((signalPhase - 0.84) / 0.16) * Math.PI) * 0.02;
    core.current.scale.multiplyScalar(1 + eventPulse);
    rings.current.forEach((ring, index) => {
      if (!ring || reduced) return;
      ring.rotation.y += delta * (0.018 + index * 0.007);
      ring.rotation.z = eventPulse * 12 * (index === 1 ? 1 : -0.5);
    });

    signals.current.visible = health > 0.01;
    signals.current.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, health));
    const activeSignal = Math.floor(time * 1.25) % signalPositions.length;
    signalMaterials.current.forEach((material, index) => {
      if (!material) return;
      const arrival = smooth(health, index * 0.08, index * 0.08 + 0.34);
      material.opacity = arrival * (index === activeSignal ? 0.5 : 0.14);
    });
    signalNodes.current.forEach((node, index) => {
      if (!node) return;
      const isActive = index === activeSignal;
      node.scale.setScalar(isActive ? 1.08 : 1);
      const material = (node.children[1] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isActive ? 0.24 : 0.035;
      material.opacity = isActive ? 1 : 0.66;
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
      material.opacity =
        action * THREE.MathUtils.clamp(workflowProgress - index, 0, 1) * 0.55;
    });

    particles.current.forEach((particle, index) => {
      if (!particle) return;
      if (reduced) {
        particle.visible = false;
        return;
      }
      particle.visible = true;
      if (action > 0.5) {
        if (index === 1) {
          particle.visible = false;
          return;
        }
        const segment = Math.min(
          3,
          Math.floor((time * 0.42 + index * 0.44) % 4),
        );
        const local = (time * 0.42 + index * 0.44) % 1;
        particle.position.lerpVectors(
          workflowVectors[segment],
          workflowVectors[segment + 1],
          local,
        );
      } else if (health > 0.05) {
        if (index === 1) {
          particle.visible = false;
          return;
        }
        const sourceIndex = Math.floor(time * 1.25) % signalPositions.length;
        const local = (time * 1.25) % 1;
        particle.position.lerpVectors(
          signalVectors[sourceIndex],
          systemCenter,
          local,
        );
      } else {
        const sourceIndex = index === 0 ? 0 : 3;
        const local = (time * 0.32 + index * 0.5) % 1;
        particle.position.lerpVectors(
          customerVectors[sourceIndex],
          systemCenter,
          local,
        );
      }
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
