import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export interface FeedStateProps {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?(): void;
}

export default function FeedState({ kind, title, message, actionLabel, onAction }: FeedStateProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      {kind === 'loading' ? <ActivityIndicator color={colors.brand} /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: { textPrimary: string; textMuted: string; brand: string }) {
  return StyleSheet.create({
  container: { minHeight: 240, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginTop: 4 },
  actionText: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  });
}
