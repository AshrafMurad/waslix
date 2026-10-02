import * as THREE from "three";

import { SignalParticle } from "../connections/SignalParticle";
import type { CoreMotionRef } from "../types";

export function SceneEnvironment({
  motion,
  onParticleRef,
}: {
  motion: CoreMotionRef;
  onParticleRef: (index: number, value: THREE.Mesh | null) => void;
}) {
  return (
    <group>
      {[0, 1].map((index) => (
        <SignalParticle
          key={index}
          index={index}
          motion={motion}
          onParticleRef={onParticleRef}
        />
      ))}
    </group>
  );
}
