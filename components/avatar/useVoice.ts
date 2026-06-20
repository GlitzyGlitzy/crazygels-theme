'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type RecognitionError =
  | 'not-allowed'    // microphone permission denied
  | 'no-speech'      // timeout — nothing detected
  | 'network'        // network needed for cloud STT (Chrome)
  | 'audio-capture'  // no microphone found
  | 'aborted'        // manually aborted
  | 'unsupported';   // browser lacks Web Speech API

export interface UseVoiceReturn {
  listening: boolean;
  speaking: boolean;
  mouthOpen: boolean;
  supported: boolean;
  interimTranscript: string;
  recognitionError: RecognitionError | null;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  setVoiceURI: (uri: string) => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const VOICE_PREF_KEY = 'dr-maya-voice-uri';

const PREFERRED_VOICE_NAMES = [
  'Samantha',           // macOS
  'Karen',              // macOS AU
  'Victoria',           // macOS
  'Moira',              // macOS Irish
  'Tessa',              // macOS South African
  'Google US English',  // Chrome
  'Microsoft Zira',     // Windows
  'Microsoft Jenny',    // Edge / Windows
  'Microsoft Aria',     // Edge
];

function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string | null,
): SpeechSynthesisVoice | null {
  if (preferredURI) {
    const saved = voices.find(v => v.voiceURI === preferredURI);
    if (saved) return saved;
  }
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = voices.find(v => v.name.includes(name));
    if (match) return match;
  }
  return (
    voices.find(v => v.lang === 'en-US' && v.localService) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

export function useVoice(onTranscript: (text: string) => void): UseVoiceReturn {
  const [listening, setListening]               = useState(false);
  const [speaking, setSpeaking]                 = useState(false);
  const [mouthOpen, setMouthOpen]               = useState(false);
  const [supported, setSupported]               = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState<RecognitionError | null>(null);
  const [voices, setVoices]                     = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');

  const recognitionRef  = useRef<any>(null);
  const voiceRef        = useRef<SpeechSynthesisVoice | null>(null);
  const mouthTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-current callback ref avoids stale closure in recognition.onresult
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // Initialise voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const hasMic = !!SR;
    const hasTTS = !!window.speechSynthesis;
    setSupported(hasMic && hasTTS);

    if (!hasTTS) return;

    const savedURI = localStorage.getItem(VOICE_PREF_KEY) ?? undefined;

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      if (!all.length) return;

      const englishVoices = all.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices);

      const best = pickBestVoice(englishVoices, savedURI);
      if (best) {
        voiceRef.current = best;
        setSelectedVoiceURI(best.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Fix Chrome's synthesis stall when tab loses/regains focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const setVoiceURI = useCallback((uri: string) => {
    const match = voices.find(v => v.voiceURI === uri);
    if (!match) return;
    voiceRef.current = match;
    setSelectedVoiceURI(uri);
    localStorage.setItem(VOICE_PREF_KEY, uri);
  }, [voices]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SR) {
      setRecognitionError('unsupported');
      return;
    }

    // Stop any in-flight TTS before listening
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMouthOpen(false);
    setRecognitionError(null);
    setInterimTranscript('');

    recognitionRef.current?.abort();

    const recognition = new SR();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e: any) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += text;
        else interim += text;
      }
      setInterimTranscript(interim);
      if (finalText.trim()) {
        setInterimTranscript('');
        onTranscriptRef.current(finalText.trim());
      }
    };

    recognition.onerror = (e: any) => {
      const map: Record<string, RecognitionError> = {
        'not-allowed': 'not-allowed',
        'no-speech':   'no-speech',
        'network':     'network',
        'audio-capture': 'audio-capture',
        'aborted':     'aborted',
      };
      setRecognitionError(map[e.error] ?? 'unsupported');
      setListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimTranscript('');
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\[[\s\S]*?\]/g, '')
      .replace(/[*_~`#]/g, '')
      .trim()
      .slice(0, 600);

    if (!clean) return;

    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utt.voice = voiceRef.current;
    utt.rate   = 0.93;
    utt.pitch  = 1.08;
    utt.volume = 1;

    utt.onstart = () => setSpeaking(true);

    utt.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== 'word') return;
      if (mouthTimerRef.current) clearTimeout(mouthTimerRef.current);
      setMouthOpen(true);
      const charLen = (e as SpeechSynthesisEvent & { charLength?: number }).charLength ?? 5;
      mouthTimerRef.current = setTimeout(
        () => setMouthOpen(false),
        Math.max(150, charLen * 70),
      );
    };

    const closeMouth = () => {
      setSpeaking(false);
      setMouthOpen(false);
      if (mouthTimerRef.current) clearTimeout(mouthTimerRef.current);
    };
    utt.onend   = closeMouth;
    utt.onerror = closeMouth;

    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMouthOpen(false);
    if (mouthTimerRef.current) clearTimeout(mouthTimerRef.current);
  }, []);

  return {
    listening,
    speaking,
    mouthOpen,
    supported,
    interimTranscript,
    recognitionError,
    voices,
    selectedVoiceURI,
    setVoiceURI,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
