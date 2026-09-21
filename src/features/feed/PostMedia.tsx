import React, { useState } from 'react';
import {
  FlatList,
  Image,
  type ImageRequireSource,
  type ImageURISource,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Music2, Play, X } from 'lucide-react-native';
import ImageViewing from 'react-native-image-viewing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import type { MediaContent } from '../social/types';
import { getImageGalleryLayout, getSingleImageAspectRatio } from './imageGalleryLayout';

function imageSource(uri: number | string): ImageRequireSource | ImageURISource {
  return typeof uri === 'number' ? uri : { uri };
}

function stopAndRun(callback: () => void) {
  return (event: GestureResponderEvent) => {
    event.stopPropagation();
    callback();
  };
}

function ImageMedia({ media }: {
  media: Extract<MediaContent, { type: 'images' }>;
}) {
  const insets = useSafeAreaInsets();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const layout = getImageGalleryLayout(media.assets.length);
  const assets = media.assets.slice(0, layout.imageCount);
  if (assets.length === 0) return null;

  const openImage = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const updateGalleryWidth = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== galleryWidth) setGalleryWidth(nextWidth);
  };

  const updateActiveIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (galleryWidth <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
    setActiveIndex(Math.min(assets.length - 1, Math.max(0, nextIndex)));
  };

  const viewer = (
    <ImageViewing
      HeaderComponent={({ imageIndex }) => (
        <View style={[styles.viewerHeader, { height: insets.top + 52, paddingTop: insets.top }]}>
          <Text style={[styles.viewerCount, { top: insets.top + 16 }]}>{imageIndex + 1} / {media.assets.length}</Text>
          <Pressable accessibilityLabel="关闭图片" accessibilityRole="button" onPress={() => setViewerVisible(false)} style={styles.viewerClose}>
            <X color={Colors.textPrimary} size={25} strokeWidth={2} />
          </Pressable>
        </View>
      )}
      imageIndex={viewerIndex}
      images={media.assets.map((asset) => imageSource(asset.uri))}
      keyExtractor={(_, index) => media.assets[index].id}
      onRequestClose={() => setViewerVisible(false)}
      swipeToCloseEnabled
      visible={viewerVisible}
    />
  );

  if (assets.length === 1) {
    return (
      <>
        <Pressable accessibilityLabel="查看图片" accessibilityRole="imagebutton" onPress={stopAndRun(() => openImage(0))}>
          <Image
            source={imageSource(assets[0].uri)}
            style={[styles.singleImage, { aspectRatio: getSingleImageAspectRatio(assets[0].aspectRatio) }]}
            resizeMode="cover"
          />
        </Pressable>
        {viewer}
      </>
    );
  }

  return (
    <>
      <View onLayout={updateGalleryWidth} style={styles.carousel}>
        {galleryWidth > 0 ? (
          <FlatList
            accessibilityLabel={`${assets.length}张图片，当前第${activeIndex + 1}张`}
            data={assets}
            getItemLayout={(_, index) => ({ index, length: galleryWidth, offset: galleryWidth * index })}
            horizontal
            keyExtractor={(asset) => asset.id}
            onMomentumScrollEnd={updateActiveIndex}
            pagingEnabled
            renderItem={({ item: asset, index }) => (
              <Pressable
                accessibilityLabel={`查看第${index + 1}张图片`}
                accessibilityRole="imagebutton"
                onPress={stopAndRun(() => openImage(index))}
                style={[styles.carouselPage, { width: galleryWidth, height: galleryWidth * 3 / 4 }]}
              >
                <Image
                  source={imageSource(asset.uri)}
                  style={{ width: galleryWidth, height: galleryWidth * 3 / 4 }}
                  resizeMode="cover"
                />
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Image source={imageSource(assets[0].uri)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        <View pointerEvents="none" style={styles.pageCountBadge}>
          <Text style={styles.pageCountText}>{activeIndex + 1} / {assets.length}</Text>
        </View>
      </View>
      {viewer}
    </>
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
    case 'images': return <ImageMedia media={media} />;
    case 'video': return <VideoMedia media={media} onOpen={onOpen} />;
    case 'audio': return <AudioMedia media={media} onOpen={onOpen} />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  singleImage: { width: '100%', borderRadius: 8, backgroundColor: Colors.surface },
  carousel: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.surface },
  carouselPage: { overflow: 'hidden', backgroundColor: Colors.surface },
  pageCountBadge: { position: 'absolute', top: 9, right: 9, minWidth: 44, height: 26, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9, 11, 13, 0.76)' },
  pageCountText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  viewerHeader: { position: 'absolute', zIndex: 1, top: 0, left: 0, right: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  viewerCount: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  viewerClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
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
