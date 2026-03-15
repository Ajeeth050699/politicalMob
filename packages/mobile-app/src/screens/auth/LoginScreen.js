import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../constants/theme';
import PopupToast from '../../components/PopupToast';

const LOGIN_TIMEOUT_MS = 10000;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toast,    setToast]    = useState({ visible:false, message:'', type:'error' });

  const showToast = (message, type = 'error') => setToast({ visible:true, message, type });
  const hideToast = () => setToast(t => ({ ...t, visible:false }));

  const handleLogin = async () => {
    if (!email.trim()) { showToast('Please enter your email address.'); return; }
    if (!password.trim()) { showToast('Please enter your password.'); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { showToast('Please enter a valid email address.'); return; }

    setLoading(true);

    // Timeout — don't hang forever
    const timeoutId = setTimeout(() => {
      setLoading(false);
      showToast('Connection timed out. Please check your internet and try again.', 'warning');
    }, LOGIN_TIMEOUT_MS);

    try {
      await login(email.trim(), password);
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        showToast('Connection timed out. Please try again.', 'warning');
      } else if (err?.response?.status === 401) {
        showToast('Incorrect email or password. Please try again.');
      } else if (err?.response?.status === 404) {
        showToast('No account found with this email.');
      } else if (!err?.response) {
        showToast('Cannot connect to server. Check your internet connection.', 'warning');
      } else {
        showToast(err?.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Popup toast */}
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      {/* Maroon top */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.topBg}>
        <View style={s.decoCircle1} />
        <View style={s.decoCircle2} />
        <View style={s.logoCircle}>
          <Text style={{ fontSize:36 }}>🏛️</Text>
        </View>
        <Text style={s.appName}>People Connect</Text>
        <Text style={s.tagline}>Tamil Nadu Public Service Platform</Text>
      </LinearGradient>

      {/* White card */}
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{ flex:1 }}>
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
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Text style={s.icon}>🔒</Text>
              <TextInput
                style={[s.input, { flex:1 }]}
                placeholder="Enter your password"
                placeholderTextColor={T.textM}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding:8 }}>
                <Text style={{ fontSize:16 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={s.forgotBtn}>
              <Text style={s.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, loading && { opacity:0.75 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[T.maroon, T.maroonL]} style={s.btnGrad}>
                {loading ? (
                  <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={s.btnTxt}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={s.btnTxt}>Sign In →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or</Text>
              <View style={s.divLine} />
            </View>

            <Text style={s.footerTxt}>
              Don't have an account?{' '}
              <Text style={{ color:T.maroon, fontWeight:'700' }} onPress={() => navigation.navigate('Register')}>
                Create Account
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor:T.maroon },
  topBg:       { paddingTop:Platform.OS==='ios'?52:40, paddingBottom:36, alignItems:'center', paddingHorizontal:24, overflow:'hidden' },
  decoCircle1: { position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:80, backgroundColor:'rgba(255,255,255,0.07)' },
  decoCircle2: { position:'absolute', bottom:-20, left:-50, width:180, height:180, borderRadius:90, backgroundColor:'rgba(255,255,255,0.05)' },
  logoCircle:  { width:80, height:80, borderRadius:40, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center', marginBottom:14, borderWidth:2, borderColor:'rgba(255,255,255,0.25)' },
  appName:     { fontSize:24, fontWeight:'900', color:'#fff' },
  tagline:     { fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:5 },
  scroll:      { flexGrow:1 },
  card:        { backgroundColor:'#fff', borderTopLeftRadius:32, borderTopRightRadius:32, padding:28, paddingTop:32, minHeight:'100%' },
  cardTitle:   { fontSize:24, fontWeight:'800', color:T.text, marginBottom:6 },
  cardSub:     { fontSize:14, color:T.textM, marginBottom:24 },
  label:       { fontSize:13, fontWeight:'700', color:T.textL, marginBottom:8 },
  inputRow:    { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:T.border, borderRadius:14, backgroundColor:T.bg, paddingHorizontal:14, marginBottom:16 },
  icon:        { fontSize:16, marginRight:10 },
  input:       { paddingVertical:14, fontSize:15, color:T.text },
  forgotBtn:   { alignSelf:'flex-end', marginTop:-8, marginBottom:20 },
  forgotTxt:   { fontSize:13, color:T.maroon, fontWeight:'600' },
  btn:         { borderRadius:50, overflow:'hidden', elevation:4, shadowColor:T.maroon, shadowOpacity:0.4, shadowRadius:8, shadowOffset:{width:0,height:4} },
  btnGrad:     { paddingVertical:16, alignItems:'center' },
  btnTxt:      { fontSize:16, fontWeight:'800', color:'#fff', letterSpacing:0.5 },
  divider:     { flexDirection:'row', alignItems:'center', marginVertical:20 },
  divLine:     { flex:1, height:1, backgroundColor:T.border },
  divTxt:      { marginHorizontal:12, color:T.textM, fontSize:13 },
  footerTxt:   { textAlign:'center', fontSize:14, color:T.textL },
});