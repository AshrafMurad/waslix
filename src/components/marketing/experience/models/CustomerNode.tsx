import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { moduleGeometry, platformGeometry } from "../config/scene.constants";
import { colors } from "../config/scene.materials";

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
    colors.attention,
    colors.healthy,
    colors.healthy,
    colors.risk,
    colors.attention,
    colors.healthy,
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
        <meshStandardMaterial
          color={selected ? "#202725" : colors.graphite}
          metalness={0.74}
          roughness={0.5}
        />
      </mesh>
      <mesh geometry={moduleGeometry}>
        <meshStandardMaterial
          color={selected ? "#26312e" : colors.graphiteRaised}
          metalness={0.68}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, 0.148, 0]}>
        <boxGeometry args={[0.36, 0.018, 0.36]} />
        <meshStandardMaterial
          color="#46504c"
          metalness={0.54}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, -0.135, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 8, 28]} />
        <meshStandardMaterial
          color="#4a5450"
          metalness={0.72}
          roughness={0.44}
        />
      </mesh>
      <mesh position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 18]} />
        <meshStandardMaterial
          color={tone}
          emissive={tone}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}
