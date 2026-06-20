'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVoiceReturn {
  listening: boolean;
  speaking: boolean;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export function useVoice(onTranscript: (text: string) => void): UseVoiceReturn {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasMic = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
    const hasTTS = !!window.speechSynthesis;
    setSupported(hasMic && hasTTS);

    if (!hasTTS) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find(v => v.name === 'Samantha') ||        // macOS
        voices.find(v => v.name === 'Karen') ||           // macOS AU
        voices.find(v => v.name === 'Victoria') ||        // macOS
        voices.find(v => v.name.includes('Zira')) ||      // Windows
        voices.find(v => v.name.includes('Jenny')) ||     // Edge
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any ongoing speech first
    window.speechSynthesis?.cancel();
    setSpeaking(false);

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend   = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const transcript = (e.results[0]?.[0]?.transcript ?? '').trim();
      if (transcript) onTranscript(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Strip any tool-call JSON blobs, keep only readable text
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\[[\s\S]*?\]/g, '')
      .trim()
      .slice(0, 500); // cap to ~30s of speech

    if (!clean) return;

    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.rate   = 0.93;
    utt.pitch  = 1.08;
    utt.volume = 1;

    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, supported, startListening, stopListening, speak, stopSpeaking };
}
