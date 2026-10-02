import * as THREE from "three";

export const colors = {
  brand: "#4fb7ac",
  brandDark: "#0f766e",
  healthy: "#77c99a",
  attention: "#d6a94a",
  risk: "#e08b8b",
  background: "#070908",
  coreSide: "#101412",
  coreTop: "#202724",
  platform: "#151a18",
  metalTrim: "#3b4440",
  inactiveNode: "#111614",
  graphite: "#141816",
  graphiteRaised: "#252c29",
  line: "#59635f",
  text: "#dce5e2",
};

export const coreTopMaterial = new THREE.MeshStandardMaterial({
  color: colors.coreTop,
  metalness: 0.34,
  roughness: 0.48,
});

export const coreSideMaterial = new THREE.MeshStandardMaterial({
  color: colors.coreSide,
  metalness: 0.24,
  roughness: 0.64,
});

export const platformMaterial = new THREE.MeshStandardMaterial({
  color: colors.platform,
  metalness: 0.28,
  roughness: 0.62,
});

export const metalTrimMaterial = new THREE.MeshStandardMaterial({
  color: colors.metalTrim,
  metalness: 0.72,
  roughness: 0.28,
});

export const customerNodeMaterial = new THREE.MeshStandardMaterial({
  color: colors.graphiteRaised,
  metalness: 0.32,
  roughness: 0.5,
});

export const selectedCustomerNodeMaterial = new THREE.MeshStandardMaterial({
  color: "#2a332f",
  metalness: 0.34,
  roughness: 0.46,
});

export const inactiveNodeMaterial = new THREE.MeshStandardMaterial({
  color: colors.inactiveNode,
  metalness: 0.22,
  roughness: 0.66,
});

export const activeAccentMaterial = new THREE.MeshStandardMaterial({
  color: colors.brand,
  emissive: colors.brandDark,
  emissiveIntensity: 0.06,
  metalness: 0.42,
  roughness: 0.36,
});

export const mutedActiveAccentMaterial = new THREE.MeshStandardMaterial({
  color: "#347f77",
  emissive: colors.brandDark,
  emissiveIntensity: 0.04,
  metalness: 0.34,
  roughness: 0.42,
});

export const activeParticleMaterial = new THREE.MeshBasicMaterial({
  color: colors.brand,
  transparent: true,
  opacity: 0.78,
});

export const warningParticleMaterial = new THREE.MeshBasicMaterial({
  color: colors.attention,
  transparent: true,
  opacity: 0.72,
});

export const riskAccentMaterial = new THREE.MeshStandardMaterial({
  color: colors.risk,
  emissive: colors.risk,
  emissiveIntensity: 0.05,
  metalness: 0.16,
  roughness: 0.52,
});

export const warningAccentMaterial = new THREE.MeshStandardMaterial({
  color: colors.attention,
  emissive: colors.attention,
  emissiveIntensity: 0.04,
  metalness: 0.16,
  roughness: 0.5,
});

export const healthyAccentMaterial = new THREE.MeshStandardMaterial({
  color: colors.healthy,
  emissive: colors.healthy,
  emissiveIntensity: 0.04,
  metalness: 0.16,
  roughness: 0.5,
});

export const accentMaterials = {
  active: activeAccentMaterial,
  risk: riskAccentMaterial,
  warning: warningAccentMaterial,
  healthy: healthyAccentMaterial,
} as const;
