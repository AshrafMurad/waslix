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
      -4 + motion.current.pointerX * 0.35,
      3,
      delta,
    );
    rim.current.position.y = THREE.MathUtils.damp(
      rim.current.position.y,
      2.5 - motion.current.pointerY * 0.2,
      3,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={0.14} />
      <directionalLight
        position={[3.5, 6.5, 4.5]}
        intensity={2.65}
        color="#e4ebe8"
      />
      <directionalLight
        ref={rim}
        position={[-4, 2.5, -4]}
        intensity={1.05}
        color="#9eb8b2"
      />
      <pointLight
        position={[1.5, 1, 2]}
        intensity={0.18}
        color={colors.brand}
        distance={8}
      />
    </>
  );
}
