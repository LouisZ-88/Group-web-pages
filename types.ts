
export enum Role {
  LEADER = '房長',
  MEMBER = '會員',
  GUEST = '來賓'
}

export interface Person {
  id: string;
  name: string;
  industry: string;
  role: Role;
}

export interface Room {
  id: string;
  leader: Person;
  members: Person[];
  guests: Person[];
  conflicts: string[]; // 產業衝突的人員 ID
  synergies: string[]; // 具備對接關係的人員 ID
}

export interface SynergyMapEntry {
  category: string;
  keywords: string[];
  opportunities: string[];
  targetCategories: string[];
}

export interface GroupingSettings {
  strictAvoidance: boolean;
  allowIndustryOverlap: boolean; // 是否允許產業重複
  targetAssigneesPerRoom: number; // 每個房間目標分配人數 (不含房長)
  industrySynergyMap: Record<string, SynergyMapEntry>; // 產業關鍵字 -> 對應分類資料
}

export interface Statistics {
  totalPeople: number;
  totalRooms: number;
  totalGuests: number;
  totalMembers: number;
  conflictCount: number;
  synergyCount: number;
}
