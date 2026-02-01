
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { TranscriptionEntry } from '../types';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

// Updated to strictly follow Google GenAI SDK guidelines for decoding raw PCM data
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

const LiveCoach: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioContext.resume();
      await outputAudioContext.resume();
      
      audioContextRef.current = inputAudioContext;
      outputAudioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setIsListening(true);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (event) => {
              const inputData = event.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              // CRITICAL: Solely rely on sessionPromise resolves and then call session.sendRealtimeInput
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const base64Audio = part.inlineData.data;
                const outCtx = outputAudioContextRef.current;
                if (outCtx) {
                  if (outCtx.state === 'suspended') await outCtx.resume();
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                  const source = outCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outCtx.destination);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                  source.onended = () => sourcesRef.current.delete(source);
                }
              }
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'coach') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'coach', text, timestamp: Date.now() }];
              });
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'user', text, timestamp: Date.now() }];
              });
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Session error:', e);
            const msg = e?.message || "";
            if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
              setErrorMessage("Quota exceeded. Please click 'Use Own Key' in the header to use your own billing project.");
            } else {
              setErrorMessage("Connection lost. Please try again.");
            }
            setIsConnected(false);
            setIsConnecting(false);
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: "You are an expert American English accent coach helping Hassan.",
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Connection failed:', err);
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("quota") || msg.includes("429")) {
        setErrorMessage("Quota exceeded. Connect your own API key in the header to continue.");
      } else {
        setErrorMessage("Failed to start session. Check your internet.");
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (outputAudioContextRef.current) { outputAudioContextRef.current.close(); outputAudioContextRef.current = null; }
    setIsConnected(false);
    setIsListening(false);
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl">🎙️</div>
          <div>
            <h2 className="text-white font-bold">Accent Session</h2>
            <p className="text-slate-400 text-sm">Real-time Coaching with Zephyr</p>
          </div>
        </div>
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {isConnecting ? 'Initializing...' : 'Start Session'}
          </button>
        ) : (
          <button onClick={handleDisconnect} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-xl font-bold transition-all">End Session</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col scroll-smooth">
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-center mb-4">
            <p className="font-bold">⚠️ Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {transcription.length === 0 && !isConnecting && !errorMessage && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse"><span className="text-4xl">🧘‍♂️</span></div>
            <h3 className="text-white text-xl font-bold mb-2">Your Coach is Ready</h3>
            <p className="text-slate-400 max-sm">Click 'Start Session' to begin. Zephyr will guide your American accent.</p>
          </div>
        )}

        {transcription.map((entry, idx) => (
          <div key={idx} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${entry.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
              <p className="text-sm font-bold opacity-50 mb-1 uppercase tracking-tighter">{entry.role === 'user' ? 'Hassan' : 'Coach'}</p>
              <p className="leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))}

        {isConnecting && (
          <div className="flex justify-start">
             <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl animate-pulse">Waking up the coach...</div>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="p-8 bg-slate-900 border-t border-slate-800 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><div className="w-64 h-64 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}><span className="text-2xl">🎤</span></div>
            <div className="flex gap-1 h-8 items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{ height: isListening ? `${Math.random() * 100}%` : '20%', animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCoach;
