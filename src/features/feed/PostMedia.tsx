import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Music2, Play } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import type { MediaContent } from '../social/types';
import { getImageGridLayout, getSingleImageAspectRatio } from './imageGridLayout';

function imageSource(uri: number | string): ImageSourcePropType {
  return typeof uri === 'number' ? uri : { uri };
}

function stopAndRun(callback: () => void) {
  return (event: GestureResponderEvent) => {
    event.stopPropagation();
    callback();
  };
}

function ImageMedia({ media, onOpen }: {
  media: Extract<MediaContent, { type: 'images' }>;
  onOpen(): void;
}) {
  const layout = getImageGridLayout(media.assets.length);
  const assets = media.assets.slice(0, layout.visibleCount);
  if (assets.length === 0) return null;
  if (assets.length === 1) {
    return (
      <Pressable accessibilityLabel="查看图片" accessibilityRole="imagebutton" onPress={stopAndRun(onOpen)}>
        <Image
          source={imageSource(assets[0].uri)}
          style={[styles.singleImage, { aspectRatio: getSingleImageAspectRatio(assets[0].aspectRatio) }]}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  const rows = Array.from({ length: layout.rows }, (_, rowIndex) =>
    assets.slice(rowIndex * layout.columns, (rowIndex + 1) * layout.columns),
  );

  return (
    <Pressable
      accessibilityLabel={`查看${assets.length}张图片`}
      accessibilityRole="imagebutton"
      onPress={stopAndRun(onOpen)}
      style={[styles.imageGrid, { aspectRatio: layout.columns / layout.rows }]}
    >
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.imageGridRow}>
          {row.map((asset) => (
            <Image key={asset.id} source={imageSource(asset.uri)} style={styles.gridImage} resizeMode="cover" />
          ))}
          {Array.from({ length: layout.columns - row.length }, (_, placeholderIndex) => (
            <View key={`placeholder-${placeholderIndex}`} style={styles.gridPlaceholder} />
          ))}
        </View>
      ))}
    </Pressable>
  );
}

function VideoMedia({ media, onOpen }: {
  media: Extract<MediaContent, { type: 'video' }>;
  onOpen(): void;
}) {
  const ratio = Math.min(1.78, Math.max(0.8, media.asset.aspectRatio));
  return (
    <Pressable
      accessibilityLabel={`播放视频：${media.asset.title}`}
      accessibilityRole="button"
      onPress={stopAndRun(onOpen)}
      style={[styles.video, { aspectRatio: ratio }]}
    >
      <Image source={imageSource(media.asset.posterUri)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.videoShade} />
      <View style={styles.playButton}>
        <Play color={Colors.textPrimary} fill={Colors.textPrimary} size={24} strokeWidth={1.8} />
      </View>
      {media.asset.playbackStatus === 'reserved' ? <Text style={styles.videoStatus}>视频素材准备中</Text> : null}
    </Pressable>
  );
}

function AudioMedia({ media, onOpen }: {
  media: Extract<MediaContent, { type: 'audio' }>;
  onOpen(): void;
}) {
  return (
    <Pressable accessibilityLabel={`播放音频：${media.asset.title}`} accessibilityRole="button" onPress={stopAndRun(onOpen)} style={styles.audio}>
      <Image source={imageSource(media.asset.coverUri)} style={styles.audioCover} />
      <View style={styles.audioCopy}>
        <Text numberOfLines={1} style={styles.audioTitle}>{media.asset.title}</Text>
        <Text numberOfLines={1} style={styles.audioMeta}>{media.asset.artist} · {media.asset.bpm} BPM</Text>
      </View>
      <View style={styles.audioIcon}>
        <Music2 color={Colors.brand} size={20} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export default function PostMedia({ media, onOpen }: { media: MediaContent; onOpen(): void }) {
  switch (media.type) {
    case 'images': return <ImageMedia media={media} onOpen={onOpen} />;
    case 'video': return <VideoMedia media={media} onOpen={onOpen} />;
    case 'audio': return <AudioMedia media={media} onOpen={onOpen} />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  singleImage: { width: '100%', borderRadius: 8, backgroundColor: Colors.surface },
  imageGrid: { width: '100%', gap: 3, borderRadius: 8, overflow: 'hidden' },
  imageGridRow: { flex: 1, flexDirection: 'row', gap: 3 },
  gridImage: { flex: 1, backgroundColor: Colors.surface },
  gridPlaceholder: { flex: 1 },
  video: { width: '100%', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  videoShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 11, 13, 0.22)' },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(9, 11, 13, 0.72)', alignItems: 'center', justifyContent: 'center' },
  videoStatus: { position: 'absolute', left: 10, bottom: 10, color: Colors.textSecondary, fontSize: 12, backgroundColor: 'rgba(9, 11, 13, 0.78)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  audio: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, paddingVertical: 8 },
  audioCover: { width: 48, height: 48, borderRadius: 4, backgroundColor: Colors.surface },
  audioCopy: { flex: 1, minWidth: 0 },
  audioTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  audioMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  audioIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
