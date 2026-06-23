'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';

// Dynamically import Picker (no SSR) to avoid hydration issues
const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export default function EmojiPicker({ onEmojiSelect, onClose, position = 'top' }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className={`absolute z-50 ${position === 'top' ? 'bottom-12' : 'top-12'} right-0`}
      style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.18))' }}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: any) => {
          onEmojiSelect(emoji.native);
          onClose();
        }}
        theme="light"
        locale="id"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={2}
        perLine={8}
      />
    </div>
  );
}
