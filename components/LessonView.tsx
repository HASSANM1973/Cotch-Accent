
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { LessonStep, LessonContent } from '../types';

interface LessonViewProps {
  currentStep: LessonStep;
  onStepChange: (step: LessonStep) => void;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const mockLesson: LessonContent = {
  sound: '/θ/ & /t/',
  ipa: 'Voiceless Dental Fricative vs Alveolar Stop',
  description: 'The sound in "think" vs "tank". Plus, mastering the American "Flap T".',
  mouthGuide: 'For /θ/, place the tip of your tongue gently between your front teeth. For the Flap T (in words like "water"), quickly tap the roof of your mouth with your tongue like a soft "d".',
  minimalPairs: [
    { word1: 'Thank', word2: 'Tank', ipa1: '/θæŋk/', ipa2: '/tæŋk/' },
    { word1: 'Thought', word2: 'Taught', ipa1: '/θɔːt/', ipa2: '/tɔːt/' },
    { word1: 'Theme', word2: 'Team', ipa1: '/θiːm/', ipa2: '/tiːm/' },
    { word1: 'Three', word2: 'Tree', ipa1: '/θriː/', ipa2: '/triː/' },
    { word1: 'Thin', word2: 'Tin', ipa1: '/θɪn/', ipa2: '/tɪn/' },
  ],
  sentences: [
    "I think I thought a thought.",
    "Three thousand thirsty thieves thanked them.",
    "Everything is on the third floor."
  ],
  essentialPhrases: [
    { phrase: "How's it going?", context: "Standard greeting in the US.", tip: "Link 'hows' and 'it'. The 't' in 'it' becomes a stop-t." },
    { phrase: "I'll be there in a bit.", context: "Telling someone you are coming.", tip: "Reduce 'in a' to almost one sound. 'Bit' has a crisp stop-t." },
    { phrase: "I'm gonna head out.", context: "Saying you are leaving.", tip: "'Gonna' is a high-frequency reduction of 'going to'." },
    { phrase: "Could you pass me that?", context: "Asking for something.", tip: "'Could you' sounds like 'could-joo' in natural US speech." },
    { phrase: "Take it easy!", context: "Saying goodbye or telling someone to relax.", tip: "Flap the 't' in 'it'. Sounds like 'Tay-kid-easy'." }
  ],
  tongueTwister: "The thin thing that they thought they threw throughout the theater."
};

const LessonView: React.FC<LessonViewProps> = ({ currentStep, onStepChange }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepsOrder = [
    LessonStep.OVERVIEW,
    LessonStep.MOUTH_POSITION,
    LessonStep.MINIMAL_PAIRS,
    LessonStep.PRACTICE_SENTENCES,
    LessonStep.ESSENTIAL_PHRASES,
    LessonStep.TONGUE_TWISTER,
    LessonStep.LIVE_CONVERSATION
  ];

  const currentIndex = stepsOrder.indexOf(currentStep);

  const nextStep = () => { if (currentIndex < stepsOrder.length - 1) onStepChange(stepsOrder[currentIndex + 1]); };
  const prevStep = () => { if (currentIndex > 0) onStepChange(stepsOrder[currentIndex - 1]); };

  const playText = async (text: string, id: string) => {
    if (isPlaying === id) return;
    setIsPlaying(id);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this high-frequency American phrase with natural rhythm, linking, and intonation: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else {
        setIsPlaying(null);
      }
    } catch (e: any) {
      console.error("TTS Failed", e);
      const msg = e?.message || "";
      if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
        setError("Quota exceeded. Please link your own key in the header.");
      } else {
        setError("Audio failed. Try again.");
      }
      setIsPlaying(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {error && (
        <div className="mb-4 bg-orange-100 border border-orange-200 p-3 rounded-xl text-orange-800 text-sm font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-orange-500 hover:text-orange-700">✕</button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 px-4 overflow-x-auto pb-4 scrollbar-hide">
        {stepsOrder.map((step, idx) => (
          <div key={step} className="flex-shrink-0 flex flex-col items-center group cursor-pointer px-4" onClick={() => onStepChange(step)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${idx <= currentIndex ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
            <span className={`text-[9px] uppercase font-bold tracking-tighter text-center whitespace-nowrap ${idx === currentIndex ? 'text-indigo-600' : 'text-slate-400'}`}>{step.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-12">
          {currentStep === LessonStep.OVERVIEW && (
            <div className="space-y-6">
              <span className="text-indigo-600 font-bold tracking-widest uppercase text-sm">Routine Overview</span>
              <h2 className="text-5xl font-serif text-slate-900">{mockLesson.sound}</h2>
              <p className="text-xl text-slate-600">{mockLesson.description}</p>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex gap-4"><span className="text-2xl">💡</span><p className="text-slate-700 italic">"Today we focus on high-frequency sounds and survival phrases used daily across the United States."</p></div>
            </div>
          )}

          {currentStep === LessonStep.MOUTH_POSITION && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Mouth & Tongue Positioning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="aspect-square bg-slate-100 rounded-3xl flex items-center justify-center p-8 relative">
                   <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-600">
                      <path d="M20,60 Q50,90 80,60" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path d="M25,40 Q50,30 75,40" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path d="M40,58 Q50,55 60,58" fill="none" stroke="#f43f5e" strokeWidth="8" />
                      <text x="50" y="20" textAnchor="middle" fontSize="6" fill="#64748b">Top Teeth</text>
                      <text x="50" y="80" textAnchor="middle" fontSize="6" fill="#64748b">Bottom Teeth</text>
                   </svg>
                </div>
                <div className="space-y-4">
                  <p className="text-lg text-slate-600 leading-relaxed">{mockLesson.mouthGuide}</p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span><span>Relax your tongue for the dental 'th'</span></li>
                    <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span><span>Quickly tap for the Flap T (sounds like 'd')</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === LessonStep.MINIMAL_PAIRS && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Minimal Pairs</h2>
              <div className="grid grid-cols-1 gap-3">
                {mockLesson.minimalPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 text-center"><p className="font-bold text-lg text-indigo-600">{pair.word1}</p><p className="text-xs text-slate-400 font-serif">{pair.ipa1}</p></div>
                    <div className="px-4 text-slate-300 font-bold">vs</div>
                    <div className="flex-1 text-center"><p className="font-bold text-lg text-slate-700">{pair.word2}</p><p className="text-xs text-slate-400 font-serif">{pair.ipa2}</p></div>
                    <button onClick={() => playText(`${pair.word1} vs ${pair.word2}`, `pair-${idx}`)} className={`ml-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying === `pair-${idx}` ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 opacity-0 group-hover:opacity-100'}`}>{isPlaying === `pair-${idx}` ? '...' : '🔊'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === LessonStep.PRACTICE_SENTENCES && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Target Sound Practice</h2>
              <div className="space-y-4">
                {mockLesson.sentences.map((sentence, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 flex justify-between items-center group">
                    <p className="text-lg font-medium text-slate-800">{sentence}</p>
                    <button onClick={() => playText(sentence, `sentence-${idx}`)} className={`p-3 rounded-xl shadow-sm transition-all ${isPlaying === `sentence-${idx}` ? 'bg-indigo-600 text-white animate-bounce' : 'bg-white hover:shadow-md'}`}>{isPlaying === `sentence-${idx}` ? '🔊' : '👂'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === LessonStep.ESSENTIAL_PHRASES && (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold">🇺🇸 Survival Phrases</h2>
                  <p className="text-slate-600 mt-1">Common American idioms and high-frequency sentences.</p>
                </div>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Most Important</span>
              </div>
              <div className="space-y-6">
                {mockLesson.essentialPhrases.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex-1 pr-8">
                        <p className="text-2xl font-bold text-slate-900 mb-1">"{item.phrase}"</p>
                        <p className="text-sm text-indigo-600 font-medium mb-3">{item.context}</p>
                        <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border border-slate-100">
                          <span className="font-bold text-indigo-400 mr-2">Coach Tip:</span> {item.tip}
                        </div>
                      </div>
                      <button 
                        onClick={() => playText(item.phrase, `essential-${idx}`)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isPlaying === `essential-${idx}` ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {isPlaying === `essential-${idx}` ? '...' : '🔊'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === LessonStep.TONGUE_TWISTER && (
            <div className="space-y-8 flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold">Challenge: Tongue Twister</h2>
              <div className="p-10 bg-indigo-50 rounded-3xl border-2 border-dashed border-indigo-200 w-full max-w-2xl relative">
                <p className="text-3xl font-bold text-indigo-900 italic leading-snug">"{mockLesson.tongueTwister}"</p>
                <button onClick={() => playText(mockLesson.tongueTwister, 'twister')} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 transition-colors">{isPlaying === 'twister' ? '🔊 playing...' : '🔊 Listen First'}</button>
              </div>
              <button className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all scale-110"><span>Record Attempt</span><span className="animate-pulse text-xl">🎤</span></button>
            </div>
          )}

          {currentStep === LessonStep.LIVE_CONVERSATION && (
            <div className="space-y-8 text-center py-10">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎓</div>
              <h2 className="text-3xl font-bold">Ready for the Live Coach?</h2>
              <p className="text-xl text-slate-600 max-w-lg mx-auto">Use the phrases you just learned in a real conversation with Zephyr.</p>
              <button onClick={() => window.location.hash = '/coach'} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl transition-all">Connect to Coach</button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-200">
          <button onClick={prevStep} disabled={currentIndex === 0} className={`px-6 py-3 rounded-xl font-bold transition-all ${currentIndex === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-white'}`}>← Previous</button>
          <button onClick={nextStep} disabled={currentIndex === stepsOrder.length - 1} className={`bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-all hover:bg-slate-800 disabled:bg-slate-300`}>{currentIndex === stepsOrder.length - 1 ? 'Lesson Finished' : 'Next Step →'}</button>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
