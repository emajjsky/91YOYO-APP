import { create } from 'zustand';

interface UserInfo {
  uid: string;
  nickname: string;
  avatarUrl: number | string;
  city: string;
  bio: string;
  followingCount: number;
  followersCount: number;
  gearsCount: number;
}

interface UserState {
  userInfo: UserInfo;
  setUserInfo: (info: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: {
    uid: 'u_self',
    nickname: '我的球友空间',
    avatarUrl: require('../../assets/mock/social/yoyo-blue.jpg') as number,
    city: '上海',
    bio: '爱悠悠球，爱生活。',
    followingCount: 52,
    followersCount: 138,
    gearsCount: 7,
  },
  setUserInfo: (info) =>
    set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
}));
