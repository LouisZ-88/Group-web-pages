
import { Person, Role, Room, GroupingSettings, SynergyMapEntry } from '../types';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 重新計算單個房間的衝突與對接標記
 */
export function updateRoomTags(room: Room, synergyMap: Record<string, SynergyMapEntry>): Room {
  const allInRoom = [room.leader, ...room.members, ...room.guests];
  const entries = Object.values(synergyMap);
  const conflicts: string[] = [];
  const synergies: string[] = [];

  allInRoom.forEach(p1 => {
    const p1Industry = p1.industry.trim().toLowerCase();
    
    // 衝突檢查
    const isConflicted = allInRoom.some(p2 => 
      p1.id !== p2.id && p2.industry.trim().toLowerCase() === p1Industry
    );
    if (isConflicted) conflicts.push(p1.id);

    // 對接檢查 (大分類關鍵字匹配)
    // 1. 找出 p1 屬於哪個大分類
    const p1Entry = entries.find(e => e.keywords.some(kw => p1Industry.includes(kw) || kw.includes(p1Industry)));
    
    if (p1Entry) {
      const isSynergized = allInRoom.some(p2 => {
        if (p1.id === p2.id) return false;
        const p2Industry = p2.industry.trim().toLowerCase();
        
        // 2. 檢查 p2 是否屬於 p1Entry 指定的可合作大分類，或者 p2 直接命中 p1 的關鍵字
        // (1) p2 本身就是 p1 關鍵字之一
        const directMatch = p1Entry.keywords.some(kw => p2Industry.includes(kw) || kw.includes(p2Industry));
        if (directMatch) return true;

        // (2) p2 屬於 p1Entry.targetCategories 中的某個大分類
        const p2Entry = entries.find(e => e.keywords.some(kw => p2Industry.includes(kw) || kw.includes(p2Industry)));
        return p2Entry && p1Entry.targetCategories.includes(p2Entry.category);
      });
      
      if (isSynergized) synergies.push(p1.id);
    }
  });

  return { ...room, conflicts, synergies };
}

