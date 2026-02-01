
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Fluency', value: '7.2', change: '+0.4', color: 'indigo' },
    { label: 'Accuracy', value: '68%', change: '+5%', color: 'green' },
    { label: 'Streak', value: '5 Days', change: 'New Record', color: 'orange' },
  ];

  const recentSounds = [
    { sound: '/θ/', word: 'Think', mastered: true },
    { sound: '/ð/', word: 'Them', mastered: false },
    { sound: '/ɹ/', word: 'Red', mastered: true },
    { sound: '/æ/', word: 'Cat', mastered: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Accent Journey</h1>
        <p className="text-slate-600 mt-2">Let's continue polishing your American accent today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-slate-900">{stat.value}</span>
              <span className={`text-xs font-bold text-${stat.color}-600 bg-${stat.color}-50 px-2 py-0.5 rounded`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Recent Phonemes</h3>
            <div className="grid grid-cols-2 gap-4">
              {recentSounds.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-serif text-indigo-600">{item.sound}</span>
                    <div>
                      <p className="font-bold text-sm">{item.word}</p>
                      <p className="text-xs text-slate-500">{item.mastered ? 'Mastered' : 'Practicing'}</p>
                    </div>
                  </div>
                  {item.mastered ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-orange-400">●</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-md font-bold mb-4">🇺🇸 Quick US Phrases</h3>
            <div className="space-y-2">
              <div className="p-3 bg-indigo-50 rounded-lg text-sm flex justify-between">
                <span>"How's it going?"</span>
                <span className="text-indigo-400">/haʊzɪtˈɡoʊɪŋ/</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between">
                <span>"What's up?"</span>
                <span className="text-slate-400">/wʌts ʌp/</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden flex-1">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Daily Routine</h3>
              <p className="text-indigo-100 mb-6">Mastering the tricky "R" sounds and Flap-T reductions.</p>
              <Link
                to="/lesson"
                className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Start Training
              </Link>
            </div>
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10">
              <span className="text-9xl font-serif">/ɹ/</span>
            </div>
          </div>

          <div className="bg-green-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">Essential Phrases</h3>
              <p className="text-green-100 text-sm mb-4">Learn the top 50 sentences used in daily US life.</p>
              <Link
                to="/lesson"
                className="inline-block bg-white text-green-600 font-bold px-5 py-2 rounded-lg hover:bg-green-50 text-sm transition-colors"
              >
                Browse Phrases
              </Link>
            </div>
            <div className="absolute bottom-0 right-0 translate-y-4 translate-x-4 opacity-10 rotate-12">
              <span className="text-6xl font-bold">"HEY!"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
