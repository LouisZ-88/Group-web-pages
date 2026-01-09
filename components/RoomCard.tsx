
import React from 'react';
import { Person, Role, Room, SynergyMapEntry } from '../types';
import { AlertCircle, HeartHandshake, Zap, Users, Crown } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  synergyMap: Record<string, SynergyMapEntry>;
  onDragStart: (person: Person, sourceRoomId: string) => void;
  onDrop: (targetRoomId: string) => void;
  index: number;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, synergyMap, onDragStart, onDrop, index }) => {
  const entries = Object.values(synergyMap);

  // 找出特定人選在房間內的對接對象及其原因
  const getMatchDetails = (person: Person) => {
    const pInd = person.industry.trim().toLowerCase();
    const pEntry = entries.find(e => e.keywords.some(kw => pInd.includes(kw) || kw.includes(pInd)));
    
    if (!pEntry) return [];

    const others = [room.leader, ...room.members, ...room.guests].filter(p => p.id !== person.id);
    
    return others.map(other => {
      const oInd = other.industry.trim().toLowerCase();
      // 1. 直系命中 (同關鍵字群組)
      const isDirect = pEntry.keywords.some(kw => oInd.includes(kw) || kw.includes(oInd));
      if (isDirect) {
        return { 
          target: other, 
          reason: `同屬「${pEntry.category}」`, 
          opps: pEntry.opportunities 
        };
      }

      // 2. 跨大分類命中
      const oEntry = entries.find(e => e.keywords.some(kw => oInd.includes(kw) || kw.includes(oInd)));
      if (oEntry && pEntry.targetCategories.includes(oEntry.category)) {
        return { 
          target: other, 
          reason: `跨界：${pEntry.category} x ${oEntry.category}`, 
          opps: pEntry.opportunities 
        };
      }

      return null;
    }).filter((m): m is NonNullable<typeof m> => m !== null);
  };

  const renderPerson = (person: Person, type: 'leader' | 'member' | 'guest') => {
    const matches = getMatchDetails(person);
    const hasSynergy = matches.length > 0;
    const isConflicted = room.conflicts.includes(person.id);
    
    // 取得該人的分類
    const pInd = person.industry.trim().toLowerCase();
    const pEntry = entries.find(e => e.keywords.some(kw => pInd.includes(kw) || kw.includes(pInd)));

    return (
      <div 
        key={person.id}
        draggable={type !== 'leader'}
        onDragStart={() => onDragStart(person, room.id)}
        className={`group relative p-3 rounded-xl border transition-all duration-300 ${
          type === 'leader' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' :
          type === 'guest' ? 'bg-amber-50 border-amber-100 hover:border-amber-300 cursor-grab active:cursor-grabbing' :
          'bg-slate-50 border-slate-100 hover:border-indigo-200 cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className={`font-black truncate ${type === 'leader' ? 'text-white text-lg' : 'text-slate-800'}`}>
                {person.name}
                {type === 'leader' && <span className="ml-1 text-amber-300">★</span>}
              </p>
              {pEntry && type !== 'leader' && (
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">
                  {pEntry.category}
                </span>
              )}
            </div>
            <p className={`text-sm font-medium ${type === 'leader' ? 'text-indigo-100' : 'text-slate-500'}`}>
              {person.industry}
            </p>
          </div>

          <div className="flex gap-1 shrink-0">
            {isConflicted && (
              <span title="產業衝突">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </span>
            )}
            {hasSynergy && (
              <div className="relative">
                <span className="cursor-help">
                  <HeartHandshake className={`w-5 h-5 ${type === 'leader' ? 'text-amber-300' : 'text-rose-500'}`} />
                </span>
                {/* TOOLTIP */}
                <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 text-xs rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-1">
                  <p className="font-black text-rose-600 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 發現對接商機！
                  </p>
                  <div className="space-y-3">
                    {matches.map((m, i) => (
                      <div key={i} className="pb-2 border-b border-slate-100 last:border-0">
                        <p className="font-bold text-slate-700 mb-1">
                          與 <span className="text-indigo-600">{m.target.name}</span> ({m.target.industry})
                        </p>
                        <p className="text-slate-500 mb-1">原因：{m.reason}</p>
                        {m.opps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.opps.map((op, j) => (
                              <span key={j} className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                                #{op}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const capacity = Math.round(((room.members.length + room.guests.length) / 6) * 100);

  const isLobby = room.id === 'lobby';

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(room.id)}
      className={`bg-white rounded-3xl shadow-xl overflow-hidden border flex flex-col h-full hover:shadow-2xl transition-shadow duration-300 ${
        isLobby ? 'border-indigo-400 ring-2 ring-indigo-100 md:col-span-2 lg:col-span-4' : 'border-slate-200'
      }`}
    >
      {/* 房頭部 */}
      <div className={`${isLobby ? 'bg-indigo-950' : 'bg-slate-900'} p-5 text-white flex justify-between items-center`}>
        <div>
          <h3 className="text-xl font-black text-indigo-400 tracking-tighter uppercase whitespace-nowrap">
            {isLobby ? '聯誼大廳 / LOBBY' : `ROOM ${index + 1}`}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-60">
            {isLobby ? 'Networking Hub' : 'Business Hub'}
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-black">{1 + room.members.length + room.guests.length}</span>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-5">
        {/* 房長部分 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-indigo-50 rounded-md">
              <Crown className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {isLobby ? '大廳主持人' : '房長核心'}
            </span>
          </div>
          {renderPerson(room.leader, 'leader')}
        </div>

        {/* 來賓部分 */}
        {room.guests.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 bg-amber-50 rounded-md">
                <Zap className="w-3 h-3 text-amber-500" />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">重點來賓</span>
              <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{room.guests.length}</span>
            </div>
            <div className="space-y-2">
              {room.guests.map(g => renderPerson(g, 'guest'))}
            </div>
          </div>
        )}

        {/* 會員部分 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-indigo-50 rounded-md">
              <Users className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">會員夥伴</span>
            <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{room.members.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {room.members.map(m => renderPerson(m, 'member'))}
          </div>
        </div>
      </div>

      {/* 底部容量 */}
      {!isLobby && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 mt-auto">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase">容量負荷</span>
            <span className="text-[10px] font-black text-indigo-600">{capacity}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${capacity > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${capacity}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCard;
