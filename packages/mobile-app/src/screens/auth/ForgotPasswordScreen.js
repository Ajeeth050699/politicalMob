import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../../services/api';
import { T } from '../../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { Alert.alert('Invalid', 'Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Maroon top */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.topBg}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.iconCircle}>
          <Text style={{ fontSize: 36 }}>{sent ? '📬' : '🔑'}</Text>
        </View>
        <Text style={s.topTitle}>{sent ? 'Email Sent!' : 'Forgot Password?'}</Text>
        <Text style={s.topSub}>
          {sent
            ? `We've sent a reset link to\n${email}`
            : "No worries, we'll send you reset instructions"
          }
        </Text>
      </LinearGradient>

      {/* White card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.card}>

            {!sent ? (
              <>
                <Text style={s.cardTitle}>Reset Password</Text>
                <Text style={s.cardSub}>Enter the email address linked to your account</Text>

                <Text style={s.label}>Email Address</Text>
                <View style={s.inputRow}>
                  <Text style={s.inputIcon}>✉️</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Enter your email"
                    placeholderTextColor={T.textM}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleSend}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[T.maroon, T.maroonL]} style={s.btnGrad}>
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={s.btnTxt}>📧 Send Reset Link</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Success state */}
                <View style={s.successBox}>
                  <Text style={{ fontSize: 56 }}>✅</Text>
                  <Text style={s.successTitle}>Check your inbox</Text>
                  <Text style={s.successSub}>
                    We sent a password reset link to{'\n'}
                    <Text style={{ fontWeight: '800', color: T.text }}>{email}</Text>
                  </Text>
                  <Text style={s.successNote}>
                    Didn't receive the email? Check your spam folder or try again.
                  </Text>
                </View>

                <TouchableOpacity
                  style={s.btn}
                  onPress={() => { setSent(false); setEmail(''); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[T.maroon, T.maroonL]} style={s.btnGrad}>
                    <Text style={s.btnTxt}>🔄 Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity
              style={s.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={s.loginBtnTxt}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.maroon },

  topBg:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 36, alignItems: 'center', paddingHorizontal: 24 },
  backBtn:    { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:    { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, marginTop: 8 },
  topTitle:   { fontSize: 24, fontWeight: '900', color: '#fff' },
  topSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center', lineHeight: 20 },

  scroll:     { flexGrow: 1 },
  card:       { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingTop: 32, minHeight: '100%' },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 6 },
  cardSub:    { fontSize: 14, color: T.textM, marginBottom: 24 },

  label:      { fontSize: 13, fontWeight: '700', color: T.textL, marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14, marginBottom: 20 },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 15, color: T.text },

  btn:        { borderRadius: 50, overflow: 'hidden', elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnGrad:    { paddingVertical: 17, alignItems: 'center' },
  btnTxt:     { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  successBox: { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  successTitle:{ fontSize: 22, fontWeight: '800', color: T.text, marginTop: 14, marginBottom: 10 },
  successSub: { fontSize: 14, color: T.textL, textAlign: 'center', lineHeight: 22 },
  successNote:{ fontSize: 12, color: T.textM, textAlign: 'center', marginTop: 12, lineHeight: 18 },

  divider:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: T.border },
  divTxt:     { marginHorizontal: 12, color: T.textM, fontSize: 13 },

  loginBtn:   { borderWidth: 2, borderColor: T.maroon, borderRadius: 50, paddingVertical: 15, alignItems: 'center' },
  loginBtnTxt:{ fontSize: 15, fontWeight: '700', color: T.maroon },
});