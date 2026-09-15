import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const PRIVACY_OPTIONS = [
  '谁可以看我的帖子',
  '谁可以看我的装备库',
  '谁可以看我的关注列表',
  '谁可以给我发私信',
];

const SETTINGS_ITEMS = [
  { label: '基本资料', icon: '👤' },
  { label: '关注领域（花式）', icon: '🪀' },
  { label: '所在地区', icon: '📍' },
  { label: '隐私设置', icon: '🔒' },
];

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AccountSettings'>>();

  const handleItemPress = (label: string) => {
    if (label === '隐私设置') {
      Alert.alert('隐私设置', PRIVACY_OPTIONS.join('\n'), [{ text: '关闭' }]);
      return;
    }
    Alert.alert(label, '编辑功能即将上线', [{ text: '好的' }]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="返回"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>账户设置</Text>
        <View style={styles.navButton} />
      </View>

      <ScrollView>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.settingRow}
            onPress={() => handleItemPress(item.label)}
            accessibilityLabel={item.label}
          >
            <Text style={styles.settingIcon}>{item.icon}</Text>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1d22',
  },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.white, fontSize: 32, lineHeight: 34 },
  navTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  settingRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1d22',
  },
  settingIcon: { width: 28, fontSize: 20, textAlign: 'center' },
  settingLabel: { color: Colors.white, fontSize: 15, flex: 1 },
  settingArrow: { color: Colors.textMuted, fontSize: 20 },
});
