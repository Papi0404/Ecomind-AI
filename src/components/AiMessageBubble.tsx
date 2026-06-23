'use client';

/**
 * src/components/AiMessageBubble.tsx
 * ────────────────────────────────────
 * Renders a single AI message with:
 *  - Gradient border (::before pseudo via .ai-bubble CSS class)
 *  - Typewriter effect on the most-recent message
 *  - AI-generated trust badge
 *  - Spring entrance animation (Framer Motion)
 */

import { motion } from 'framer-motion';
import { aiBubbleVariants } from '@/lib/motion-variants';
import { useTypewriter } from '@/hooks/useTypewriter';
import { Sparkles, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
  content: string;
  isLatest: boolean;
  timestamp?: string;
}

export default function AiMessageBubble({ content, isLatest, timestamp }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { displayed, isDone } = useTypewriter(content, { enabled: isLatest, speed: 18 });
  const text = isLatest ? displayed : content;

  return (
    <motion.div
      className="flex justify-start"
      variants={aiBubbleVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-end gap-2 max-w-[82%]">
        {/* AI Avatar */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-eco-200 to-eco-500 flex items-center justify-center shadow-md">
          <span className="text-white text-[10px] font-black">AI</span>
        </div>

        <div className="space-y-1.5">
          {/* Bubble */}
          <div className="ai-bubble p-4 text-xs font-medium leading-relaxed text-gray-800 relative">
            {/* Animated AI dot in corner */}
            <span className="ai-dot absolute -top-1 -right-1" />

            {/* Content with typewriter cursor on latest */}
            <p className={`whitespace-pre-line ${isLatest && !isDone ? 'typewriter-cursor' : ''}`}>
              {text}
            </p>
          </div>

          {/* Trust indicator + timestamp */}
          <div className="flex items-center gap-2 pl-1">
            <span className="ai-trust-badge relative">
              <Sparkles className="w-2.5 h-2.5" />
              AI-Generated
              <button
                type="button"
                aria-label="Tentang konten ini"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="ml-0.5"
              >
                <Info className="w-2.5 h-2.5" />
              </button>

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-2 w-52 bg-gray-900 text-white text-[10px] font-medium p-2 rounded-lg shadow-xl z-50 leading-relaxed">
                  Konten ini dibuat oleh Google Gemini AI. Verifikasi fakta kritis pada sumber resmi.
                  <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              )}
            </span>

            {timestamp && (
              <span className="text-[10px] text-gray-400 font-medium">{timestamp}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
