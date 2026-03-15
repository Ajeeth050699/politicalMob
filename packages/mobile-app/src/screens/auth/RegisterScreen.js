import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import PopupToast from '../../components/PopupToast';
import { T, TN_DISTRICTS } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────────
// Reusable labeled input
// ─────────────────────────────────────────────────────────────────
function Field({ label, icon, value, onChange, placeholder, keyboard, secure }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={fs.label}>{label}</Text>
      <View style={fs.row}>
        <Text style={fs.icon}>{icon}</Text>
        <TextInput
          style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: T.text }}
          placeholder={placeholder}
          placeholderTextColor={T.textM}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard || 'default'}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          secureTextEntry={!!secure && !show}
        />
        {!!secure && (
          <TouchableOpacity onPress={() => setShow(v => !v)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 16 }}>{show ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// 6-digit OTP boxes
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// Main RegisterScreen
// ─────────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [step,      setStep]      = useState(1); // 1=info, 2=otp, 3=district
  const [form,      setForm]      = useState({
    name: '', email: '', phone: '', password: '',
    confirmPassword: '', address: '', district: '',
  });
  const [otpCode,   setOtpCode]   = useState('');
  const [toast,     setToast]     = useState({ visible:false, message:'', type:'error' });

  const showToast = (message, type = 'error') => setToast({ visible:true, message, type });
  const hideToast = () => setToast(t => ({ ...t, visible:false }));
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Validation ──────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.name.trim()) {
      showToast('Please enter your full name.'); return false;
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      showToast('Please enter a valid email address.'); return false;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10-digit phone number.'); return false;
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.'); return false;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match. Please re-enter.'); return false;
    }
    return true;
  };

  // ── Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(form.phone);
      setStep(2);
      setCountdown(60);
      setOtpCode('');

      if (res.data.otp) {
        // Dev mode — backend returns OTP so you can test without SMS
        showToast(`Dev OTP: ${res.data.otp} (check backend console)`, 'info');
      } else {
        showToast(`OTP sent to ${form.phone}`, 'success');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not send OTP. Please try again.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setOtpCode('');
    await handleSendOtp();
  };

  // ── Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      showToast('Please enter the full 6-digit OTP.'); return;
    }
    setLoading(true);
    try {
      await authAPI.verifyOtp(form.phone, otpCode);
      setStep(3);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      showToast(msg);
      setOtpCode('');
    } finally {
      setLoading(false);
    }
  };

  // ── Final Register ───────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.district) {
      showToast('Please select your district.'); return;
    }
    setLoading(true);
    try {
      // Strip confirmPassword — backend doesn't need it
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, role: 'public' });
      // AuthContext → AppNavigator handles redirect automatically
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step labels ─────────────────────────────────────────────────
  const STEPS = ['Personal Info', 'Verify OTP', 'Your District'];

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      {/* ── Maroon header ── */}
      <View style={s.topBg}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
        >
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>

        <View style={s.logoCircle}>
          <Text style={{ fontSize: 32 }}>🏛️</Text>
        </View>
        <Text style={s.appName}>Create Account</Text>
        <Text style={s.tagline}>Join People Connect · Tamil Nadu</Text>

        {/* Step indicator */}
        <View style={s.stepsRow}>
          {STEPS.map((label, i) => {
            const num    = i + 1;
            const active = num === step;
            const done   = num < step;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.stepCircle, active && s.stepCircleActive, done && s.stepCircleDone]}>
                  <Text style={[s.stepNum, (active || done) && { color: done ? T.maroonD : T.maroon }]}>
                    {done ? '✓' : num}
                  </Text>
                </View>
                {i < 2 && (
                  <View style={[s.stepLine, done && { backgroundColor: '#fff' }]} />
                )}
              </View>
            );
          })}
        </View>
        <Text style={s.stepLabel}>{STEPS[step - 1]}</Text>
      </View>

      {/* ── White card ── */}
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

            {/* ════════ STEP 1 — Personal Info ════════ */}
            {step === 1 && (
              <>
                <Text style={s.cardTitle}>Personal Info</Text>
                <Text style={s.cardSub}>Fill in your details to get started</Text>

                <Field label="Full Name *"        icon="👤" value={form.name}            onChange={set('name')}            placeholder="Enter your full name" />
                <Field label="Email Address *"    icon="✉️" value={form.email}           onChange={set('email')}           placeholder="Enter your email"       keyboard="email-address" />
                <Field label="Phone Number *"     icon="📱" value={form.phone}           onChange={set('phone')}           placeholder="10-digit mobile number" keyboard="phone-pad" />
                <Field label="Password *"         icon="🔒" value={form.password}        onChange={set('password')}        placeholder="Minimum 6 characters"   secure />
                <Field label="Confirm Password *" icon="🔐" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter your password" secure />

                {/* Live password match indicator */}
                {form.confirmPassword.length > 0 && (
                  <View style={[
                    s.matchRow,
                    { backgroundColor: form.password === form.confirmPassword ? '#dcfce7' : '#fee2e2' },
                  ]}>
                    <Text>{form.password === form.confirmPassword ? '✅' : '❌'}</Text>
                    <Text style={[
                      s.matchText,
                      { color: form.password === form.confirmPassword ? '#16a34a' : '#dc2626' },
                    ]}>
                      {form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </View>
                )}

                <Field label="Address (Optional)" icon="🏠" value={form.address} onChange={set('address')} placeholder="Enter your address" />

                <TouchableOpacity
                  style={[s.btn, loading && { opacity: 0.7 }]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnText}>Send OTP →</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* ════════ STEP 2 — OTP Verification ════════ */}
            {step === 2 && (
              <>
                <Text style={s.cardTitle}>Verify Phone 📱</Text>
                <Text style={s.cardSub}>
                  Enter the 6-digit OTP sent to{'\n'}
                  <Text style={{ fontWeight: '800', color: T.text }}>{form.phone}</Text>
                </Text>

                <OtpInput value={otpCode} onChange={setOtpCode} />

                {/* Resend timer */}
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
                    : <Text style={s.btnText}>Verify OTP ✓</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)} style={s.changePh}>
                  <Text style={s.changePhTxt}>← Change phone number</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ════════ STEP 3 — District Selection ════════ */}
            {step === 3 && (
              <>
                <Text style={s.cardTitle}>Select District 📍</Text>
                <Text style={s.cardSub}>Choose the district where you reside</Text>

                <View style={s.districtGrid}>
                  {TN_DISTRICTS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[s.chip, form.district === d && s.chipActive]}
                      onPress={() => set('district')(d)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.chipText, form.district === d && { color: '#fff', fontWeight: '700' }]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Selected district badge */}
                {form.district !== '' && (
                  <View style={s.selectedBadge}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <Text style={s.selectedText}>
                      Selected: <Text style={{ fontWeight: '800' }}>{form.district}</Text>
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.btn, (!form.district || loading) && { opacity: 0.6 }]}
                  onPress={handleRegister}
                  disabled={!form.district || loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnText}>Create Account ✓</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            <Text style={s.footerText}>
              Already have an account?{' '}
              <Text
                style={{ color: T.maroon, fontWeight: '700' }}
                onPress={() => navigation.navigate('Login')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// OTP box styles
// ─────────────────────────────────────────────────────────────────
const ot = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
  box:      { width: 48, height: 56, borderRadius: 14, borderWidth: 2, borderColor: T.border, backgroundColor: T.bg, textAlign: 'center', fontSize: 22, fontWeight: '800', color: T.text },
  boxFilled:{ borderColor: T.maroon, backgroundColor: '#FFF8EE' },
});

// ─────────────────────────────────────────────────────────────────
// Field styles
// ─────────────────────────────────────────────────────────────────
const fs = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: T.textL, marginBottom: 8 },
  row:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14 },
  icon:  { fontSize: 16, marginRight: 10 },
});

