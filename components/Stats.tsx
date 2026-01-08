
import React from 'react';
import { Statistics } from '../types';
import { Users, DoorOpen, HeartHandshake, Zap, AlertCircle } from 'lucide-react';

interface StatsProps {
  stats: Statistics;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <StatCard 
        label="總人數" 
        value={stats.totalPeople} 
        icon={<Users className="w-5 h-5 text-blue-500" />} 
        bgColor="bg-blue-50"
      />
      <StatCard 
        label="來賓人數" 
        value={stats.totalGuests} 
        icon={<Zap className="w-5 h-5 text-amber-500" />} 
        bgColor="bg-amber-50"
      />
      <StatCard 
        label="成功對接" 
        value={stats.synergyCount} 
        icon={<HeartHandshake className="w-5 h-5 text-pink-500" />} 
        bgColor="bg-pink-50"
        highlight={stats.synergyCount > 0}
      />
      <StatCard 
        label="產業衝突" 
        value={stats.conflictCount} 
        icon={<AlertCircle className="w-5 h-5 text-rose-500" />} 
        bgColor="bg-rose-50"
        highlight={stats.conflictCount > 0}
      />
      <StatCard 
        label="平均每房" 
        value={stats.totalRooms ? Math.round(stats.totalPeople / stats.totalRooms * 10) / 10 : 0} 
        icon={<DoorOpen className="w-5 h-5 text-indigo-500" />} 
        bgColor="bg-indigo-50"
      />
    </div>
  );
};

const StatCard: React.FC<{label: string, value: number, icon: any, bgColor: string, highlight?: boolean}> = ({ label, value, icon, bgColor, highlight }) => (
  <div className={`${bgColor} p-4 rounded-xl border border-white shadow-sm`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-slate-500 font-bold">{label}</span>
    </div>
    <div className={`text-2xl font-black ${highlight ? (label.includes('衝突') ? 'text-rose-600' : 'text-pink-600') : 'text-slate-800'}`}>
      {value}
    </div>
  </div>
);

export default Stats;
