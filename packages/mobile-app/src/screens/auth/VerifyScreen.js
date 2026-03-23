import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import PopupToast from '../../components/PopupToast';
import { T } from '../../constants/theme';

function OtpInput({ value, onChange }) {
  const refs   = useRef([]);
  const digits = value.split('');

  const handleChange = (text, idx) => {
    const clean = text.replace(/[^0-9]/g, '');
    const arr   = value.split('');
    arr[idx]    = clean.slice(-1);
    onChange(arr.join(''));
    if (clean && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKey = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={ot.row}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <TextInput
          key={i}
          ref={r => (refs.current[i] = r)}
          style={[ot.box, digits[i] && ot.boxFilled]}
          value={digits[i] || ''}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={e  => handleKey(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

export default function VerifyScreen({ route, navigation }) {
  const { phone } = route.params;
  const { login, logout } = useAuth();
  const [otpCode,   setOtpCode]   = useState('');
  const [toast,     setToast]     = useState({ visible:false, message:'', type:'error' });
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const showToast = (message, type = 'error') => setToast({ visible:true, message, type });
  const hideToast = () => setToast(t => ({ ...t, visible:false }));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      logout();
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      showToast('Please enter the full 6-digit OTP.'); return;
    }
    setLoading(true);
    try {
      await authAPI.verifyPhone(phone, otpCode);
      showToast('Phone verified successfully!', 'success');
      // You might want to automatically log the user in here, or navigate to login
      navigation.navigate('Login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      showToast(msg);
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      // This should be a new endpoint to resend OTP for an existing user
      // For now, let's assume there is a resendOtp endpoint
      await authAPI.resendOtp(phone);
      setCountdown(60);
      setOtpCode('');
      showToast(`OTP sent to ${phone}`, 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not send OTP. Please try again.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      <View style={s.topBg}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={handleBack}
        >
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>

        <View style={s.logoCircle}>
          <Text style={{ fontSize: 32 }}>📱</Text>
        </View>
        <Text style={s.appName}>Verify Your Phone</Text>
        <Text style={s.tagline}>Check your SMS messages for a verification code.</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <Text style={s.cardTitle}>Enter OTP</Text>
            <Text style={s.cardSub}>
              Enter the 6-digit OTP sent to{'\n'}
              <Text style={{ fontWeight: '800', color: T.text }}>{phone}</Text>
            </Text>

            <OtpInput value={otpCode} onChange={setOtpCode} />

            <View style={s.resendRow}>
              {countdown > 0 ? (
                <Text style={s.resendTimer}>
                  Resend OTP in{' '}
                  <Text style={{ fontWeight: '800', color: T.maroon }}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={s.resendLink}>
                    Didn't receive?{' '}
                    <Text style={{ color: T.maroon, fontWeight: '800' }}>Resend OTP</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[s.btn, (otpCode.length < 6 || loading) && { opacity: 0.6 }]}
              onPress={handleVerifyOtp}
              disabled={otpCode.length < 6 || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Verify Phone ✓</Text>
              }
            </TouchableOpacity>

             <Text style={s.footerText}>
                A verification link has been sent to your email address. Please verify your email to complete the registration.
              </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ot = StyleSheet.create({
    row:      { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
    box:      { width: 48, height: 56, borderRadius: 14, borderWidth: 2, borderColor: T.border, backgroundColor: T.bg, textAlign: 'center', fontSize: 22, fontWeight: '800', color: T.text },
    boxFilled:{ borderColor: T.maroon, backgroundColor: '#FFF8EE' },
  });

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.maroon },
  topBg:      { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28 },
  backBtn:    { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:    { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appName:    { fontSize: 21, fontWeight: '900', color: '#fff' },
  tagline:    { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  scroll: { flexGrow: 1 },
  card:   {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    minHeight: '100%',
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 4 },
  cardSub:   { fontSize: 14, color: T.textM, marginBottom: 24, lineHeight: 20 },
  btn:     { backgroundColor: T.maroon, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  resendRow:   { alignItems: 'center', marginBottom: 16 },
  resendTimer: { fontSize: 13, color: T.textM },
  resendLink:  { fontSize: 13, color: T.textM },
  footerText: { textAlign: 'center', fontSize: 13, color: T.textL, marginTop: 20, paddingHorizontal: 20 },
});
