/**
 * Dice So Nice utilities for Conan: The Hyborian Age
 *
 * Provides helpers for rendering 3D dice with per-player colorset awareness,
 * ensuring the flex die is always visually distinct from the attribute dice.
 *
 * Two custom colorsets are registered in conan.mjs:
 *   conan_flex_dark  — very dark brownish-black body + gold pips
 *   conan_flex_light — warm cream body + dark crimson pips
 *
 * getFlexDieColorset() reads the player's DSN background colour, computes its
 * relative luminance (perceived brightness) and picks whichever of the two
 * colorsets provides the strongest contrast.  If the player happens to sit
 * right in the mid-range where neither variant is clearly better, it still
 * picks one deterministically so every roll looks consistent.
 */

/* ------------------------------------------------------------------ */
/*  Colour helpers (hex ↔ luminance)                                  */
/* ------------------------------------------------------------------ */

/**
 * Parse a CSS hex colour (#RGB or #RRGGBB) into [r, g, b] 0-255.
 * Returns null on failure.
 */
function _hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return null;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  if (isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Compute the relative luminance of an sRGB colour (0 … 1).
 * Uses the WCAG 2.x formula:  L = 0.2126·R + 0.7152·G + 0.0722·B
 * where each channel is first linearised from gamma-encoded sRGB.
 */
function _luminance(r, g, b) {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two luminances (≥ 1).
 */
function _contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ------------------------------------------------------------------ */
/*  Known luminance values for our two custom colorsets                */
/* ------------------------------------------------------------------ */
const DARK_BG  = _luminance(..._hexToRgb("#1a0800"));   //  ≈ 0.005
const LIGHT_BG = _luminance(..._hexToRgb("#f5f0e0"));   //  ≈ 0.87

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns the name of the DSN colorset to embed in the flex-die roll
 * formula (e.g. `1d10[conan_flex_dark]`).
 *
 * Logic:
 *  1. Read the player's DSN background colour.
 *  2. Compute contrast ratios against both custom colorsets.
 *  3. Pick the one with the higher contrast ratio.
 *  4. Require a minimum contrast ratio of 1.8; if neither meets it
 *     (extremely unlikely) fall back to the built-in "bronze".
 *
 * @returns {string} DSN colorset name for the flex die.
 */
export function getFlexDieColorset() {
  if (!game.modules.get("dice-so-nice")?.active) return "conan_flex_dark";

  // --- Read the player's DSN background colour ---
  let userBg = null;
  try {
    const settings = game.user.getFlag("dice-so-nice", "settings");
    userBg =
      settings?.appearance?.global?.labelColor ??   // DSN v5+ (label/background)
      settings?.appearance?.global?.colorset ??     // colorset name (fallback)
      settings?.colorset ??                          // DSN v4
      null;
  } catch (_e) { /* ignore */ }

  // If we got a colorset *name* instead of a hex colour we try to resolve
  // its background via the DSN export registry.
  let userBgHex = null;
  if (userBg && userBg.startsWith("#")) {
    userBgHex = userBg;
  } else if (userBg && game.dice3d) {
    // Attempt to read the colorset definition from DSN
    try {
      const exportData = game.dice3d.exports?.colorsets?.[userBg];
      if (exportData?.background) userBgHex = exportData.background;
    } catch (_e) { /* ignore */ }
  }

  // If we still don't have a hex colour, try reading it directly from
  // the DSN appearance object which stores the resolved values.
  if (!userBgHex) {
    try {
      const settings = game.user.getFlag("dice-so-nice", "settings");
      const bg = settings?.appearance?.global?.background;
      if (bg && typeof bg === "string" && bg.startsWith("#")) userBgHex = bg;
    } catch (_e) { /* ignore */ }
  }

  // Fallback: assume a "typical" white/cream die → pick the dark variant
  if (!userBgHex) return "conan_flex_dark";

  const rgb = _hexToRgb(userBgHex);
  if (!rgb) return "conan_flex_dark";

  const userLum = _luminance(...rgb);

  // Contrast ratios vs our two variants
  const crDark  = _contrastRatio(userLum, DARK_BG);
  const crLight = _contrastRatio(userLum, LIGHT_BG);

  // Pick the one that contrasts more with the player's dice.
  // Minimum threshold 1.8 — below that neither is distinguishable enough
  // so fall back to "bronze" (a built-in DSN colorset).
  if (crDark >= crLight) {
    return crDark >= 1.8 ? "conan_flex_dark" : "bronze";
  } else {
    return crLight >= 1.8 ? "conan_flex_light" : "bronze";
  }
}
