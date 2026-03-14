import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.'); return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Maroon top */}
      <View style={s.topBg}>
        <View style={s.logoCircle}>
          <Text style={{ fontSize: 36 }}>🏛️</Text>
        </View>
        <Text style={s.appName}>People Connect</Text>
        <Text style={s.tagline}>Tamil Nadu Public Service Platform</Text>
      </View>

      {/* White card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome Back 👋</Text>
            <Text style={s.cardSub}>Sign in to your account</Text>

            <Text style={s.label}>Email Address</Text>
            <View style={s.inputRow}>
              <Text style={s.icon}>✉️</Text>
              <TextInput
                style={s.input}
                placeholder="Enter your email"
                placeholderTextColor={T.textM}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Text style={s.icon}>🔒</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={T.textM}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 8 }}>
                <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>or</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity style={s.outlineBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
              <Text style={s.outlineBtnText}>Create New Account</Text>
            </TouchableOpacity>

            <Text style={s.footerText}>
              Don't have an account?{' '}
              <Text style={{ color: T.maroon, fontWeight: '700' }} onPress={() => navigation.navigate('Register')}>
                Register
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.maroon },
  topBg:      { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 36 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName:    { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tagline:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  scroll:     { flexGrow: 1 },
  card:       { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingTop: 32, minHeight: '100%', elevation: 20 },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 4 },
  cardSub:    { fontSize: 14, color: T.textM, marginBottom: 28 },
  label:      { fontSize: 13, fontWeight: '700', color: T.textL, marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 14, backgroundColor: T.bg, marginBottom: 18, paddingHorizontal: 14 },
  icon:       { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 15, color: T.text },
  forgotRow:  { alignItems: 'flex-end', marginTop: -8, marginBottom: 24 },
  forgotText: { fontSize: 13, color: T.maroon, fontWeight: '700' },
  btn:        { backgroundColor: T.maroon, borderRadius: 50, paddingVertical: 16, alignItems: 'center', elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText:    { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  divider:    { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: T.border },
  divText:    { marginHorizontal: 12, color: T.textM, fontSize: 13 },
  outlineBtn: { borderWidth: 2, borderColor: T.maroon, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  outlineBtnText: { fontSize: 15, fontWeight: '700', color: T.maroon },
  footerText: { textAlign: 'center', fontSize: 13, color: T.textL, marginTop: 4 },
});