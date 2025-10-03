import React from 'react';

interface ShopfrontAboutPreviewProps {
  aboutText: string;
}

export const ShopfrontAboutPreview = ({ aboutText }: ShopfrontAboutPreviewProps) => {
  if (!aboutText.trim()) return null;

  return (
    <div className="mb-4 md:mb-6">
      <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mb-2">About</h4>
      <p className="text-sm md:text-base leading-relaxed">{aboutText}</p>
    </div>
  );
};
