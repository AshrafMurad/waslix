import * as THREE from "three";

import { particleGeometry } from "../config/scene.constants";
import { colors } from "../config/scene.materials";
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
      <meshBasicMaterial
        color={index === 0 ? colors.attention : colors.brand}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
