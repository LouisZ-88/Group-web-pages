
import React from 'react';
import { Room, Person, Role } from '../types';
import { ShieldAlert, Star, Users, Lightbulb, Handshake, Target } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  synergyMap: Record<string, string[]>;
  onDragStart: (person: Person, sourceRoomId: string) => void;
  onDrop: (targetRoomId: string) => void;
  index: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, synergyMap, onDragStart, onDrop, index }) => {
  const totalInRoom = 1 + room.guests.length + room.members.length;
  
  // 找出特定人選在房間內的對接對象
  const getMatches = (person: Person) => {
    const others = [room.leader, ...room.members].filter(p => p.id !== person.id);
    const mySynergies = synergyMap[person.industry] || [];
    
    return others.filter(other => mySynergies.includes(other.industry));
  };

  const renderPerson = (person: Person, type: 'leader' | 'member' | 'guest') => {
    const isConflict = room.conflicts.includes(person.id);
    const matches = type === 'guest' ? getMatches(person) : [];
    const isSynergy = room.synergies.includes(person.id);
    
    let bgColor = "bg-white";
    if (type === 'leader') bgColor = "bg-indigo-600 text-white";
    else if (isConflict) bgColor = "bg-rose-50 border-2 border-rose-200";
    else if (type === 'guest') bgColor = "bg-amber-50 border border-amber-100";
    else bgColor = "bg-emerald-50 border border-emerald-100";

    return (
      <div 
        key={person.id}
        draggable={type !== 'leader'}
        onDragStart={() => onDragStart(person, room.id)}
        className={`group relative p-2.5 rounded-xl mb-2 shadow-sm transition-all ${bgColor} ${type !== 'leader' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-sm ${type === 'leader' ? 'text-white' : 'text-slate-800'}`}>
                {person.name}
              </span>
              {isConflict && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" title="產業衝突" />}
              {type === 'leader' && <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-tight ${type === 'leader' ? 'text-indigo-200' : 'text-slate-400'}`}>
              {person.industry}
            </div>

            {/* 來賓對接分析 */}
            {type === 'guest' && matches.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-200/50 space-y-1">
                {matches.map(match => (
                  <div key={match.id} className="flex items-center gap-1 text-[9px] font-black text-indigo-600 animate-pulse">
                    <Lightbulb className="w-3 h-3" />
                    建議對接：{match.name} ({match.industry})
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isSynergy && (
            <div className="flex flex-col items-end gap-1">
              <Handshake className={`w-4 h-4 ${type === 'leader' ? 'text-white' : 'text-indigo-500'}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden transition-transform hover:scale-[1.01]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(room.id)}
    >
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
        <div className="flex flex-col">
          <h3 className="font-black text-sm tracking-widest">ROOM {index + 1}</h3>
          <div className="text-[9px] text-slate-400 font-bold uppercase">Business Hub</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-white/10 px-2 py-1 rounded-full">
          <Users className="w-3 h-3" /> {totalInRoom}
        </div>
      </div>
      
      <div className="p-4 flex-1 space-y-4 bg-slate-50/30">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> 房長核心
          </label>
          {renderPerson(room.leader, 'leader')}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex justify-between items-center">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 重點來賓</span>
            <span className="text-amber-600 bg-amber-100 px-1.5 rounded-md">{room.guests.length}</span>
          </label>
          <div className="min-h-[40px]">
            {room.guests.length > 0 ? room.guests.map(g => renderPerson(g, 'guest')) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-[10px] text-slate-400 font-bold">待拖曳來賓入座</div>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex justify-between items-center">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 會員夥伴</span>
            <span className="text-emerald-600 bg-emerald-100 px-1.5 rounded-md">{room.members.length}</span>
          </label>
          <div className="min-h-[40px]">
            {room.members.length > 0 ? room.members.map(m => renderPerson(m, 'member')) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-[10px] text-slate-400 font-bold">待拖曳會員入座</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4 bg-slate-50/30">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[8px] font-black text-slate-400 uppercase">容量負荷</span>
          <span className="text-[8px] font-black text-slate-600">{Math.round((totalInRoom / 6) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${totalInRoom > 5 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
            style={{width: `${Math.min(100, (totalInRoom / 6) * 100)}%`}}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
