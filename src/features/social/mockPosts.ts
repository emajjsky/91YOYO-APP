import type { MediaContent, SocialPost } from './types';

const imageAssets = {
  blue: require('../../../assets/mock/social/yoyo-blue.jpg') as number,
  bearing: require('../../../assets/mock/social/yoyo-bearing.jpg') as number,
  contestOne: require('../../../assets/mock/social/contest-indiana-01.jpg') as number,
  contestTwo: require('../../../assets/mock/social/contest-indiana-02.jpg') as number,
  practice: require('../../../assets/mock/social/practice-hybl.jpg') as number,
  history: require('../../../assets/mock/social/history-molenaar.jpg') as number,
  national: require('../../../assets/mock/social/contest-national-1a.jpg') as number,
  idaho: require('../../../assets/mock/social/practice-idaho.jpg') as number,
  champion: require('../../../assets/mock/social/champion-janos.jpg') as number,
  threeA: require('../../../assets/mock/social/practice-3a.jpg') as number,
  trickPoster: require('../../../assets/mock/social/video-yoyo-trick-poster.jpg') as number,
};

const videoAssets = {
  trick: require('../../../assets/mock/social/video-yoyo-trick.mp4') as number,
};

const audioAssets = {
  cleanSteps: require('../../../assets/mock/social/track-clean-steps.wav') as number,
  speedCombo: require('../../../assets/mock/social/track-speed-combo.wav') as number,
  nightSession: require('../../../assets/mock/social/track-night-session.wav') as number,
};

const noMedia: MediaContent = { type: 'none' };

function images(id: string, ...items: { uri: number; aspectRatio: number; alt: string }[]): MediaContent {
  return {
    type: 'images',
    assets: items.map((item, index) => ({ id: `${id}-${index + 1}`, ...item })),
  };
}

function reservedVideo(id: string, title: string, posterUri: number, aspectRatio: number): MediaContent {
  return {
    type: 'video',
    asset: {
      id,
      playbackStatus: 'reserved',
      posterUri,
      durationSeconds: null,
      aspectRatio,
      title,
    },
  };
}

function readyVideo(
  id: string,
  title: string,
  uri: number,
  posterUri: number,
  aspectRatio: number,
  durationSeconds: number,
): MediaContent {
  return {
    type: 'video',
    asset: { id, playbackStatus: 'ready', uri, posterUri, durationSeconds, aspectRatio, title },
  };
}

function audio(
  id: string,
  uri: number,
  coverUri: number,
  title: string,
  artist: string,
  bpm: number,
  durationSeconds: number,
): MediaContent {
  return { type: 'audio', asset: { id, uri, coverUri, title, artist, bpm, durationSeconds } };
}

type PostSeed = Omit<SocialPost, 'likeCount' | 'commentCount' | 'shareCount' | 'viewCount'> & {
  engagement: readonly [likeCount: number, commentCount: number, shareCount: number, viewCount: number];
};

