import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function SetupRequiredScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.brandMark}>
        <Text style={styles.brandText}>91</Text>
      </View>
      <Text style={styles.title}>连接开发环境</Text>
      <Text style={styles.body}>
        App 工程已准备好，但还没有配置 Supabase。请在项目根目录创建 .env.local，并填写 development 项目的公开 URL 和 anon key。
      </Text>
      <View style={styles.codeBlock}>
        <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL</Text>
        <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
      </View>
      <Text style={styles.note}>配置后重启 Expo 开发服务器即可继续。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24, justifyContent: 'center' },
  brandMark: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 28,
  },
  brandText: { color: Colors.black, fontSize: 28, fontWeight: '900' },
  title: { color: Colors.white, fontSize: 26, fontWeight: '800', marginBottom: 12 },
  body: { color: Colors.textSecondary, fontSize: 15, lineHeight: 24 },
  codeBlock: {
    backgroundColor: '#0c0f14', borderColor: '#1e2330', borderWidth: 1,
    borderRadius: 10, padding: 14, gap: 8, marginTop: 24,
  },
  codeText: { color: Colors.accent, fontSize: 13, fontFamily: 'Courier' },
  note: { color: Colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 16 },
});
