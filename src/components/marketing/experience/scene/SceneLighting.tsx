import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { colors } from "../config/scene.materials";
import type { CoreMotionRef } from "../types";

export function SceneLighting({ motion }: { motion: CoreMotionRef }) {
  const rim = useRef<THREE.DirectionalLight>(null);

  useFrame((_, delta) => {
    if (!rim.current) return;
    rim.current.position.x = THREE.MathUtils.damp(
      rim.current.position.x,
      4.7 + motion.current.pointerX * 0.28,
      3,
      delta,
    );
    rim.current.position.y = THREE.MathUtils.damp(
      rim.current.position.y,
      3.05 - motion.current.pointerY * 0.2,
      3,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={0.07} />
      <directionalLight
        position={[-4.15, 5.35, 4.05]}
        intensity={2.22}
        color="#eef3ef"
      />
      <directionalLight
        ref={rim}
        position={[4.7, 3.05, -5.15]}
        intensity={1.12}
        color="#c4d0cb"
      />
      <pointLight
        position={[0.18, 0.32, 0.72]}
        intensity={0.18}
        color={colors.brand}
        distance={2.8}
        decay={2}
      />
    </>
  );
}
