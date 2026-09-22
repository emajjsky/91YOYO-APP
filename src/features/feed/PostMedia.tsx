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
import type { MediaContent } from '../social/types';
import { getImageGalleryLayout, getPreviewAspectRatio } from './imageGalleryLayout';
import { useTheme } from '../../theme/ThemeProvider';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const layout = getImageGalleryLayout(media.assets.length);
  const assets = media.assets.slice(0, layout.imageCount);
  if (assets.length === 0) return null;
  const previewAspectRatio = getPreviewAspectRatio(assets[0].aspectRatio);
  const galleryHeight = galleryWidth > 0 ? Math.round(galleryWidth / previewAspectRatio) : 0;

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
          {media.assets.length > 1 ? (
            <Text style={[styles.viewerCount, { top: insets.top + 16 }]}>{imageIndex + 1} / {media.assets.length}</Text>
          ) : null}
          <Pressable accessibilityLabel="关闭图片" accessibilityRole="button" onPress={() => setViewerVisible(false)} style={styles.viewerClose}>
            <X color={colors.textPrimary} size={25} strokeWidth={2} />
          </Pressable>
        </View>
      )}
      imageIndex={viewerIndex}
      images={media.assets.map((asset) => imageSource(asset.uri))}
      keyExtractor={(_, index) => media.assets[index].id}
      onRequestClose={() => setViewerVisible(false)}
      presentationStyle="overFullScreen"
      swipeToCloseEnabled
      visible={viewerVisible}
    />
  );

  if (assets.length === 1) {
    return (
      <>
        <View onLayout={updateGalleryWidth} style={[styles.mediaViewport, { aspectRatio: previewAspectRatio }]}>
          {galleryWidth > 0 ? (
            <Pressable
              accessibilityLabel="查看图片"
              accessibilityRole="imagebutton"
              onPress={stopAndRun(() => openImage(0))}
              style={{ width: galleryWidth, height: galleryHeight }}
            >
              <Image
                source={imageSource(assets[0].uri)}
                style={{ width: galleryWidth, height: galleryHeight }}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <Image source={imageSource(assets[0].uri)} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )}
        </View>
        {viewer}
      </>
    );
  }

  return (
    <>
      <View onLayout={updateGalleryWidth} style={[styles.mediaViewport, { aspectRatio: previewAspectRatio }]}>
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
                style={[styles.carouselPage, { width: galleryWidth, height: galleryHeight }]}
              >
                <Image
                  source={imageSource(asset.uri)}
                  style={{ width: galleryWidth, height: galleryHeight }}
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
      </View>
      {viewer}
    </>
  );
}

function VideoMedia({ media, onOpen }: {
  media: Extract<MediaContent, { type: 'video' }>;
  onOpen(): void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const previewAspectRatio = getPreviewAspectRatio(media.asset.aspectRatio);

  return (
    <Pressable
      accessibilityLabel={`播放视频：${media.asset.title}`}
      accessibilityRole="button"
      onPress={stopAndRun(onOpen)}
      style={[styles.video, { aspectRatio: previewAspectRatio }]}
    >
      <Image source={imageSource(media.asset.posterUri)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.videoShade} />
      <View style={styles.playButton}>
        <Play color={colors.textPrimary} fill={colors.textPrimary} size={24} strokeWidth={1.8} />
      </View>
      {media.asset.playbackStatus === 'reserved' ? <Text style={styles.videoStatus}>视频素材准备中</Text> : null}
    </Pressable>
  );
}

function AudioMedia({ media, onOpen }: {
  media: Extract<MediaContent, { type: 'audio' }>;
  onOpen(): void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Pressable accessibilityLabel={`播放音频：${media.asset.title}`} accessibilityRole="button" onPress={stopAndRun(onOpen)} style={styles.audio}>
      <Image source={imageSource(media.asset.coverUri)} style={styles.audioCover} />
      <View style={styles.audioCopy}>
        <Text numberOfLines={1} style={styles.audioTitle}>{media.asset.title}</Text>
        <Text numberOfLines={1} style={styles.audioMeta}>{media.asset.artist} · {media.asset.bpm} BPM</Text>
      </View>
      <View style={styles.audioIcon}>
        <Music2 color={colors.brand} size={20} strokeWidth={2} />
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

function createStyles(colors: { surface: string; textPrimary: string; textSecondary: string; textMuted: string; brand: string; border: string }) {
  return StyleSheet.create({
    mediaViewport: { width: '100%', alignSelf: 'stretch', borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surface },
    carouselPage: { overflow: 'hidden', backgroundColor: colors.surface },
    viewerHeader: { position: 'absolute', zIndex: 1, top: 0, left: 0, right: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    viewerCount: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    viewerClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    video: { width: '100%', alignSelf: 'stretch', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    videoShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 11, 13, 0.22)' },
    playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(9, 11, 13, 0.72)', alignItems: 'center', justifyContent: 'center' },
    videoStatus: { position: 'absolute', left: 10, bottom: 10, color: colors.textSecondary, fontSize: 12, backgroundColor: 'rgba(9, 11, 13, 0.78)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    audio: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 8 },
    audioCover: { width: 48, height: 48, borderRadius: 4, backgroundColor: colors.surface },
    audioCopy: { flex: 1, minWidth: 0 },
    audioTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    audioMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
    audioIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  });
}
