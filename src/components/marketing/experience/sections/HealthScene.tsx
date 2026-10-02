import type { RefObject } from "react";
import * as THREE from "three";

import { ConnectionLine } from "../connections/ConnectionLine";
import { signalLines } from "../config/scene.constants";
import { colors } from "../config/scene.materials";
import { signalPositions } from "../config/scene.positions";
import { CustomerNode } from "../models/CustomerNode";
import { SignalNode } from "../models/SignalNode";

export function HealthScene({
  groupRef,
  onLineMaterialRef,
  onNodeRef,
}: {
  groupRef: RefObject<THREE.Group | null>;
  onLineMaterialRef: (
    index: number,
    value: THREE.LineBasicMaterial | null,
  ) => void;
  onNodeRef: (index: number, value: THREE.Group | null) => void;
}) {
  return (
    <group ref={groupRef} visible={false}>
      {signalLines.map((geometry, index) => (
        <ConnectionLine
          key={`line-${index}`}
          geometry={geometry}
          index={index}
          onMaterialRef={onLineMaterialRef}
          color={colors.brand}
          opacity={0}
        />
      ))}
      {signalPositions.map((position, index) => (
        <SignalNode
          key={index}
          index={index}
          position={position}
          onNodeRef={onNodeRef}
        />
      ))}
      <CustomerNode index={0} position={[0, 0, 0]} selected />
    </group>
  );
}
