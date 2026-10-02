import { lineGeometry } from "../config/scene.constants";
import { colors } from "../config/scene.materials";
import type { CoreQuality } from "../types";

export function Platform({ quality }: { quality: CoreQuality }) {
  if (quality === "minimal") return null;
  return (
    <group position={[0, -0.38, 0]}>
      {[-3, -2, -1, 0, 1, 2, 3].map((value) => (
        <lineSegments
          key={`x-${value}`}
          geometry={lineGeometry([value, 0, -2.4], [value, 0, 2.4])}
        >
          <lineBasicMaterial
            color={colors.line}
            transparent
            opacity={0.032 * (1 - Math.abs(value) / 4)}
          />
        </lineSegments>
      ))}
      {[-2, -1, 0, 1, 2].map((value) => (
        <lineSegments
          key={`z-${value}`}
          geometry={lineGeometry([-3.6, 0, value], [3.6, 0, value])}
        >
          <lineBasicMaterial
            color={colors.line}
            transparent
            opacity={0.032 * (1 - Math.abs(value) / 3)}
          />
        </lineSegments>
      ))}
    </group>
  );
}
