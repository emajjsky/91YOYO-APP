import { create } from 'zustand';

interface UserInfo {
  uid: string;
  nickname: string;
  avatarUrl: string;
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
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    city: '上海',
    bio: '爱悠悠球，爱生活。',
    followingCount: 52,
    followersCount: 138,
    gearsCount: 7,
  },
  setUserInfo: (info) =>
    set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
}));
