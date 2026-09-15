import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../navigation/RootNavigator';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const { seller } = route.params ?? {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{seller ?? '球友私聊'}</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>💬 私聊界面</Text>
        <Text style={styles.placeholderSub}>（Phase 4 完整实现 + Supabase Realtime）</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#181a1f',
  },
  backText: { color: Colors.white, fontSize: 18 },
  title: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  placeholderText: { color: Colors.textMuted, fontSize: 20 },
  placeholderSub: { color: '#333', fontSize: 13 },
});
