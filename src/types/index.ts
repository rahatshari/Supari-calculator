export type AppView = 'home' | 'kacha-paka' | 'shukno' | 'kroy-khata';

export interface KachaItem {
  id?: number;
  kuri: number;
  gha: number;
  ti: number;
  totalTi: number;
  totalKuri: number;
  rate: number;
  ghaRate: number;
  totalPrice: number;
  qtyString: string;
}

export interface KachaHistoryRecord {
  id: number;
  title: string;
  date: string;
  items: KachaItem[];
  rule: number;
  totalPrice: string;
}

export interface ShuknoHistoryRecord {
  id: number;
  title: string;
  date: string;
  bags: number[];
  rule: number;
  pricePerHajar: string;
  emptyBagKg: number;
  totalPrice: string;
}

export interface KroyEntry {
  id: number;
  time: string;
  seller: string;
  type: 'kacha' | 'shukno';
  qtyText: string;
  kuri?: number;
  bags?: number;
  weightKg?: number;
  rule: number;
  ruleText?: string;
  hajarShotokText?: string;
  rate: number;
  rateText?: string;
  totalPrice: number;
}

export type KroyDatabase = Record<string, KroyEntry[]>;

export interface PendingKroyItem {
  type: 'kacha' | 'shukno';
  qtyText: string;
  kuri?: number;
  bags?: number;
  weightKg?: number;
  rule: number;
  ruleText: string;
  hajarShotokText?: string;
  rate: number;
  rateText: string;
  totalPrice: number;
}
