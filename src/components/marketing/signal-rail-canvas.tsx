"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function SignalRailCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 8;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    host.appendChild(renderer.domElement);

    const count = 54;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (index / (count - 1)) * 13 - 6.5;
      positions[index * 3 + 1] = Math.sin(index * 1.7) * 2.5;
      positions[index * 3 + 2] = Math.cos(index * 0.9) * 1.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.16,
      transparent: true,
      opacity: 0.82,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    points.rotation.z = -0.08;
    scene.add(points);

    const rails = [-1.65, 0, 1.65].map((offset, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-7, offset - 0.65, -0.8 - index * 0.2),
        new THREE.Vector3(-2, offset + 0.25, -0.5 - index * 0.2),
        new THREE.Vector3(2, offset - 0.15, -0.6 - index * 0.2),
        new THREE.Vector3(7, offset + 0.65, -0.8 - index * 0.2),
      ]);
      const railGeometry = new THREE.TubeGeometry(curve, 48, 0.022, 6, false);
      const rail = new THREE.Mesh(
        railGeometry,
        new THREE.MeshBasicMaterial({
          color: index === 1 ? 0x5eead4 : 0x0f766e,
          transparent: true,
          opacity: index === 1 ? 0.72 : 0.46,
        }),
      );
      scene.add(rail);
      return rail;
    });

    let frame = 0;
    let visible = true;
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    const resizeObserver = new ResizeObserver(resize);
    observer.observe(host);
    resizeObserver.observe(host);
    resize();

    const render = (time: number) => {
      if (visible) {
        points.rotation.y = reduceMotion ? 0 : time * 0.000055;
        points.position.x = reduceMotion ? 0 : Math.sin(time * 0.00025) * 0.18;
        rails.forEach((rail, index) => {
          rail.rotation.y = reduceMotion
            ? 0
            : Math.sin(time * 0.00018 + index) * 0.035;
        });
        renderer.render(scene, camera);
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      rails.forEach((rail) => {
        rail.geometry.dispose();
        (rail.material as THREE.Material).dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="signal-rail-canvas" aria-hidden="true">
      <span>
        <i />
        <i />
        <i />
      </span>
      <span>
        <i />
        <i />
        <i />
      </span>
      <span>
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
