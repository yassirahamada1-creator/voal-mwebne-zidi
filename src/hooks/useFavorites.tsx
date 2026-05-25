import { useEffect, useState, useCallback } from "react";

export type FavoriteItem = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "pdf";
  titleFr: string;
  titleShi: string;
  source?: "category" | "gallery" | "media" | "pedagogical";
  moduleSlug?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  addedAt: number;
};

const STORAGE_KEY = "vdl_favorites";
const EVENT = "vdl-favorites-changed";

function read(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    typeof window !== "undefined" ? read() : [],
  );

  useEffect(() => {
    const refresh = () => setFavorites(read());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) refresh();
    });
    return () => window.removeEventListener(EVENT, refresh);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">) => {
    const current = read();
    const exists = current.find((f) => f.id === item.id);
    if (exists) {
      write(current.filter((f) => f.id !== item.id));
      return false;
    }
    write([{ ...item, addedAt: Date.now() }, ...current]);
    return true;
  }, []);

  const removeFavorite = useCallback((id: string) => {
    write(read().filter((f) => f.id !== id));
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