const postSeeds: PostSeed[] = [
  {
    id: 'post-contest-final-runthrough', authorId: 'user-chen', content: '竖屏记录一段短招，重点看收球前手腕如何回到身体中线。', category: 'contest', styleTags: ['1A'], hashtags: ['#1A', '#短招记录'], createdAt: '2026-09-15T12:00:00.000Z', media: readyVideo('video-001', '竖屏短招记录', videoAssets.trick, imageAssets.trickPoster, 9 / 16, 1.45), engagement: [5200, 348, 612, 125000], visibility: 'public',
  },
  {
    id: 'post-tutorial-5a-direction-change', authorId: 'user-xiaoyu', content: '公开赛动作影像可以用来观察换向时的手腕路径，再把练习幅度逐步放大。', category: 'tutorial', styleTags: ['5A'], hashtags: ['#5A', '#基础教学'], createdAt: '2026-09-15T10:30:00.000Z', media: reservedVideo('video-002', '5A 换向慢动作', imageAssets.idaho, 1.03), engagement: [1840, 126, 208, 48200], visibility: 'public',
  },
  {
    id: 'post-editorial-2a-contest-loop', authorId: 'user-mori', content: '这组赛场影像记录了选手热身时反复确认循环节奏的过程。', category: 'contest', styleTags: ['2A'], hashtags: ['#2A', '#赛事影像'], createdAt: '2026-09-15T08:45:00.000Z', media: reservedVideo('video-003', '双手循环练习', imageAssets.national, 0.85), engagement: [720, 64, 31, 16900], visibility: 'public',
  },
  {
    id: 'post-tutorial-4a-catch-height', authorId: 'user-zhou', content: '公开比赛影像显示，稳定的视线高度比一味增加抛接高度更容易读球。', category: 'tutorial', styleTags: ['4A'], hashtags: ['#4A', '#抛接'], createdAt: '2026-09-14T16:20:00.000Z', media: reservedVideo('video-004', '4A 抛接高度对比', imageAssets.threeA, 0.72), engagement: [1330, 91, 177, 35100], visibility: 'public',
  },
  {
    id: 'post-editorial-3a-recovery', authorId: 'user-aiko', content: '赛事后台影像中的失误处理说明，恢复动作也值得作为独立训练项目。', category: 'contest', styleTags: ['3A'], hashtags: ['#3A', '#失误恢复'], createdAt: '2026-09-14T09:10:00.000Z', media: reservedVideo('video-005', '3A 错位恢复', imageAssets.champion, 0.67), engagement: [411, 37, 19, 9600], visibility: 'followers',
  },
  {
    id: 'post-editorial-beginner-meetup', authorId: 'user-maya', content: '这张公开赛后台影像可作为新手聚会划分练习区与通行区的参考案例。', category: 'meetup', styleTags: ['1A'], hashtags: ['#聚会组织', '#新手友好'], createdAt: '2026-09-13T11:40:00.000Z', media: reservedVideo('video-006', '聚会场地预览', imageAssets.contestTwo, 1.5), engagement: [286, 58, 73, 7800], visibility: 'public',
  },
  {
    id: 'post-event-city-open-registration', authorId: 'user-tao', content: '城市公开赛报名进入最后一周，历史赛事图片用于介绍项目沿革，最新时间表已经更新。', category: 'event_news', styleTags: ['1A', '5A'], hashtags: ['#赛事资讯', '#公开赛'], createdAt: '2026-09-12T14:00:00.000Z', media: reservedVideo('video-007', '公开赛预告', imageAssets.history, 0.66), engagement: [950, 44, 301, 22800], visibility: 'public',
  },
  {
    id: 'post-product-response-prototype', authorId: 'user-qi', content: '新回收系统样件的响应更直接，正式体验前还要继续做耐久测试。', category: 'product', styleTags: ['1A', '4A'], hashtags: ['#产品资讯', '#器材测试'], createdAt: '2026-09-11T06:30:00.000Z', media: reservedVideo('video-008', '回收系统样件', imageAssets.bearing, 1.71), engagement: [365, 82, 26, 11200], visibility: 'public',
  },
  {
    id: 'post-music-speed-combo', authorId: 'user-leo', content: '给速度连招剪了一段 128 拍的练习节奏，重音刚好落在换手位置。', category: 'music', styleTags: ['5A'], hashtags: ['#悠悠球音乐', '#速度节拍'], createdAt: '2026-09-10T13:15:00.000Z', media: audio('audio-001', audioAssets.speedCombo, imageAssets.blue, '极速连招', '李欧', 128, 10), engagement: [862, 54, 119, 19400], visibility: 'public',
  },
  {
    id: 'post-music-clean-steps', authorId: 'user-chen', content: '92 拍适合把新连招拆成四拍一段，先保证每个停顿都清楚。', category: 'music', styleTags: ['1A'], hashtags: ['#练习音乐', '#节拍'], createdAt: '2026-09-09T07:50:00.000Z', media: audio('audio-002', audioAssets.cleanSteps, imageAssets.bearing, '清晰节拍', '陈弦', 92, 8), engagement: [516, 33, 64, 12800], visibility: 'public',
  },
  {
    id: 'post-music-night-session', authorId: 'user-nora', content: '夜练不追速度，用一段慢拍把每次抛接的等待时间拉出来。', category: 'music', styleTags: ['4A'], hashtags: ['#夜练', '#慢速节拍'], createdAt: '2026-09-08T15:25:00.000Z', media: audio('audio-003', audioAssets.nightSession, imageAssets.blue, '夜间练习', '诺拉', 76, 12), engagement: [274, 19, 22, 6900], visibility: 'public',
  },
  {
    id: 'post-music-5a-rhythm', authorId: 'user-xiaoyu', content: '同一段慢拍分别练自由手内圈和外圈，切换时会轻松很多。', category: 'music', styleTags: ['5A'], hashtags: ['#5A', '#节奏练习'], createdAt: '2026-09-07T09:30:00.000Z', media: audio('audio-004', audioAssets.cleanSteps, imageAssets.blue, '清晰节拍', '陈弦', 92, 8), engagement: [493, 41, 52, 11700], visibility: 'public',
  },
  {
    id: 'post-music-2a-tempo', authorId: 'user-mori', content: '双手循环跟 128 拍容易抢拍，降速以后反而能听见左右手差异。', category: 'music', styleTags: ['2A'], hashtags: ['#2A', '#节奏'], createdAt: '2026-09-06T04:10:00.000Z', media: audio('audio-005', audioAssets.speedCombo, imageAssets.bearing, '极速连招', '李欧', 128, 10), engagement: [188, 15, 11, 4200], visibility: 'public',
  },
  {
    id: 'post-music-3a-review', authorId: 'user-aiko', content: '把三球练习录在慢拍上，回看时更容易定位是谁先偏离轨道。', category: 'music', styleTags: ['3A'], hashtags: ['#3A', '#慢拍'], createdAt: '2026-09-05T12:45:00.000Z', media: audio('audio-006', audioAssets.nightSession, imageAssets.bearing, '夜间练习', '诺拉', 76, 12), engagement: [137, 12, 8, 3500], visibility: 'followers',
  },
  {
    id: 'post-tutorial-bearing-maintenance', authorId: 'user-qi', content: '拆开后可以清楚看到轴承与回收系统的配合，清洁时不要让溶剂碰到胶贴。', category: 'tutorial', styleTags: ['1A'], hashtags: ['#器材维护', '#轴承'], createdAt: '2026-09-04T08:00:00.000Z', media: images('images-001', { uri: imageAssets.bearing, aspectRatio: 1.71, alt: '拆开的悠悠球与中央轴承结构' }), engagement: [1100, 96, 280, 33700], visibility: 'public',
  },
  {
    id: 'post-history-indiana-contest', authorId: 'user-tao', content: '四张现场照记录了参赛者热身、交流、上台和夺冠的不同瞬间。', category: 'contest', styleTags: ['1A'], hashtags: ['#赛事影像', '#悠悠球比赛'], createdAt: '2026-09-15T11:30:00.000Z', media: images('images-002', { uri: imageAssets.national, aspectRatio: 0.85, alt: '全美悠悠球比赛选手动作照片' }, { uri: imageAssets.champion, aspectRatio: 0.67, alt: '世界悠悠球冠军现场照片' }, { uri: imageAssets.idaho, aspectRatio: 1.03, alt: '选手近距离练习悠悠球' }, { uri: imageAssets.threeA, aspectRatio: 0.72, alt: '3A 双球动作练习' }), engagement: [2430, 164, 510, 68200], visibility: 'public',
  },
  {
    id: 'post-daily-first-metal-yoyo', authorId: 'user-lin', content: '第一颗金属球到手后拍的照片。现在看划痕也很有纪念意义。', category: 'daily', styleTags: ['1A'], hashtags: ['#我的第一颗球', '#1A'], createdAt: '2026-08-31T13:35:00.000Z', media: images('images-003', { uri: imageAssets.blue, aspectRatio: 1, alt: '蓝色金属悠悠球俯拍照片' }), engagement: [94, 18, 3, 1800], visibility: 'public',
  },
  {
    id: 'post-history-stage-composition', authorId: 'user-nora', content: '这张 1970 年冠军影像记录了早期赛事展示动作与舞台背景的构图。', category: 'event_news', styleTags: ['4A'], hashtags: ['#悠悠球历史', '#舞台编排'], createdAt: '2026-08-29T06:15:00.000Z', media: images('images-004', { uri: imageAssets.history, aspectRatio: 0.66, alt: '经典悠悠球比赛黑白照片' }), engagement: [302, 27, 24, 7200], visibility: 'public',
  },
  {
    id: 'post-editorial-2a-arm-angle', authorId: 'user-wen', content: '公开比赛动作图中的手臂角度可用于讲解循环训练常见的偏移问题。', category: 'tutorial', styleTags: ['2A'], hashtags: ['#2A新手', '#练习复盘'], createdAt: '2026-08-26T12:00:00.000Z', media: images('images-005', { uri: imageAssets.practice, aspectRatio: 1.5, alt: '悠悠球选手在场地中练习' }), engagement: [83, 24, 5, 2100], visibility: 'public',
  },
  {
    id: 'post-event-community-meetup-archive', authorId: 'user-maya', content: '2008 年赛事后台影像记录了参赛者共享练习空间的现场组织方式。', category: 'event_news', styleTags: ['1A', '2A'], hashtags: ['#活动档案', '#场地组织'], createdAt: '2026-08-23T03:40:00.000Z', media: images('images-006', { uri: imageAssets.contestOne, aspectRatio: 1.5, alt: '悠悠球赛事后台练习场景' }), engagement: [221, 61, 48, 5700], visibility: 'public',
  },
  {
    id: 'post-product-spin-cleaning', authorId: 'user-qi', content: '清洁和测试过程整理成六张图，左右滑动可以依次查看每个步骤。', category: 'product', styleTags: ['1A'], hashtags: ['#器材测试', '#保养'], createdAt: '2026-09-15T11:15:00.000Z', media: images('images-007', { uri: imageAssets.blue, aspectRatio: 1, alt: '蓝色悠悠球外观' }, { uri: imageAssets.bearing, aspectRatio: 1.71, alt: '悠悠球轴承内部结构' }, { uri: imageAssets.idaho, aspectRatio: 1.03, alt: '清洁前的回转测试' }, { uri: imageAssets.national, aspectRatio: 0.85, alt: '清洁后的动作测试' }, { uri: imageAssets.champion, aspectRatio: 0.67, alt: '不同回转状态对比' }, { uri: imageAssets.threeA, aspectRatio: 0.72, alt: '器材维护后的动作记录' }), engagement: [472, 77, 89, 13400], visibility: 'public',
  },
  {
    id: 'post-event-equipment-meetup', authorId: 'user-tao', content: '本月器材交流会增加了拆解台，请自带收纳盒并给零件做标记。', category: 'event_news', styleTags: ['1A', '4A'], hashtags: ['#活动通知', '#器材交流'], createdAt: '2026-08-17T14:30:00.000Z', media: images('images-008', { uri: imageAssets.bearing, aspectRatio: 1.71, alt: '拆开的悠悠球和轴承零件' }), engagement: [319, 46, 104, 8800], visibility: 'public',
  },
  {
    id: 'post-tutorial-shoulder-tension', authorId: 'user-chen', content: '公开赛动作影像可以辅助讲解肩膀紧张如何影响手臂路径与落点。', category: 'tutorial', styleTags: ['1A', '3A'], hashtags: ['#动作检查', '#基础训练'], createdAt: '2026-08-14T05:45:00.000Z', media: images('images-009', { uri: imageAssets.practice, aspectRatio: 1.5, alt: '选手在比赛场地进行悠悠球动作' }), engagement: [641, 53, 77, 15500], visibility: 'public',
  },
  {
    id: 'post-contest-catch-preparation', authorId: 'user-zhou', content: '比赛照片里最值得研究的是接球前一拍：选手视线已经先落到预定位置。', category: 'contest', styleTags: ['4A'], hashtags: ['#4A', '#比赛复盘'], createdAt: '2026-08-10T11:10:00.000Z', media: images('images-010', { uri: imageAssets.contestTwo, aspectRatio: 1.5, alt: '悠悠球比赛现场动作照片' }), engagement: [903, 68, 120, 24400], visibility: 'public',
  },
  {
    id: 'post-daily-blue-stage-light', authorId: 'user-leo', content: '蓝色球在舞台冷光下很醒目，下一套动作准备把音乐也收得更干净。', category: 'daily', styleTags: ['5A'], hashtags: ['#舞台测试', '#5A'], createdAt: '2026-08-06T15:20:00.000Z', media: images('images-011', { uri: imageAssets.blue, aspectRatio: 1, alt: '蓝色金属悠悠球产品照片' }), engagement: [578, 32, 55, 14300], visibility: 'public',
  },
  {
    id: 'post-history-contest-spacing', authorId: 'user-nora', content: '用九张赛场组图对照观众区、热身区和表演区，能看出活动空间如何逐步变化。', category: 'event_news', styleTags: ['1A', '4A'], hashtags: ['#悠悠球历史', '#赛场观察'], createdAt: '2026-09-15T11:00:00.000Z', media: images('images-012', { uri: imageAssets.history, aspectRatio: 0.66, alt: '早期悠悠球比赛黑白照片' }, { uri: imageAssets.contestOne, aspectRatio: 1.5, alt: '现代悠悠球比赛现场照片' }, { uri: imageAssets.contestTwo, aspectRatio: 1.5, alt: '比赛现场的观众区域' }, { uri: imageAssets.practice, aspectRatio: 1.5, alt: '选手动作与舞台距离' }, { uri: imageAssets.blue, aspectRatio: 1, alt: '参赛悠悠球细节' }, { uri: imageAssets.bearing, aspectRatio: 1.71, alt: '比赛器材结构细节' }, { uri: imageAssets.contestTwo, aspectRatio: 1.5, alt: '热身区域空间记录' }, { uri: imageAssets.practice, aspectRatio: 1.5, alt: '表演区域空间记录' }, { uri: imageAssets.blue, aspectRatio: 1, alt: '活动器材展示记录' }), engagement: [1280, 102, 231, 39200], visibility: 'public',
  },
  {
    id: 'post-tutorial-string-mounts', authorId: 'user-chen', content: '今天只练挂线，不追求整套连招。连续十次稳定比偶尔一次完整更有用。', category: 'tutorial', styleTags: ['1A'], hashtags: ['#1A', '#基本功'], createdAt: '2026-07-31T04:50:00.000Z', media: noMedia, engagement: [208, 21, 17, 5100], visibility: 'public',
  },
  {
    id: 'post-daily-5a-day-seven', authorId: 'user-lin', content: '5A 第七天：能接住的次数还是少，但已经不再害怕配重块飞出去。', category: 'daily', styleTags: ['5A'], hashtags: ['#5A入门', '#练习日记'], createdAt: '2026-07-29T12:10:00.000Z', media: noMedia, engagement: [61, 14, 2, 1200], visibility: 'followers',
  },
  {
    id: 'post-tutorial-2a-string-length', authorId: 'user-mori', content: '2A 循环卡住时先检查两边绳长，差一小段也会把节奏越带越偏。', category: 'tutorial', styleTags: ['2A'], hashtags: ['#2A', '#新手答疑'], createdAt: '2026-07-28T07:30:00.000Z', media: noMedia, engagement: [187, 35, 14, 4600], visibility: 'public',
  },
  {
    id: 'post-daily-3a-symmetry', authorId: 'user-aiko', content: '3A 今天的目标是左右各做五十次同样的挂线，不把惯用手当捷径。', category: 'daily', styleTags: ['3A'], hashtags: ['#3A', '#对称训练'], createdAt: '2026-07-27T09:00:00.000Z', media: noMedia, engagement: [45, 8, 1, 940], visibility: 'public',
  },
  {
    id: 'post-meetup-4a-safety-zone', authorId: 'user-zhou', content: '4A 练习区需要更大的安全距离。本周聚会会单独划线，请大家不要穿行。', category: 'meetup', styleTags: ['4A'], hashtags: ['#4A', '#场地安全'], createdAt: '2026-07-26T01:20:00.000Z', media: noMedia, engagement: [154, 29, 47, 3900], visibility: 'public',
  },
  {
    id: 'post-product-5a-counterweight', authorId: 'user-xiaoyu', content: '自由手配重不是越重越稳，先找到自己能准确停住的重量再谈速度。', category: 'product', styleTags: ['5A'], hashtags: ['#配重选择', '#5A'], createdAt: '2026-07-25T13:45:00.000Z', media: noMedia, engagement: [402, 76, 52, 10800], visibility: 'public',
  },
  {
    id: 'post-event-volunteer-recruitment', authorId: 'user-tao', content: '公开赛志愿者招募开启，需要检录、舞台和新手体验区三个小组。', category: 'event_news', styleTags: ['1A', '5A'], hashtags: ['#志愿者', '#赛事资讯'], createdAt: '2026-07-24T03:15:00.000Z', media: noMedia, engagement: [278, 63, 91, 7400], visibility: 'public',
  },
  {
    id: 'post-tutorial-bearing-noise', authorId: 'user-qi', content: '轴承有异响先停下来检查，不要靠继续高速空转来碰运气。', category: 'tutorial', styleTags: ['1A', '4A'], hashtags: ['#轴承维护', '#安全'], createdAt: '2026-07-23T08:25:00.000Z', media: noMedia, engagement: [349, 42, 66, 9200], visibility: 'public',
  },
  {
    id: 'post-contest-2a-spectator-notes', authorId: 'user-wen', content: '第一次在线下见到完整 2A 表演，回家后把自己的练习目标改得更具体了。', category: 'contest', styleTags: ['2A'], hashtags: ['#2A', '#观赛记录'], createdAt: '2026-07-22T10:55:00.000Z', media: noMedia, engagement: [116, 17, 6, 2700], visibility: 'public',
  },
  {
    id: 'post-tutorial-speed-composition', authorId: 'user-leo', content: '速度连招不是每一拍都塞满，留一个呼吸点，观众反而更能看清重点。', category: 'tutorial', styleTags: ['3A', '5A'], hashtags: ['#编排', '#速度连招'], createdAt: '2026-07-21T15:05:00.000Z', media: noMedia, engagement: [533, 38, 70, 13900], visibility: 'public',
  },
  {
    id: 'post-meetup-4a-location-change', authorId: 'user-nora', content: '周末 4A 小组临时改到室内，报名人数不变，时间提前半小时。', category: 'meetup', styleTags: ['4A'], hashtags: ['#聚会变更', '#4A'], createdAt: '2026-07-21T05:40:00.000Z', media: noMedia, engagement: [72, 26, 19, 1900], visibility: 'public',
  },
  {
    id: 'post-product-beginner-yoyos', authorId: 'user-maya', content: '新手体验台新增了几颗响应更灵敏的练习球，现场可以直接借用。', category: 'product', styleTags: ['1A'], hashtags: ['#新手器材', '#聚会'], createdAt: '2026-07-20T13:20:00.000Z', media: noMedia, engagement: [129, 31, 21, 3300], visibility: 'public',
  },
  {
    id: 'post-daily-reset-day', authorId: 'user-lin', content: '今天没练成新招，只把绳子换了，整理好明天继续。', category: 'daily', styleTags: ['1A'], hashtags: ['#练习日常'], createdAt: '2026-07-20T08:10:00.000Z', media: noMedia, engagement: [8, 2, 0, 9], visibility: 'public',
  },
  {
    id: 'post-event-2a-registration', authorId: 'user-mori', content: '双手组报名确认邮件已发出，未收到的选手请在周五前联系主办方。', category: 'event_news', styleTags: ['2A'], hashtags: ['#比赛通知', '#2A'], createdAt: '2026-07-20T02:00:00.000Z', media: noMedia, engagement: [201, 18, 42, 4900], visibility: 'public',
  },
];

export const mockPosts: SocialPost[] = postSeeds.map(({ engagement, ...post }) => ({
  ...post,
  likeCount: engagement[0],
  commentCount: engagement[1],
  shareCount: engagement[2],
  viewCount: engagement[3],
}));
