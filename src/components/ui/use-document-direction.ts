"use client";

import * as React from "react";

type Direction = "ltr" | "rtl";

function getDocumentDirection(): Direction {
  if (typeof document === "undefined") {
    return "ltr";
  }

  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
}

function toDirection(dir: unknown): Direction | undefined {
  return dir === "rtl" || dir === "ltr" ? dir : undefined;
}

function subscribeToDirection() {
  return () => undefined;
}

function useDocumentDirection(dir?: Direction) {
  const documentDirection = React.useSyncExternalStore(
    subscribeToDirection,
    getDocumentDirection,
    () => undefined,
  );

  return dir ?? documentDirection;
}

export { toDirection, useDocumentDirection };
