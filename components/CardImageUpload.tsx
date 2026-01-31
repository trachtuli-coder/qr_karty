"use client";

import { useRef } from "react";

interface CardImageUploadProps {
  slotId: number;
  onImageSelect: (slotId: number, imageUrl: string) => void;
}

export function CardImageUpload({ slotId, onImageSelect }: CardImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string; // Base64 data
        onImageSelect(slotId, imageUrl);
      };
      reader.readAsDataURL(file); // Převedeme na Base64
    }
  };

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      className="hidden"
      id={`image-upload-${slotId}`}
    />
  );
}
