export type StyleId = "cartoon" | "flat" | "anime" | "pixel" | "sketch";
export type ResultStatus = "idle" | "loading" | "success" | "error";

export interface ClipArtStyle {
  id: StyleId;
  label: string;
  emoji: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  strength: number;
}

export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

export interface GenerationResult {
  styleId: StyleId;
  imageUrl: string | null;
  localUri: string | null;
  status: ResultStatus;
  error: string | null;
}
