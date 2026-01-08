
import React, { useState, useCallback, useMemo } from 'react';
import { Person, Role, Room, Statistics, GroupingSettings } from './types';
import { groupPeople, parseInput, parseSynergyMap, updateRoomTags } from './services/groupingService';
import Stats from './components/Stats';
import RoomCard from './components/RoomCard';
import { 
  Settings, 
  RefreshCcw, 
  Copy, 
  Download, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Target,
  Users,
  Trash2,
  FileText
} from 'lucide-react';

const DEFAULT_SYNERGY_MAP = `金融服務:會計師,律師,記帳士,地政士,銀行,保險
餐飲保健:餐廳,食材批發,營養師,保健食品,冷凍物流,健身
媒體行銷:數位行銷,攝影錄影,平面設計,公關活動,社群經營,網紅
設計工程:室內設計,系統櫃,水電工程,軟裝佈置,木工,建築師
企業服務:企業培訓,軟體系統,法律顧問,勞資關係,辦公家具,人資
國際貿易:進出口商,物流貨運,報關行,翻譯公司,跨境電商,海外倉
房地產業:房仲,土地開發,驗屋公司,清潔公司,搬家服務,風水師
心靈調理:心理師,芳療師,塔羅占卜,頌缽療癒,瑜伽老師,冥想
美容形象:美容師,新娘秘書,醫美診所,美睫美甲,形象穿搭,服飾
生活品味:茶葉貿易,紅白酒,特色旅遊,寵物美容,精品零售,珠寶`;

