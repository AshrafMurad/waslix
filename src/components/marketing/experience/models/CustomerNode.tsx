import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import {
  customerBaseLowerGeometry,
  customerBaseUpperGeometry,
  customerBodyGeometry,
  customerTopPlateGeometry,
} from "../config/scene.constants";
import {
  accentMaterials,
  customerNodeMaterial,
  metalTrimMaterial,
  platformMaterial,
  selectedCustomerNodeMaterial,
} from "../config/scene.materials";

export function CustomerNode({
  index,
  position,
  selected = false,
  hovered = false,
  onHover,
}: {
  index: number;
  position: [number, number, number];
  selected?: boolean;
  hovered?: boolean;
  onHover?: (index: number) => void;
}) {
  const node = useRef<THREE.Group>(null);
  const statusMaterials = [
    accentMaterials.warning,
    accentMaterials.healthy,
    metalTrimMaterial,
    accentMaterials.healthy,
    accentMaterials.risk,
    accentMaterials.healthy,
  ] as const;
  const tone = statusMaterials[index % statusMaterials.length];

  useFrame((state, delta) => {
    if (!node.current) return;
    const scale = THREE.MathUtils.damp(
      node.current.scale.x,
      hovered ? 0.96 : 0.9,
      7,
      delta,
    );
    node.current.scale.setScalar(scale);
    node.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.28 + index) * 0.01;
  });

  return (
    <group
      ref={node}
      position={position}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover?.(index);
        (event.nativeEvent.target as HTMLElement)
          .closest(".signal-core-canvas-shell")
          ?.setAttribute("data-hover", String(index));
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={(event) => {
        onHover?.(-1);
        (event.nativeEvent.target as HTMLElement)
          .closest(".signal-core-canvas-shell")
          ?.removeAttribute("data-hover");
        document.body.style.cursor = "";
      }}
    >
      <mesh geometry={customerBaseLowerGeometry} position={[0, -0.17, 0]}>
        <primitive object={platformMaterial} attach="material" />
      </mesh>
      <mesh geometry={customerBaseUpperGeometry} position={[0, -0.122, 0]}>
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh
        geometry={customerBodyGeometry}
        position={[0, -0.04, 0]}
        scale={[1.08, 1, 0.82]}
      >
        <primitive
          object={
            selected ? selectedCustomerNodeMaterial : customerNodeMaterial
          }
          attach="material"
        />
      </mesh>
      <mesh
        geometry={customerTopPlateGeometry}
        position={[0, 0.049, 0]}
        scale={[1.12, 1, 0.78]}
      >
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh
        position={[0, 0.066, 0.012]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.1, 0.72, 1]}
      >
        <ringGeometry args={[0.15, 0.18, 24]} />
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh position={[0.13, 0.069, 0.035]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.032, 14]} />
        <primitive object={tone} attach="material" />
      </mesh>
    </group>
  );
}
