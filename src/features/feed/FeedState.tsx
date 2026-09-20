import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export interface FeedStateProps {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?(): void;
}

export default function FeedState({ kind, title, message, actionLabel, onAction }: FeedStateProps) {
  return (
    <View style={styles.container}>
      {kind === 'loading' ? <ActivityIndicator color={Colors.brand} /> : null}
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

const styles = StyleSheet.create({
  container: { minHeight: 240, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { color: Colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginTop: 4 },
  actionText: { color: Colors.brand, fontSize: 14, fontWeight: '700' },
});
