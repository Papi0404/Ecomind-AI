'use client';

/**
 * src/components/AiThinkingBubble.tsx
 * Pulsing 3-dot skeleton shimmer shown while AI is generating a response.
 * Never a plain spinner — meets the AI-first design spec.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { thinkingContainerVariants } from '@/lib/motion-variants';

export default function AiThinkingBubble() {
  return (
    <AnimatePresence>
      <motion.div
        className="flex justify-start"
        variants={thinkingContainerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* AI avatar dot */}
        <div className="flex items-end gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-eco-200 to-eco-500 flex items-center justify-center shadow">
            <span className="text-white text-[10px] font-black">AI</span>
          </div>

          {/* Bubble with shimmer skeleton */}
          <div className="ai-bubble p-4 max-w-[220px] space-y-2">
            {/* Shimmer lines */}
            <div className="skeleton h-2.5 w-32 rounded" />
            <div className="skeleton h-2.5 w-24 rounded" />

            {/* Pulsing dots */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-eco-200 inline-block" style={{ animation: 'dotBounce 1.2s ease-in-out 0s infinite' }} />
              <span className="w-2 h-2 rounded-full bg-eco-200 inline-block" style={{ animation: 'dotBounce 1.2s ease-in-out 0.2s infinite' }} />
              <span className="w-2 h-2 rounded-full bg-ai-300  inline-block" style={{ animation: 'dotBounce 1.2s ease-in-out 0.4s infinite' }} />
              <span className="text-[10px] text-gray-400 font-semibold ml-1">EcoMind AI sedang berpikir…</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
