// src/components/PortraitPersistence.tsx
import { useEffect } from 'react';
import {
  loadPortraitUrl,
  savePortraitUrl,
  loadPortraitPose,
  savePortraitPose,
} from '@/state/portraitStore';

type Props = {
  // current values in state
  portraitUrl: string | null;
  portraitX: number;
  portraitY: number;
  portraitScale: number;

  // setters from page
  setPortraitUrl: (v: string | null) => void;
  setPortraitX: (v: number) => void;
  setPortraitY: (v: number) => void;
  setPortraitScale: (v: number) => void;

  // keys
  selectedDesign?: string;
  format: 'square' | 'story';
};

export default function PortraitPersistence({
  portraitUrl, portraitX, portraitY, portraitScale,
  setPortraitUrl, setPortraitX, setPortraitY, setPortraitScale,
  selectedDesign, format,
}: Props) {
  // LOAD URL (once per design change). Never clear a non-null URL.
  useEffect(() => {
    const url = loadPortraitUrl(selectedDesign || undefined);
    if (url) setPortraitUrl(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDesign]);

  // LOAD pose whenever format or design changes
  useEffect(() => {
    const pose = loadPortraitPose(format, selectedDesign || undefined);
    setPortraitX(pose.x);
    setPortraitY(pose.y);
    setPortraitScale(pose.scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, selectedDesign]);

  // SAVE URL whenever it changes
  useEffect(() => {
    savePortraitUrl(portraitUrl ?? null, selectedDesign || undefined);
  }, [portraitUrl, selectedDesign]);

  // SAVE pose (per format) whenever any changes
  useEffect(() => {
    savePortraitPose(
      format,
      { x: portraitX, y: portraitY, scale: portraitScale },
      selectedDesign || undefined
    );
  }, [format, portraitX, portraitY, portraitScale, selectedDesign]);

  return null;
}
