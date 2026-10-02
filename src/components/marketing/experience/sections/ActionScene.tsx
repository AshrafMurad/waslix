import type { RefObject } from "react";
import * as THREE from "three";

import { ConnectionLine } from "../connections/ConnectionLine";
import { workflowLines } from "../config/scene.constants";
import { colors } from "../config/scene.materials";
import { workflowPositions } from "../config/scene.positions";
import { WorkflowNode } from "../models/WorkflowNode";

export function ActionScene({
  groupRef,
  onNodeRef,
  onLineMaterialRef,
}: {
  groupRef: RefObject<THREE.Group | null>;
  onNodeRef: (index: number, value: THREE.Group | null) => void;
  onLineMaterialRef: (
    index: number,
    value: THREE.LineBasicMaterial | null,
  ) => void;
}) {
  return (
    <group ref={groupRef} visible={false}>
      {workflowLines.map((geometry, index) => (
        <ConnectionLine
          key={`line-${index}`}
          geometry={geometry}
          index={index}
          onMaterialRef={onLineMaterialRef}
          color={colors.brand}
          opacity={0}
        />
      ))}
      {workflowPositions.map((position, index) => (
        <WorkflowNode
          key={index}
          index={index}
          position={position}
          onNodeRef={onNodeRef}
        />
      ))}
    </group>
  );
}
