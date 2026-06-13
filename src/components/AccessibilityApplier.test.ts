import { describe, it, expect, beforeEach } from "vitest";
import { migrateStoredSettings } from "./AccessibilityApplier";

const STORAGE_KEY = "vdl_accessibility_settings_v1";

describe("AccessibilityApplier · migrateStoredSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes highContrast, reduceMotion and immersiveReading from stored settings", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        textSize: 2,
        dyslexicFont: true,
        highContrast: true,
        reduceMotion: true,
        immersiveReading: true,
      }),
    );

    const result = migrateStoredSettings();

    expect(result).toEqual({ textSize: 2, dyslexicFont: true });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).not.toHaveProperty("highContrast");
    expect(stored).not.toHaveProperty("reduceMotion");
    expect(stored).not.toHaveProperty("immersiveReading");
  });

  it("preserves textSize and dyslexicFont", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ textSize: 3, dyslexicFont: true, highContrast: true }),
    );

    migrateStoredSettings();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.textSize).toBe(3);
    expect(stored.dyslexicFont).toBe(true);
  });

  it("also strips legacy audio/captions/profile keys", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        textSize: 1,
        dyslexicFont: false,
        captions: true,
        captionSize: "large",
        captionBg: "black",
        autoTranscription: true,
        audioDescription: true,
        audioSpeed: 1.5,
        activeProfile: "dyslexie",
      }),
    );

    migrateStoredSettings();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(Object.keys(stored).sort()).toEqual(["dyslexicFont", "textSize"]);
  });

  it("does not rewrite storage when nothing to migrate", () => {
    const clean = JSON.stringify({ textSize: 1, dyslexicFont: false });
    localStorage.setItem(STORAGE_KEY, clean);

    migrateStoredSettings();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(clean);
  });

  it("returns empty settings when nothing is stored", () => {
    expect(migrateStoredSettings()).toEqual({});
  });
});