export function groupPeople(
  leaders: Person[],
  assignees: Person[],
  settings: GroupingSettings
): Room[] {
  // 1. 分離人員
  const guests = shuffle(assignees.filter(p => p.role === Role.GUEST));
  const members = shuffle(assignees.filter(p => p.role === Role.MEMBER));
  const availableLeaders = shuffle([...leaders]);
  const synergyMap = settings.industrySynergyMap;
  const entries = Object.values(synergyMap);
  
  // 每房固定 1 房長 + 1 來賓 + (3~4) 會員
  // 所以一間房理想人數是 5~6 人
  const MAX_MEMBERS_PER_ROOM = 4;
  const MIN_MEMBERS_PER_ROOM = 3;

  // 2. 確定房間數量：以來賓與房長數量中較小者為準
  let roomCount = Math.min(guests.length, availableLeaders.length);

  // 如果無人可分，全進大廳
  if (roomCount === 0) {
    const lobby: Room = {
      id: 'lobby',
      leader: availableLeaders[0] || { id: 'system', name: '主持人', industry: '商會營運', role: Role.LEADER },
      members: availableLeaders.length > 1 ? [...availableLeaders.slice(1), ...members] : members,
      guests: guests,
      conflicts: [],
      synergies: []
    };
    return [updateRoomTags(lobby, synergyMap)];
  }

  // 3. 初始化房間 (分配 1 房長 + 1 來賓)
  const rooms: Room[] = [];
  for (let i = 0; i < roomCount; i++) {
    rooms.push({
      id: `room-${i + 1}`,
      leader: availableLeaders[i],
      members: [],
      guests: [guests[i]],
      conflicts: [],
      synergies: []
    });
  }

  let unplacedMembers = [...members];
  const remainingLeaders = availableLeaders.slice(roomCount);
  const remainingGuests = guests.slice(roomCount);

  // 4. 分配會員 (每房 3~4 位，商機優先)
  // 先嘗試為每間房找 3 位會員
  for (let round = 0; round < MAX_MEMBERS_PER_ROOM; round++) {
    rooms.forEach(room => {
      if (unplacedMembers.length === 0) return;
      if (room.members.length >= MAX_MEMBERS_PER_ROOM) return;
      
      // 在第一輪與第二輪（前 3 人）盡量找有商機的
      if (room.members.length < MIN_MEMBERS_PER_ROOM || round < MAX_MEMBERS_PER_ROOM) {
        const guest = room.guests[0];
        let bestIdx = -1;
        let highestScore = -Infinity;

        unplacedMembers.forEach((m, idx) => {
          let score = 0;
          const mInd = m.industry.trim().toLowerCase();
          
          // 衝突檢查
          const hasConflict = [room.leader, ...room.members, ...room.guests].some(p => 
            p.industry.trim().toLowerCase() === mInd
          );
          if (hasConflict && !settings.allowIndustryOverlap) {
            score = -999;
          } else {
            // 商機評分
            const mEntry = entries.find(e => e.keywords.some(kw => mInd.includes(kw) || kw.includes(mInd)));
            const gInd = guest.industry.trim().toLowerCase();
            const gEntry = entries.find(e => e.keywords.some(kw => gInd.includes(kw) || kw.includes(gInd)));
            
            if (mEntry && gEntry) {
              if (mEntry.targetCategories.includes(gEntry.category) || mEntry.keywords.some(kw => gInd.includes(kw) || kw.includes(gInd))) score += 500;
              if (gEntry.targetCategories.includes(mEntry.category) || gEntry.keywords.some(kw => mInd.includes(kw) || kw.includes(mInd))) score += 300;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestIdx = idx;
          }
        });

        if (bestIdx !== -1 && (highestScore > 0 || room.members.length < MIN_MEMBERS_PER_ROOM)) {
          room.members.push(unplacedMembers.splice(bestIdx, 1)[0]);
        }
      }
    });
  }

  // 5. 聯誼大廳
  const lobby: Room = {
    id: 'lobby',
    leader: remainingLeaders[0] || { id: 'lobby-host', name: '大廳主持人', industry: '商會營運', role: Role.LEADER },
    members: [...remainingLeaders.slice(1), ...unplacedMembers],
    guests: remainingGuests,
    conflicts: [],
    synergies: []
  };

  return [...rooms, lobby].map(r => updateRoomTags(r, synergyMap));
}

export function parseInput(text: string, defaultRole: Role): Person[] {
  if (!text.trim()) return [];
  return text.split('\n').map(line => line.trim()).filter(l => l).map((line, idx) => {
    // 支援多種分隔符號：英文逗號、中文逗號、Tab
    const parts = line.split(/[，,\t]/).map(p => p.trim());
    const name = parts[0] || `未命名-${idx}`;
    const industry = parts[1] || '一般';
    let role = defaultRole;
    if (parts[2]) {
      if (parts[2].includes('來賓')) role = Role.GUEST;
      else if (parts[2].includes('會員')) role = Role.MEMBER;
    }
    return { id: Math.random().toString(36).substr(2, 9), name, industry, role };
  });
}

export function parseSynergyMap(text: string): Record<string, SynergyMapEntry> {
  const map: Record<string, SynergyMapEntry> = {};
  text.split('\n').forEach(line => {
    const parts = line.split(/[|｜]/).map(s => s?.trim());
    if (parts.length < 2) return;
    
    const category = parts[0];
    const keywords = parts[1].split(/[，,]/).map(v => v.trim()).filter(v => v);
    const opportunities = (parts[2] || '').split(/[，,]/).map(v => v.trim()).filter(v => v);
    const targetCategories = (parts[3] || '').split(/[，,]/).map(v => v.trim()).filter(v => v);
    
    keywords.forEach(kw => {
      map[kw] = {
        category,
        keywords,
        opportunities,
        targetCategories
      };
    });
  });
  return map;
}
