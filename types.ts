
export enum LessonStep {
  OVERVIEW = 'overview',
  SOUND_FOCUS = 'sound_focus',
  MOUTH_POSITION = 'mouth_position',
  MINIMAL_PAIRS = 'minimal_pairs',
  PRACTICE_SENTENCES = 'practice_sentences',
  ESSENTIAL_PHRASES = 'essential_phrases',
  TONGUE_TWISTER = 'tongue_twister',
  LIVE_CONVERSATION = 'live_conversation'
}

export interface MinimalPair {
  word1: string;
  word2: string;
  ipa1: string;
  ipa2: string;
}

export interface LessonContent {
  sound: string;
  ipa: string;
  description: string;
  mouthGuide: string;
  minimalPairs: MinimalPair[];
  sentences: string[];
  essentialPhrases: Array<{
    phrase: string;
    context: string;
    tip: string;
  }>;
  tongueTwister: string;
}

export interface TranscriptionEntry {
  role: 'user' | 'coach';
  text: string;
  timestamp: number;
}
