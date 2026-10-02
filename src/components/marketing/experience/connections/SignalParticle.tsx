import * as THREE from "three";

import { particleGeometry } from "../config/scene.constants";
import {
  activeParticleMaterial,
  warningParticleMaterial,
} from "../config/scene.materials";
import type { CoreMotionRef } from "../types";

export function SignalParticle({
  index,
  motion,
  onParticleRef,
}: {
  index: number;
  motion: CoreMotionRef;
  onParticleRef: (index: number, value: THREE.Mesh | null) => void;
}) {
  return (
    <mesh
      ref={(value) => {
        onParticleRef(index, value);
      }}
      geometry={particleGeometry}
      visible={!motion.current.reduced}
    >
      <primitive
        object={index === 0 ? warningParticleMaterial : activeParticleMaterial}
        attach="material"
      />
    </mesh>
  );
}
