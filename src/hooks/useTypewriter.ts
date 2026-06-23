'use client';

/**
 * src/hooks/useTypewriter.ts
 * ──────────────────────────
 * Drives a typewriter animation for the latest AI message.
 *
 * Usage:
 *   const { displayed, isDone } = useTypewriter(text, 22);
 *   // render <span>{displayed}</span>  and conditionally add .typewriter-cursor
 */

import { useState, useEffect, useRef } from 'react';

interface Options {
  speed?: number;       // ms per character (default 22)
  enabled?: boolean;    // skip animation when false (default true)
}

export function useTypewriter(
  text: string,
  options: Options = {}
): { displayed: string; isDone: boolean } {
  const { speed = 22, enabled = true } = options;

  const [displayed, setDisplayed] = useState('');
  const [isDone,    setIsDone]    = useState(false);
  const indexRef = useRef(0);
  const textRef  = useRef(text);

  useEffect(() => {
    // Reset when text changes
    indexRef.current = 0;
    textRef.current  = text;
    setIsDone(false);

    if (!enabled || !text) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    setDisplayed('');

    const interval = setInterval(() => {
      if (indexRef.current >= textRef.current.length) {
        setIsDone(true);
        clearInterval(interval);
        return;
      }
      indexRef.current++;
      setDisplayed(textRef.current.slice(0, indexRef.current));
    }, speed);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return { displayed, isDone };
}
