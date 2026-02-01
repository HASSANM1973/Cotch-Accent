
import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  activePath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePath }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Start Lesson', path: '/lesson', icon: '📖' },
    { name: 'Live Coach', path: '/coach', icon: '🎙️' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            A
          </div>
          <span className="font-bold text-slate-800 text-lg">Accent Coach</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activePath === item.path
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '35%' }}></div>
            </div>
            <span className="text-xs font-medium text-slate-700">35%</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
