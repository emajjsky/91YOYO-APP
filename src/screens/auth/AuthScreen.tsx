import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const { phone, otpSent, isSubmitting, errorMessage, setPhone, sendOtp, verifyOtp } = useAuthStore();

  const handlePrimaryAction = () => {
    void (otpSent ? verifyOtp(otp) : sendOtp());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.brandMark}>
          <Text style={styles.brandText}>91</Text>
        </View>
        <Text style={styles.eyebrow}>91YOYO COMMUNITY</Text>
        <Text style={styles.title}>和球友一起，{`\n`}把每一招练清楚</Text>
        <Text style={styles.subtitle}>登录后同步你的练习记录、收藏和装备柜。</Text>

        <View style={styles.form}>
          <Text style={styles.label}>手机号</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="请输入手机号"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            editable={!otpSent && !isSubmitting}
            maxLength={11}
          />

          {otpSent && (
            <>
              <Text style={styles.label}>验证码</Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="输入 6 位验证码"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                maxLength={6}
                editable={!isSubmitting}
              />
            </>
          )}

          {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handlePrimaryAction}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? <ActivityIndicator color={Colors.black} /> : <Text style={styles.primaryText}>{otpSent ? '登录' : '获取验证码'}</Text>}
          </TouchableOpacity>

          {otpSent && (
            <TouchableOpacity onPress={() => void sendOtp()} disabled={isSubmitting} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>重新发送验证码</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.terms}>继续即表示你同意用户协议和隐私政策。</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 24 },
  brandMark: {
    width: 54, height: 54, borderRadius: 14, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  brandText: { color: Colors.black, fontSize: 24, fontWeight: '900' },
  eyebrow: { color: Colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  title: { color: Colors.white, fontSize: 28, lineHeight: 36, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 12 },
  form: { marginTop: 42, gap: 10 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 4 },
  input: {
    height: 52, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    backgroundColor: '#0c0f14', color: Colors.white, fontSize: 16, paddingHorizontal: 14,
  },
  error: { color: Colors.like, fontSize: 13, lineHeight: 19 },
  primaryButton: {
    height: 52, borderRadius: 10, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryText: { color: Colors.black, fontSize: 15, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', paddingVertical: 10 },
  secondaryText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  terms: { color: '#4f555c', fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingTop: 24 },
});