const App: React.FC = () => {
  const [leaderInput, setLeaderInput] = useState<string>('');
  const [memberInput, setMemberInput] = useState<string>('');
  const [guestInput, setGuestInput] = useState<string>('');
  const [synergyInput, setSynergyInput] = useState<string>(DEFAULT_SYNERGY_MAP);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [draggedItem, setDraggedItem] = useState<{person: Person, sourceRoomId: string} | null>(null);
  
  const [settings, setSettings] = useState<GroupingSettings>({
    strictAvoidance: true,
    allowIndustryOverlap: false,
    targetAssigneesPerRoom: 3,
    industrySynergyMap: {}
  });

  const parsedLeaders = useMemo(() => parseInput(leaderInput, Role.LEADER), [leaderInput]);
  const parsedMembers = useMemo(() => parseInput(memberInput, Role.MEMBER), [memberInput]);
  const parsedGuests = useMemo(() => parseInput(guestInput, Role.GUEST), [guestInput]);
  const parsedSynergyMap = useMemo(() => parseSynergyMap(synergyInput), [synergyInput]);

  const stats = useMemo((): Statistics => {
    let tg = 0, tm = 0, cc = 0, sc = 0;
    rooms.forEach(r => {
      tg += r.guests.length;
      tm += r.members.length;
      cc += r.conflicts.length;
      sc += r.synergies.length;
    });
    return {
      totalPeople: rooms.length + tg + tm,
      totalRooms: rooms.length,
      totalGuests: tg,
      totalMembers: tm,
      conflictCount: cc,
      synergyCount: sc
    };
  }, [rooms]);

  const handleGrouping = useCallback(() => {
    if (parsedLeaders.length === 0) {
      alert('請至少輸入一位房長');
      return;
    }
    const allAssignees = [...parsedMembers, ...parsedGuests];
    const currentSettings = { ...settings, industrySynergyMap: parsedSynergyMap };
    const result = groupPeople(parsedLeaders, allAssignees, currentSettings);
    setRooms(result);
    setIsConfigOpen(false);
  }, [parsedLeaders, parsedMembers, parsedGuests, parsedSynergyMap, settings]);

  const fillExample = (type: 'leader' | 'member' | 'guest') => {
    if (type === 'leader') setLeaderInput('張房長, 金融服務\n林房長, 設計工程\n陳房長, 媒體行銷');
    if (type === 'member') setMemberInput('王會員, 法律顧問\n趙會員, 室內設計\n孫會員, 數位行銷');
    if (type === 'guest') setGuestInput('李來賓, 會計師\n周來賓, 水電工程\n吳來賓, 攝影錄影\n鄭來賓, 餐廳');
  };

  const handleDragStart = (person: Person, sourceRoomId: string) => {
    setDraggedItem({ person, sourceRoomId });
  };

  const handleDrop = (targetRoomId: string) => {
    if (!draggedItem || draggedItem.sourceRoomId === targetRoomId) return;

    const { person, sourceRoomId } = draggedItem;
    
    setRooms(prevRooms => {
      const newRooms = prevRooms.map(room => ({
        ...room,
        members: [...room.members],
        guests: [...room.guests],
        conflicts: [...room.conflicts],
        synergies: [...room.synergies]
      }));

      const sourceRoom = newRooms.find(r => r.id === sourceRoomId);
      const targetRoom = newRooms.find(r => r.id === targetRoomId);

      if (sourceRoom && targetRoom) {
        if (person.role === Role.GUEST) {
          sourceRoom.guests = sourceRoom.guests.filter(p => p.id !== person.id);
        } else {
          sourceRoom.members = sourceRoom.members.filter(p => p.id !== person.id);
        }

        if (person.role === Role.GUEST) {
          targetRoom.guests.push(person);
        } else {
          targetRoom.members.push(person);
        }

        const updatedSource = updateRoomTags(sourceRoom, parsedSynergyMap);
        const updatedTarget = updateRoomTags(targetRoom, parsedSynergyMap);

        const sourceIdx = newRooms.findIndex(r => r.id === sourceRoomId);
        const targetIdx = newRooms.findIndex(r => r.id === targetRoomId);
        newRooms[sourceIdx] = updatedSource;
        newRooms[targetIdx] = updatedTarget;
      }

      return newRooms;
    });

    setDraggedItem(null);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 text-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-8 py-4 sticky top-0 z-50 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20"><LayoutGrid className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase text-white">Chamber Navigator</h1>
            <p className="text-[10px] text-slate-400 font-bold">商會分組導航系統 v2.4</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all text-white">投影模式</button>
          <button onClick={handleGrouping} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 text-white">
            <RefreshCcw className="w-4 h-4" /> 執行分組
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Settings Panel */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 mb-8 overflow-hidden no-print">
          <button 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="w-full p-6 flex justify-between items-center bg-slate-50 border-b hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2 font-black text-slate-700 uppercase tracking-tighter">
              <Settings className="w-5 h-5 text-indigo-500" /> 數據導入與邏輯設定
            </div>
            {isConfigOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
          </button>
          
          {isConfigOpen && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Inputs Column */}
                <div className="space-y-6">
                  {/* Leader Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500"/> 房長/產業
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => fillExample('leader')} className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"><FileText className="w-3 h-3"/>範例</button>
                        <button onClick={() => setLeaderInput('')} className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5"><Trash2 className="w-3 h-3"/>清除</button>
                      </div>
                    </div>
                    <textarea 
                      className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                      placeholder="姓名, 產業"
                      value={leaderInput}
                      onChange={(e) => setLeaderInput(e.target.value)}
                    />
                  </div>

                  {/* Member Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-emerald-500"/> 會員/產業
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => fillExample('member')} className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"><FileText className="w-3 h-3"/>範例</button>
                        <button onClick={() => setMemberInput('')} className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5"><Trash2 className="w-3 h-3"/>清除</button>
                      </div>
                    </div>
                    <textarea 
                      className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm"
                      placeholder="姓名, 產業"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                    />
                  </div>

                  {/* Guest Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-500"/> 來賓/產業
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => fillExample('guest')} className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"><FileText className="w-3 h-3"/>範例</button>
                        <button onClick={() => setGuestInput('')} className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5"><Trash2 className="w-3 h-3"/>清除</button>
                      </div>
                    </div>
                    <textarea 
                      className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none shadow-sm"
                      placeholder="姓名, 產業"
                      value={guestInput}
                      onChange={(e) => setGuestInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Synergy Map */}
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3 text-rose-500"/> 產業對接庫</label>
                  <p className="text-[10px] text-slate-400">系統將優先將「對接產業」分配至同一房間。</p>
                  <textarea 
                    className="w-full h-[450px] p-3 bg-rose-50/20 border border-rose-100 rounded-xl text-xs font-mono text-slate-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all shadow-inner"
                    value={synergyInput}
                    onChange={(e) => setSynergyInput(e.target.value)}
                  />
                </div>

                {/* Algorithm Settings */}
                <div className="space-y-6">
                  <label className="text-xs font-black text-slate-500 uppercase">3. 房間配置</label>
                  
                  <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-3">
                      <span className="text-sm font-bold text-slate-700 block">產業重複規則</span>
                      <div className="flex p-1 bg-slate-200 rounded-lg">
                        <button 
                          onClick={() => setSettings({...settings, allowIndustryOverlap: false})}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!settings.allowIndustryOverlap ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          絕對避嫌
                        </button>
                        <button 
                          onClick={() => setSettings({...settings, allowIndustryOverlap: true})}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settings.allowIndustryOverlap ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          允許重複
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-sm font-bold text-slate-700 block">每房建議名單數</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setSettings({...settings, targetAssigneesPerRoom: 3})}
                          className={`py-3 rounded-xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${settings.targetAssigneesPerRoom === 3 ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                        >
                          <span className="text-xl">3 人</span>
                          <span className="text-[10px] opacity-60">1 房長 + 3 名單</span>
                        </button>
                        <button 
                          onClick={() => setSettings({...settings, targetAssigneesPerRoom: 4})}
                          className={`py-3 rounded-xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${settings.targetAssigneesPerRoom === 4 ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                        >
                          <span className="text-xl">4 人</span>
                          <span className="text-[10px] opacity-60">1 房長 + 4 名單</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleGrouping}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-5 h-5" /> 產生分組結果
                  </button>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase mb-1">目前統計</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="text-slate-600">房長：<span className="text-indigo-600">{parsedLeaders.length}</span></div>
                      <div className="text-slate-600">會員：<span className="text-emerald-600">{parsedMembers.length}</span></div>
                      <div className="text-slate-600">來賓：<span className="text-amber-600">{parsedGuests.length}</span></div>
                      <div className="text-slate-600">待分配：<span className="text-slate-900">{parsedMembers.length + parsedGuests.length}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {rooms.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Stats stats={stats} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room, idx) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  synergyMap={parsedSynergyMap}
                  index={idx}
                  onDragStart={handleDragStart} 
                  onDrop={handleDrop}
                />
              ))}
            </div>
            
            <div className="flex justify-center gap-4 no-print pb-20">
              <button className="px-8 py-3 bg-white border border-slate-200 rounded-full font-bold flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <Copy className="w-4 h-4" /> 複製文字
              </button>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-colors">
                <Download className="w-4 h-4" /> 匯出 CSV 報告
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {rooms.length === 0 && !isConfigOpen && (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="bg-slate-200/50 p-6 rounded-full mb-4">
              <Users className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-slate-500 font-bold">尚未執行分組</h3>
            <p className="text-slate-400 text-sm">請點擊上方的設定面板填寫名單後執行。</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
