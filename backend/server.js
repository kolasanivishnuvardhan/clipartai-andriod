require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const Replicate = require("replicate");

const app = express();

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PORT = Number(process.env.PORT || 3000);
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*";

const STYLES = {
  cartoon: {
    prompt:
      "cartoon style clipart, thick black outlines, bold saturated colors, flat cel shading, Disney/Pixar inspired, clean vector look, white background, no shadows",
    negativePrompt: "photorealistic, 3d render, dark, gritty, watermark",
    strength: 0.75,
  },
  flat: {
    prompt:
      "flat illustration style, minimal design, geometric shapes, limited color palette, modern app icon style, no gradients, white background, svg-like clarity",
    negativePrompt: "photorealistic, complex textures, shadows, dark",
    strength: 0.8,
  },
  anime: {
    prompt:
      "anime style illustration, clean line art, cel shaded, vibrant colors, Studio Ghibli inspired, expressive eyes, white background, manga aesthetic",
    negativePrompt: "photorealistic, western cartoon, dark, gritty",
    strength: 0.7,
  },
  pixel: {
    prompt:
      "pixel art style, 16-bit retro game character, limited color palette, chunky pixels, NES/SNES era aesthetic, transparent/white background, clean pixelated edges",
    negativePrompt: "photorealistic, blurry, anti-aliased, modern",
    strength: 0.85,
  },
  sketch: {
    prompt:
      "pencil sketch illustration, hand-drawn style, crosshatching, monochrome, fine line art, sketchbook quality, white paper background, professional illustration",
    negativePrompt: "color, photorealistic, digital art, dark background",
    strength: 0.72,
  },
};

const ALLOWED_STYLE_IDS = new Set(Object.keys(STYLES));
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    code: "RATE_LIMIT_ERROR",
    message: "Too many requests. Wait a moment.",
  },
});

const corsOptions = {
  origin(origin, callback) {
    if (ALLOWED_ORIGINS === "*") {
      callback(null, true);
      return;
    }

    const allowList = ALLOWED_ORIGINS.split(",").map((item) => item.trim());

    if (!origin || allowList.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS not allowed"));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "12mb" }));

const replicate = REPLICATE_API_TOKEN
  ? new Replicate({ auth: REPLICATE_API_TOKEN })
  : null;

function parseDataUri(imageBase64) {
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return {
      mimeType: null,
      base64Payload: imageBase64,
      dataUri: null,
    };
  }

  return {
    mimeType: match[1],
    base64Payload: match[2],
    dataUri: imageBase64,
  };
}

function isBase64Valid(input) {
  if (typeof input !== "string" || input.length === 0) {
    return false;
  }

  try {
    const normalized = input.replace(/\s+/g, "");

    if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
      return false;
    }

    const buffer = Buffer.from(normalized, "base64");
    return buffer.length > 0;
  } catch {
    return false;
  }
}

function estimateBytes(base64Payload) {
  const padding = (base64Payload.match(/=+$/) || [""])[0].length;
  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/generate", generateLimiter, async (req, res) => {
  const { imageBase64, styleId } = req.body || {};

  if (typeof imageBase64 !== "string" || typeof styleId !== "string") {
    res.status(400).json({
      status: "error",
      code: "INVALID_REQUEST",
      message: "Request must include imageBase64 and styleId.",
    });
    return;
  }

  if (!ALLOWED_STYLE_IDS.has(styleId)) {
    res.status(400).json({
      status: "error",
      code: "INVALID_STYLE",
      message: "styleId is not supported.",
    });
    return;
  }

  const parsed = parseDataUri(imageBase64);

  if (parsed.mimeType && !ALLOWED_MIME.has(parsed.mimeType)) {
    res.status(400).json({
      status: "error",
      code: "INVALID_IMAGE_TYPE",
      message: "Only png, jpeg, and webp are allowed.",
    });
    return;
  }

  if (!isBase64Valid(parsed.base64Payload)) {
    res.status(400).json({
      status: "error",
      code: "INVALID_IMAGE",
      message: "imageBase64 is not valid base64.",
    });
    return;
  }

  const imageBytes = estimateBytes(parsed.base64Payload);

  if (imageBytes <= 0 || imageBytes > MAX_FILE_BYTES) {
    res.status(400).json({
      status: "error",
      code: "FILE_TOO_LARGE",
      message: "Image too large. Max 10MB.",
    });
    return;
  }

  if (!replicate) {
    res.status(503).json({
      status: "error",
      code: "CONFIG_ERROR",
      message: "Server is not configured for generation.",
    });
    return;
  }

  const style = STYLES[styleId];
  const dataUri = parsed.dataUri || `data:image/png;base64,${parsed.base64Payload}`;

  try {
    const output = await replicate.run("stability-ai/sdxl", {
      input: {
        image: dataUri,
        prompt: style.prompt,
        negative_prompt: style.negativePrompt,
        strength: style.strength,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (typeof imageUrl !== "string" || imageUrl.length === 0) {
      throw new Error("Unexpected Replicate response format.");
    }

    res.status(200).json({
      styleId,
      imageUrl,
      status: "success",
    });
  } catch (error) {
    console.error("Generation failed:", error);
    res.status(502).json({
      styleId,
      imageUrl: null,
      status: "error",
      code: "GENERATION_FAILED",
      message: "Generation failed. Tap retry.",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: "Route not found.",
  });
});

app.listen(PORT, () => {
  console.log(`ClipartAI backend running on port ${PORT}`);
});
