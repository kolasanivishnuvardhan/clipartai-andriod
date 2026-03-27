import type { ClipArtStyle } from "../types";

export const CLIPART_STYLES: ClipArtStyle[] = [
  {
    id: "cartoon",
    label: "Cartoon",
    emoji: "🎨",
    description: "Bold lines, vibrant colors",
    prompt:
      "cartoon style clipart, thick black outlines, bold saturated colors, flat cel shading, Disney/Pixar inspired, clean vector look, white background, no shadows",
    negativePrompt: "photorealistic, 3d render, dark, gritty, watermark",
    strength: 0.75,
  },
  {
    id: "flat",
    label: "Flat Art",
    emoji: "🟣",
    description: "Clean, minimal, modern",
    prompt:
      "flat illustration style, minimal design, geometric shapes, limited color palette, modern app icon style, no gradients, white background, svg-like clarity",
    negativePrompt: "photorealistic, complex textures, shadows, dark",
    strength: 0.80,
  },
  {
    id: "anime",
    label: "Anime",
    emoji: "⛩️",
    description: "Japanese animation style",
    prompt:
      "anime style illustration, clean line art, cel shaded, vibrant colors, Studio Ghibli inspired, expressive eyes, white background, manga aesthetic",
    negativePrompt: "photorealistic, western cartoon, dark, gritty",
    strength: 0.70,
  },
  {
    id: "pixel",
    label: "Pixel Art",
    emoji: "👾",
    description: "Retro 8-bit game style",
    prompt:
      "pixel art style, 16-bit retro game character, limited color palette, chunky pixels, NES/SNES era aesthetic, transparent/white background, clean pixelated edges",
    negativePrompt: "photorealistic, blurry, anti-aliased, modern",
    strength: 0.85,
  },
  {
    id: "sketch",
    label: "Sketch",
    emoji: "✏️",
    description: "Hand-drawn pencil art",
    prompt:
      "pencil sketch illustration, hand-drawn style, crosshatching, monochrome, fine line art, sketchbook quality, white paper background, professional illustration",
    negativePrompt: "color, photorealistic, digital art, dark background",
    strength: 0.72,
  },
];

export const STYLE_IDS = CLIPART_STYLES.map((style) => style.id);
