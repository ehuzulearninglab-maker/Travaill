"use client";

import type { FicheRecord } from "@/lib/types";

const CACHE_KEY = "ehuzu_fiches_cache";

function readCache(): Record<string, FicheRecord> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FicheRecord>) : {};
  } catch {
    return {};
  }
}

export function cacheFiches(fiches: FicheRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  const cache = readCache();
  fiches.forEach((fiche) => {
    cache[fiche.id] = fiche;
  });
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function cacheFiche(fiche: FicheRecord) {
  cacheFiches([fiche]);
}

export function getCachedFiche(id: string): FicheRecord | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return readCache()[id];
}

export function removeCachedFiche(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  const cache = readCache();
  delete cache[id];
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
