'use client';

import { useState } from 'react';
import { cocoPreviewBackgroundGeometry } from '../../lib/coco/recipeBackground';

export default function CocoPreviewBackground({ source, format, url }: {
  source: Record<string, any>; format: 'square' | 'story'; url: string;
}) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const box = imageSize ? cocoPreviewBackgroundGeometry(source, format, imageSize) : null;
  return <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }} data-coco-preview-background="native">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt="" draggable={false} onLoad={event => {
      const image = event.currentTarget;
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    }} style={{ position: 'absolute', left: 0, top: 0,
      width: box?.width ?? '100%', height: box?.height ?? '100%', maxWidth: 'none', maxHeight: 'none',
      transform: `translate3d(${box?.x ?? 0}px, ${box?.y ?? 0}px, 0) rotate(${box?.rotation ?? 0}deg)`,
      filter: `hue-rotate(${Number(source.hue ?? 0)}deg) blur(${Number(source.bgBlur ?? 0)}px)`,
    }} />
  </div>;
}
