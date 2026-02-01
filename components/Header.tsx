
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleKeyClick = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race conditions
      setHasCustomKey(true);
    } else {
      alert("API Key selection is not available in this environment.");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-slate-500">Welcome back, <span className="text-slate-900 font-bold">Hassan</span></h2>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={handleKeyClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            hasCustomKey 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
          }`}
          title={hasCustomKey ? "Using your custom API key" : "Using shared quota - Click to use your own key"}
        >
          <span className="text-sm">{hasCustomKey ? '🔑 Custom Key' : '⚠️ Use Own Key'}</span>
        </button>
        
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-indigo-700">Coach Online</span>
        </div>
        <button className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
          <img src="https://picsum.photos/32/32" alt="Avatar" />
        </button>
      </div>
    </header>
  );
};

export default Header;
