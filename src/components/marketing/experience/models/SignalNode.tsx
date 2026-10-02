import * as THREE from "three";

import {
  signalGeometry,
  smallPlatformGeometry,
} from "../config/scene.constants";
import { colors } from "../config/scene.materials";

export function SignalNode({
  index,
  position,
  onNodeRef,
}: {
  index: number;
  position: [number, number, number];
  onNodeRef: (index: number, value: THREE.Group | null) => void;
}) {
  return (
    <group
      ref={(value) => {
        onNodeRef(index, value);
      }}
      position={position}
    >
      <mesh geometry={smallPlatformGeometry} position={[0, -0.12, 0]}>
        <meshStandardMaterial
          color={colors.graphite}
          metalness={0.66}
          roughness={0.5}
        />
      </mesh>
      <mesh geometry={signalGeometry}>
        <meshStandardMaterial
          color={index === 1 ? colors.risk : colors.graphiteRaised}
          emissive={index === 1 ? colors.risk : colors.brandDark}
          emissiveIntensity={0.12}
          metalness={0.55}
          roughness={0.42}
          transparent
        />
      </mesh>
    </group>
  );
}
