import * as THREE from "three";

import { colors } from "../config/scene.materials";

export function ConnectionLine({
  geometry,
  index,
  onMaterialRef,
  color = colors.brand,
  opacity = 0,
}: {
  geometry: THREE.BufferGeometry;
  index: number;
  onMaterialRef: (index: number, value: THREE.LineBasicMaterial | null) => void;
  color?: string;
  opacity?: number;
}) {
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        ref={(value) => {
          onMaterialRef(index, value);
        }}
        color={color}
        transparent
        opacity={opacity}
      />
    </lineSegments>
  );
}
