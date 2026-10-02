import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { moduleGeometry, platformGeometry } from "../config/scene.constants";
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
  const tone = [
    accentMaterials.warning,
    accentMaterials.healthy,
    accentMaterials.healthy,
    accentMaterials.risk,
    accentMaterials.warning,
    accentMaterials.healthy,
  ][index];

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
      <mesh geometry={platformGeometry} position={[0, -0.18, 0]}>
        <primitive object={platformMaterial} attach="material" />
      </mesh>
      <mesh geometry={moduleGeometry}>
        <primitive
          object={
            selected ? selectedCustomerNodeMaterial : customerNodeMaterial
          }
          attach="material"
        />
      </mesh>
      <mesh position={[0, 0.148, 0]}>
        <boxGeometry args={[0.36, 0.018, 0.36]} />
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.135, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 8, 28]} />
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 18]} />
        <primitive object={tone} attach="material" />
      </mesh>
    </group>
  );
}
