"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { ExperienceScene } from "./scene/ExperienceScene";
import { sceneCamera } from "./scene/SceneCamera";
import { SceneLighting } from "./scene/SceneLighting";
import type { CoreMotionRef, CoreQuality } from "./types";

type WaslixExperienceProps = {
  motion: CoreMotionRef;
  quality: CoreQuality;
  active: boolean;
  onReady: () => void;
  onFailure: () => void;
};

export function WaslixExperience({
  motion,
  quality,
  active,
  onReady,
  onFailure,
}: WaslixExperienceProps) {
  const minimal = quality === "minimal";
  return (
    <Canvas
      className="signal-core-webgl"
      camera={sceneCamera}
      dpr={quality === "full" ? [1, 1.5] : 1}
      frameloop={
        motion.current.reduced ? "demand" : active ? "always" : "never"
      }
      gl={{
        alpha: true,
        antialias: !minimal,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.86;
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
      }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
    >
      <SceneLighting motion={motion} />
      <ExperienceScene motion={motion} quality={quality} onReady={onReady} />
    </Canvas>
  );
}
