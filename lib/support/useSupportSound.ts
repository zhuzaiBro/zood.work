'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const preference = 'zood_support_sound';

export function playSupportChime(context: BaseAudioContext) {
  const start = context.currentTime;
  const tone = context.createPeriodicWave(new Float32Array(4), new Float32Array([0, 1, 0.17, 0.04]));
  for (const [delay, frequency, volume, decay] of [[0, 659.25, 0.14, 0.34], [0.115, 880, 0.12, 0.48]]) {
    const voice = context.createOscillator();
    const gain = context.createGain();
    const at = start + delay;
    voice.setPeriodicWave(tone);
    voice.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    voice.connect(gain).connect(context.destination);
    voice.start(at);
    voice.stop(at + decay);
  }
}

export function useSupportSound(active: boolean) {
  const [muted, setMuted] = useState(false);
  const silent = useRef(false);
  const engine = useRef<AudioContext | null>(null);
  const unlock = useCallback(() => {
    if (silent.current || !window.AudioContext) return;
    const context = engine.current ??= new AudioContext();
    if (context.state !== 'running') void context.resume().catch(() => {});
  }, []);
  useEffect(() => {
    const readPreference = () => {
      try { silent.current = localStorage.getItem(preference) === 'off'; } catch {}
      setMuted(silent.current);
    };
    readPreference();
    window.addEventListener('storage', readPreference);
    return () => {
      window.removeEventListener('storage', readPreference);
      if (engine.current) void engine.current.close().catch(() => {});
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (!active) return;
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [active, unlock]);
  const toggle = () => {
    silent.current = !silent.current;
    setMuted(silent.current);
    try { localStorage.setItem(preference, silent.current ? 'off' : 'on'); } catch {}
    if (!silent.current) unlock();
  };
  const play = useCallback((sessionId: string, replyId: string) => {
    const key = 'zood_support_last_chime_' + sessionId;
    const once = () => {
      if (silent.current || engine.current?.state !== 'running') return;
      try {
        if (localStorage.getItem(key) === replyId) return;
        localStorage.setItem(key, replyId);
      } catch {}
      playSupportChime(engine.current);
    };
    if (navigator.locks) void navigator.locks.request(key, once).catch(() => {});
    else once();
  }, []);
  return { muted, toggle, play };
}
