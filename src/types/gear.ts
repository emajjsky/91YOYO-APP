// 迁移自 src/types/gear.d.ts
export type GearStatus = 'FOR_SALE' | 'SOLD' | 'RESERVED';

export interface IYoyoMarketItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  brand: string;
  modelName: string;
  structure: string;
  bearing: string;
  price: number;
  originalPrice: number;
  grade: 'S' | 'A' | 'B' | 'C';
  gradeDesc: string;
  images: string[];
  hasMacroVideo: boolean;
  locationCity: string;
  status: GearStatus;
  createdAt: string;
}
