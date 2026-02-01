
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LessonView from './components/LessonView';
import LiveCoach from './components/LiveCoach';
import Dashboard from './components/Dashboard';
import { LessonStep } from './types';

const AppContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<LessonStep>(LessonStep.OVERVIEW);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activePath={location.pathname} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lesson" element={<LessonView currentStep={currentStep} onStepChange={setCurrentStep} />} />
              <Route path="/coach" element={<LiveCoach />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
