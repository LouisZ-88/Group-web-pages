
import { Person, Role, Room, GroupingSettings } from '../types';

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
export function updateRoomTags(room: Room, synergyMap: Record<string, string[]>): Room {
  const allInRoom = [room.leader, ...room.members, ...room.guests];
  const conflicts: string[] = [];
  const synergies: string[] = [];

  allInRoom.forEach(p1 => {
    // 衝突檢查
    const isConflicted = allInRoom.some(p2 => p1.id !== p2.id && p1.industry === p2.industry);
    if (isConflicted) conflicts.push(p1.id);

    // 對接檢查
    const syns = synergyMap[p1.industry] || [];
    const isSynergized = allInRoom.some(p2 => p1.id !== p2.id && syns.includes(p2.industry));
    if (isSynergized) synergies.push(p1.id);
  });

  return { ...room, conflicts, synergies };
}

export function groupPeople(
  leaders: Person[], 
  assignees: Person[], 
  settings: GroupingSettings
): Room[] {
  const rooms: Room[] = leaders.map((leader, index) => ({
    id: `room-${index}`,
    leader,
    members: [],
    guests: [],
    conflicts: [],
    synergies: []
  }));

  if (rooms.length === 0) return [];

  // 來賓優先，會員其次
  const guests = shuffle(assignees.filter(p => p.role === Role.GUEST));
  const members = shuffle(assignees.filter(p => p.role === Role.MEMBER));

  const placePerson = (person: Person) => {
    let bestRoomIndex = -1;
    let highestScore = -Infinity;

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const allInRoom = [room.leader, ...room.members, ...room.guests];
      
      const hasConflict = allInRoom.some(p => p.industry === person.industry);
      if (!settings.allowIndustryOverlap && hasConflict) continue;

      const currentAssigneeCount = room.members.length + room.guests.length;
      let score = 0;
      
      if (!hasConflict) score += 500;
      else if (settings.allowIndustryOverlap) score -= 100;

      const synergyList = settings.industrySynergyMap[person.industry] || [];
      const hasSynergy = allInRoom.some(p => synergyList.includes(p.industry));
      if (hasSynergy) score += 200;

      if (currentAssigneeCount < settings.targetAssigneesPerRoom) {
        score += (settings.targetAssigneesPerRoom - currentAssigneeCount) * 50;
      } else {
        score -= (currentAssigneeCount - settings.targetAssigneesPerRoom + 1) * 100;
      }

      if (score > highestScore) {
        highestScore = score;
        bestRoomIndex = i;
      }
    }

    if (bestRoomIndex === -1) {
      let minAssignees = Infinity;
      for (let i = 0; i < rooms.length; i++) {
        const count = rooms[i].members.length + rooms[i].guests.length;
        if (count < minAssignees) {
          minAssignees = count;
          bestRoomIndex = i;
        }
      }
    }

    const targetRoom = rooms[bestRoomIndex];
    if (person.role === Role.GUEST) {
      targetRoom.guests.push(person);
    } else {
      targetRoom.members.push(person);
    }
  };

  guests.forEach(placePerson);
  members.forEach(placePerson);

  // 最後統一計算所有房間的標記
  return rooms.map(room => updateRoomTags(room, settings.industrySynergyMap));
}

export function parseInput(text: string, defaultRole: Role): Person[] {
  if (!text.trim()) return [];
  return text.split('\n').map(line => line.trim()).filter(l => l).map((line, idx) => {
    const parts = line.split(/[,\t]/).map(p => p.trim());
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

export function parseSynergyMap(text: string): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  text.split('\n').forEach(line => {
    const [key, values] = line.split(/[:：]/).map(s => s?.trim());
    if (key && values) {
      map[key] = values.split(/[，,]/).map(v => v.trim());
    }
  });
  return map;
}
