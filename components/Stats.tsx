
import React from 'react';
import { Statistics } from '../types';
import { Users, DoorOpen, HeartHandshake, Zap, AlertCircle } from 'lucide-react';

interface StatsProps {
  stats: Statistics;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8 no-print">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatCard 
          label="參與總人數" 
          value={stats.totalPeople} 
          icon={<Users className="w-6 h-6 text-indigo-500" />} 
          bgColor="bg-indigo-50/50"
          suffix="人"
        />
        <StatCard 
          label="待對接來賓" 
          value={stats.totalGuests} 
          icon={<Zap className="w-6 h-6 text-amber-500" />} 
          bgColor="bg-amber-50/50"
          suffix="位"
        />
        <StatCard 
          label="來賓成功對接" 
          value={stats.synergyCount} 
          icon={<HeartHandshake className="w-6 h-6 text-rose-500" />} 
          bgColor="bg-rose-50/50"
          highlight={stats.synergyCount > 0}
          suffix="位"
        />
        <StatCard 
          label="產業衝突警告" 
          value={stats.conflictCount} 
          icon={<AlertCircle className="w-6 h-6 text-slate-400" />} 
          bgColor="bg-slate-50/50"
          highlight={stats.conflictCount > 0}
          isWarning={stats.conflictCount > 0}
          suffix="處"
        />
        <StatCard 
          label="精準對接小房" 
          value={stats.totalRooms > 1 ? stats.totalRooms - 1 : stats.totalRooms} 
          icon={<DoorOpen className="w-6 h-6 text-emerald-500" />} 
          bgColor="bg-emerald-50/50"
          suffix="間"
          title="每房配置：1房長 + 1來賓 + 3~4會員"
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string, 
  value: number, 
  icon: React.ReactNode, 
  bgColor: string, 
  highlight?: boolean, 
  isWarning?: boolean,
  suffix?: string,
  title?: string
}> = ({ label, value, icon, bgColor, highlight, isWarning, suffix, title }) => (
  <div 
    title={title}
    className={`${bgColor} p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-between transition-all hover:shadow-md cursor-help`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <span className="text-sm text-slate-500 font-black tracking-tight leading-tight">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <div className={`text-4xl font-black tracking-tighter ${
        isWarning ? 'text-rose-600 animate-bounce' : 
        highlight ? 'text-rose-600' : 'text-slate-900'
      }`}>
        {value}
      </div>
      {suffix && <span className="text-xs font-bold text-slate-400">{suffix}</span>}
    </div>
  </div>
);

export default Stats;