// ─────────────────────────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.maroon },

  // Maroon header
  topBg:      { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28 },
  backBtn:    { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:    { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  logoCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appName:    { fontSize: 21, fontWeight: '900', color: '#fff' },
  tagline:    { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Step indicator
  stepsRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stepCircle:       { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#fff', borderColor: '#fff' },
  stepCircleDone:   { backgroundColor: T.gold, borderColor: T.gold },
  stepNum:          { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  stepLine:         { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  stepLabel:        { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 10 },

  // White card
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

  // Password match row
  matchRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: -8, marginBottom: 16 },
  matchText: { fontSize: 13, fontWeight: '600' },

  // Primary button
  btn:     { backgroundColor: T.maroon, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // OTP screen
  resendRow:   { alignItems: 'center', marginBottom: 16 },
  resendTimer: { fontSize: 13, color: T.textM },
  resendLink:  { fontSize: 13, color: T.textM },
  changePh:    { alignItems: 'center', marginTop: 16 },
  changePhTxt: { fontSize: 13, color: T.textM },

  // District
  districtGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip:               { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  chipActive:         { backgroundColor: T.maroon, borderColor: T.maroon },
  chipText:           { fontSize: 13, color: T.textL, fontWeight: '600' },
  selectedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF8E7', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#C9982A' },
  selectedText:       { fontSize: 14, color: T.maroonD },

  footerText: { textAlign: 'center', fontSize: 13, color: T.textL, marginTop: 20 },
});