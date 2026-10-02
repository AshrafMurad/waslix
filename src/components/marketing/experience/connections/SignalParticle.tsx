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
      visible={false}
    >
      <primitive
        object={index === 0 ? activeParticleMaterial : warningParticleMaterial}
        attach="material"
      />
    </mesh>
  );
}
