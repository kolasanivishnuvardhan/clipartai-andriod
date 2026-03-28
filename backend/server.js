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
const TRUST_PROXY = process.env.TRUST_PROXY ?? "1";
const REPLICATE_MODEL = (process.env.REPLICATE_MODEL || "").trim();
const GENERATE_RATE_LIMIT_PER_MIN = Number(
  process.env.GENERATE_RATE_LIMIT_PER_MIN || 5,
);
const REPLICATE_MIN_INTERVAL_MS = Number(
  process.env.REPLICATE_MIN_INTERVAL_MS || 11_000,
);
const REPLICATE_MODEL_FALLBACKS = (process.env.REPLICATE_MODEL_FALLBACKS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const REPLICATE_MODEL_CANDIDATES = [
  REPLICATE_MODEL,
  ...REPLICATE_MODEL_FALLBACKS,
].filter((value, index, arr) => arr.indexOf(value) === index);

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
const SAFE_GENERATE_RATE_LIMIT_PER_MIN =
  Number.isFinite(GENERATE_RATE_LIMIT_PER_MIN) && GENERATE_RATE_LIMIT_PER_MIN > 0
    ? Math.floor(GENERATE_RATE_LIMIT_PER_MIN)
    : 5;
const SAFE_REPLICATE_MIN_INTERVAL_MS =
  Number.isFinite(REPLICATE_MIN_INTERVAL_MS) && REPLICATE_MIN_INTERVAL_MS > 0
    ? Math.floor(REPLICATE_MIN_INTERVAL_MS)
    : 11_000;

let replicateQueue = Promise.resolve();
let nextReplicateRequestAt = 0;

// Railway and other managed platforms sit behind reverse proxies.
if (TRUST_PROXY === "1" || TRUST_PROXY.toLowerCase() === "true") {
  app.set("trust proxy", 1);
}

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: SAFE_GENERATE_RATE_LIMIT_PER_MIN,
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReplicateSlot() {
  const now = Date.now();
  const waitMs = Math.max(0, nextReplicateRequestAt - now);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  nextReplicateRequestAt = Date.now() + SAFE_REPLICATE_MIN_INTERVAL_MS;
}

function runInReplicateQueue(task) {
  const taskPromise = replicateQueue.then(async () => {
    await waitForReplicateSlot();
    return task();
  });

  replicateQueue = taskPromise.catch(() => undefined);
  return taskPromise;
}

function isReplicateModelNotFound(error) {
  const statusCode =
    error?.response?.status ||
    error?.status ||
    error?.statusCode ||
    null;
  const message = String(error?.message || "");

  return statusCode === 404 || message.includes("status 404 Not Found");
}

function isReplicateRateLimited(error) {
  const statusCode =
    error?.response?.status ||
    error?.status ||
    error?.statusCode ||
    null;
  const message = String(error?.message || "");

  return statusCode === 429 || message.includes("status 429 Too Many Requests");
}

function extractRetryAfterSeconds(error) {
  const fromHeader =
    Number(error?.response?.headers?.get?.("retry-after")) ||
    Number(error?.response?.headers?.["retry-after"]);

  if (Number.isFinite(fromHeader) && fromHeader > 0) {
    return fromHeader;
  }

  const message = String(error?.message || "");
  const match = message.match(/"retry_after"\s*:\s*(\d+)/i);
  if (match) {
    return Number(match[1]);
  }

  return null;
}

async function runGenerationWithModelFallback(input) {
  if (REPLICATE_MODEL_CANDIDATES.length === 0) {
    throw new Error("No configured Replicate model candidates.");
  }

  let lastError = null;

  for (const model of REPLICATE_MODEL_CANDIDATES) {
    try {
      const output = await runInReplicateQueue(() => replicate.run(model, { input }));
      return { output, model };
    } catch (error) {
      lastError = error;

      if (isReplicateRateLimited(error)) {
        const retryAfterSeconds = extractRetryAfterSeconds(error) ?? 10;

        console.warn(
          `Replicate throttled ${model}; retrying in ~${retryAfterSeconds}s.`,
        );

        await sleep((retryAfterSeconds + 1) * 1000);

        try {
          const output = await runInReplicateQueue(() =>
            replicate.run(model, { input }),
          );
          return { output, model };
        } catch (retryError) {
          lastError = retryError;

          if (
            !isReplicateRateLimited(retryError) &&
            !isReplicateModelNotFound(retryError)
          ) {
            throw retryError;
          }

          continue;
        }
      }

      if (!isReplicateModelNotFound(error)) {
        throw error;
      }

      console.warn(`Replicate model not found: ${model}`);
    }
  }

  throw lastError || new Error("No Replicate model candidates succeeded.");
}

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

  if (REPLICATE_MODEL_CANDIDATES.length === 0) {
    res.status(503).json({
      status: "error",
      code: "CONFIG_ERROR",
      message:
        "REPLICATE_MODEL is missing. Set a valid model in Railway environment variables.",
    });
    return;
  }

  const style = STYLES[styleId];
  const dataUri = parsed.dataUri || `data:image/png;base64,${parsed.base64Payload}`;

  try {
    const { output, model } = await runGenerationWithModelFallback({
      image: dataUri,
      prompt: style.prompt,
      negative_prompt: style.negativePrompt,
      strength: style.strength,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (typeof imageUrl !== "string" || imageUrl.length === 0) {
      throw new Error("Unexpected Replicate response format.");
    }

    res.status(200).json({
      styleId,
      imageUrl,
      status: "success",
      model,
    });
  } catch (error) {
    console.error("Generation failed:", error);

    const modelNotFound = isReplicateModelNotFound(error);
    const replicateRateLimited = isReplicateRateLimited(error);
    const retryAfterSeconds = extractRetryAfterSeconds(error);

    if (replicateRateLimited) {
      res.status(429).json({
        styleId,
        imageUrl: null,
        status: "error",
        code: "RATE_LIMIT_ERROR",
        message:
          retryAfterSeconds && retryAfterSeconds > 0
            ? `Rate limited by generation provider. Retry in about ${retryAfterSeconds}s.`
            : "Rate limited by generation provider. Wait a moment and retry.",
      });
      return;
    }

    res.status(502).json({
      styleId,
      imageUrl: null,
      status: "error",
      code: modelNotFound ? "MODEL_NOT_FOUND" : "GENERATION_FAILED",
      message: modelNotFound
        ? "Generation model is unavailable. Configure REPLICATE_MODEL in Railway."
        : "Generation failed. Tap retry.",
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
