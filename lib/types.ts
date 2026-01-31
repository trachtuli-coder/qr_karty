export const SLOT_COUNT = 10;

export interface CardSlotState {
  id: number;
  hasImage: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  imagePreviewUrl: string | null;
  audioPreviewUrl: string | null;
  videoPreviewUrl: string | null;
  imageFile: File | null;
  audioFile: File | null;
  videoFile: File | null;
  crop: { x: number; y: number };
  zoom: number;
}