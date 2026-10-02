import type { RefObject } from "react";
import * as THREE from "three";

import { ConnectionLine } from "../connections/ConnectionLine";
import { portfolioLines } from "../config/scene.constants";
import { customerPositions } from "../config/scene.positions";
import { CustomerNode } from "../models/CustomerNode";

export function PortfolioScene({
  groupRef,
  onLineMaterialRef,
  hoveredCustomer,
  onHover,
}: {
  groupRef: RefObject<THREE.Group | null>;
  onLineMaterialRef: (
    index: number,
    value: THREE.LineBasicMaterial | null,
  ) => void;
  hoveredCustomer: number;
  onHover: (index: number) => void;
}) {
  return (
    <group ref={groupRef}>
      {portfolioLines.map((geometry, index) => (
        <ConnectionLine
          key={index}
          geometry={geometry}
          index={index}
          onMaterialRef={onLineMaterialRef}
          opacity={0.16}
        />
      ))}
      {customerPositions.map((position, index) => (
        <CustomerNode
          key={index}
          index={index}
          position={position}
          selected={index === 0}
          hovered={hoveredCustomer === index}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
