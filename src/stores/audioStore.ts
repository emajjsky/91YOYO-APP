import { create } from 'zustand';
import type { IFeedAudio } from '../types/feed';

interface AudioState {
  currentTrack: IFeedAudio | null;
  isPlaying: boolean;
  playTrack: (audio: IFeedAudio) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentTrack: null,
  isPlaying: false,

  playTrack: (audio) =>
    set({ currentTrack: audio, isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  stop: () => set({ currentTrack: null, isPlaying: false }),
}));
