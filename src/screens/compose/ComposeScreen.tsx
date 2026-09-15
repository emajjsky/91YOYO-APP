import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { POST_CATEGORIES } from '../../constants/categories';
import type { PostCategoryId } from '../../constants/categories';

type MediaType = 'none' | 'image' | 'video' | 'music';
type Visibility = '公开' | '仅关注者' | '仅自己';

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [category, setCategory] = useState<PostCategoryId | null>(null);
  const [canDownload, setCanDownload] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('公开');

  const canPublish = text.trim().length > 0 && category !== null;

  const handlePublish = () => {
    if (!canPublish) {
      Alert.alert('提示', '请填写内容并选择分类');
      return;
    }
    Alert.alert('发布成功！', '你的动态已发布 🎉', [
      { text: '好的', onPress: () => navigation.goBack() },
    ]);
  };

  const MEDIA_OPTIONS: { type: MediaType; icon: string; label: string; note: string }[] = [
    { type: 'image', icon: '📷', label: '图片', note: '最多 9 张' },
    { type: 'video', icon: '🎬', label: '视频', note: '最多 1 条' },
    { type: 'music', icon: '🎵', label: '音乐', note: '最多 1 条' },
  ];

  const VISIBILITY_OPTIONS: Visibility[] = ['公开', '仅关注者', '仅自己'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.title}>发布动态</Text>
        <TouchableOpacity
          style={[styles.publishBtn, !canPublish && styles.publishBtnDisabled]}
          onPress={handlePublish}
        >
          <Text style={[styles.publishText, !canPublish && styles.publishTextDisabled]}>发布</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 媒体类型选择 */}
        <Text style={styles.sectionLabel}>选择内容类型</Text>
        <View style={styles.mediaRow}>
          {MEDIA_OPTIONS.map((opt) => {
            const active = mediaType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[styles.mediaBtn, active && styles.mediaBtnActive]}
                onPress={() => setMediaType(active ? 'none' : opt.type)}
              >
                <Text style={styles.mediaIcon}>{opt.icon}</Text>
                <Text style={[styles.mediaLabel, active && styles.mediaLabelActive]}>{opt.label}</Text>
                <Text style={styles.mediaNote}>{opt.note}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 媒体占位区 */}
        {mediaType === 'image' && (
          <TouchableOpacity style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderIcon}>📷</Text>
            <Text style={styles.mediaPlaceholderText}>选择图片（0/9）</Text>
          </TouchableOpacity>
        )}
        {mediaType === 'video' && (
          <TouchableOpacity style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderIcon}>🎬</Text>
            <Text style={styles.mediaPlaceholderText}>选择视频</Text>
          </TouchableOpacity>
        )}
        {mediaType === 'music' && (
          <TouchableOpacity style={styles.mediaPlaceholder}>
            <Text style={styles.mediaPlaceholderIcon}>🎵</Text>
            <Text style={styles.mediaPlaceholderText}>选择音乐文件</Text>
          </TouchableOpacity>
        )}

        {/* 文字输入 */}
        <TextInput
          style={styles.textInput}
          placeholder="分享你的悠悠时刻..."
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        {/* 分类选择（必选） */}
        <Text style={styles.sectionLabel}>
          选择分类 <Text style={styles.required}>*必选</Text>
        </Text>
        <View style={styles.catGrid}>
          {POST_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setCategory(active ? null : cat.id)}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 发布设置 */}
        <Text style={styles.sectionLabel}>发布设置</Text>

        {/* 视频下载开关 */}
        {mediaType === 'video' && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>允许他人下载视频</Text>
            <Switch
              value={canDownload}
              onValueChange={setCanDownload}
              trackColor={{ false: '#333', true: '#00c7d4' }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {/* 可见性 */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>可见性</Text>
          <View style={styles.visibilityRow}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = visibility === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.visBtn, active && styles.visBtnActive]}
                  onPress={() => setVisibility(opt)}
                >
                  <Text style={[styles.visBtnText, active && styles.visBtnTextActive]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#1a1d22',
  },
  cancelText: { color: Colors.textMuted, fontSize: 16 },
  title: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  publishBtn: {
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 7,
  },
  publishBtnDisabled: { backgroundColor: '#333' },
  publishText: { color: Colors.black, fontSize: 14, fontWeight: '700' },
  publishTextDisabled: { color: '#666' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  sectionLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: -8 },
  required: { color: '#F91880', fontWeight: '600' },

  // 媒体类型
  mediaRow: { flexDirection: 'row', gap: 10 },
  mediaBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: '#0c0f14', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#1e2330',
    paddingVertical: 14,
  },
  mediaBtnActive: { backgroundColor: '#0f1a2e', borderColor: '#00c7d4' },
  mediaIcon: { fontSize: 24 },
  mediaLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
  mediaLabelActive: { color: '#00c7d4' },
  mediaNote: { color: '#555', fontSize: 10 },

  // 媒体占位
  mediaPlaceholder: {
    height: 120, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#252930', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  mediaPlaceholderIcon: { fontSize: 32 },
  mediaPlaceholderText: { color: Colors.textMuted, fontSize: 14 },

  // 文字输入
  textInput: {
    color: Colors.white, fontSize: 16, lineHeight: 24,
    minHeight: 120, padding: 14,
    backgroundColor: '#0c0f14', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#1e2330',
  },

  // 分类
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#0c0f14', borderWidth: 0.5, borderColor: '#1e2330',
  },
  catChipActive: { backgroundColor: Colors.white },
  catChipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: Colors.black, fontWeight: '700' },

  // 设置
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: '#0c0f14', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#1e2330',
  },
  settingBlock: {
    backgroundColor: '#0c0f14', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#1e2330',
    padding: 14, gap: 10,
  },
  settingLabel: { color: Colors.white, fontSize: 14 },
  visibilityRow: { flexDirection: 'row', gap: 8 },
  visBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#111318', borderWidth: 0.5, borderColor: '#252930',
  },
  visBtnActive: { backgroundColor: Colors.white },
  visBtnText: { color: Colors.textMuted, fontSize: 13 },
  visBtnTextActive: { color: Colors.black, fontWeight: '700' },
});
