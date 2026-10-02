import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";

import { orbitGeometries } from "../config/scene.constants";
import { colors } from "../config/scene.materials";

export function WaslixCore({
  coreRef,
  ringRefs,
}: {
  coreRef: RefObject<THREE.Group | null>;
  ringRefs: MutableRefObject<Array<THREE.Group | null>>;
}) {
  return (
    <group ref={coreRef}>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.9, 0.98, 0.1, 64]} />
        <meshStandardMaterial
          color={colors.graphite}
          metalness={0.84}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, -0.108, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 0.022, 64]} />
        <meshStandardMaterial
          color="#4a5450"
          metalness={0.82}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.68, 0.78, 64]} />
        <meshStandardMaterial
          color="#090c0b"
          metalness={0.72}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, -0.074, 0]}>
        <cylinderGeometry args={[0.68, 0.74, 0.072, 56]} />
        <meshStandardMaterial
          color={colors.graphiteRaised}
          metalness={0.9}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[0, -0.026, 0]}>
        <cylinderGeometry args={[0.53, 0.6, 0.078, 48]} />
        <meshStandardMaterial
          color="#090c0b"
          metalness={0.72}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.018, 48]} />
        <meshStandardMaterial
          color="#313936"
          metalness={0.58}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.385, 48]} />
        <meshStandardMaterial
          color={colors.brand}
          emissive={colors.brandDark}
          emissiveIntensity={0.24}
          metalness={0.7}
          roughness={0.32}
        />
      </mesh>
      <group position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-0.14, 0, 0.14].map((x, index) => (
          <mesh
            key={x}
            position={[x, 0, index === 1 ? 0 : 0.015]}
            rotation={[0, 0, index === 0 ? -0.38 : index === 2 ? 0.38 : 0]}
          >
            <boxGeometry args={[0.112, 0.3, 0.014]} />
            <meshStandardMaterial
              color={index === 1 ? colors.brand : "#347f77"}
              emissive={colors.brandDark}
              emissiveIntensity={0.18}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
      {orbitGeometries.map((geometry, index) => (
        <group
          key={index}
          ref={(value) => {
            ringRefs.current[index] = value;
          }}
          rotation={[index === 1 ? 0.22 : -0.12, index * 0.8, 0]}
        >
          <lineSegments
            geometry={geometry}
            position={[0, 0.018 + index * 0.026, 0]}
            scale={[0.82 - index * 0.06, 1, 0.82 - index * 0.06]}
          >
            <lineBasicMaterial
              color={index === 1 ? colors.brand : colors.line}
              transparent
              opacity={index === 1 ? 0.62 : 0.4}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
