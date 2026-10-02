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
      <SignalParticle index={0} motion={motion} onParticleRef={onParticleRef} />
    </group>
  );
}
