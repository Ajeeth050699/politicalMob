import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../constants/theme';
import { useLang } from '../../context/LanguageContext';

const ROLE_META = {
  public: { label: 'CITIZEN',  icon: '👤', color: T.gold    },
  worker: { label: 'WORKER',   icon: '👷', color: '#3b82f6' },
  admin:  { label: 'ADMIN',    icon: '🛡️', color: '#8b5cf6' },
};

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { userInfo, updateProfile, logout } = useAuth();

  const [name,   setName]   = useState(userInfo?.name  || '');
  const [email,  setEmail]  = useState(userInfo?.email || '');
  const [phone,  setPhone]  = useState(userInfo?.phone || '');
  const [saving, setSaving] = useState(false);

  const { lang, changeLang } = useLang();
  const role = ROLE_META[userInfo?.role] || ROLE_META.public;

  const handleSave = async () => {
    if (!name.trim())  { Alert.alert('Required', 'Name cannot be empty.');  return; }
    if (!email.trim()) { Alert.alert('Required', 'Email cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateProfile({ name, email, phone });
      Alert.alert('✅ Updated!', 'Your profile has been saved successfully.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '🚪 Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backTxt}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Avatar */}
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 36 }}>{role.icon}</Text>
            </View>
          </View>

          {/* Name + role */}
          <Text style={s.userName}>{userInfo?.name}</Text>
          <Text style={s.userEmail}>{userInfo?.email}</Text>

          <View style={[s.roleBadge, { backgroundColor: role.color }]}>
            <Text style={s.roleTxt}>{role.label}</Text>
          </View>

          {/* Info pills */}
          <View style={s.pillRow}>
            {userInfo?.district && (
              <View style={s.pill}>
                <Text style={s.pillTxt}>📍 {userInfo.district}</Text>
              </View>
            )}
            {userInfo?.booth && (
              <View style={s.pill}>
                <Text style={s.pillTxt}>🏠 {userInfo.booth}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={s.body}>

          {/* ── Edit section ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>✏️ Edit Profile</Text>

            {[
              { label: 'Full Name',     icon: '👤', value: name,  setter: setName,  placeholder: 'Enter your name',    kb: 'default'       },
              { label: 'Email Address', icon: '✉️', value: email, setter: setEmail, placeholder: 'Enter your email',   kb: 'email-address' },
              { label: 'Phone Number',  icon: '📱', value: phone, setter: setPhone, placeholder: 'Enter phone number', kb: 'phone-pad'     },
            ].map(({ label, icon, value, setter, placeholder, kb }) => (
              <View key={label} style={{ marginBottom: 14 }}>
                <Text style={s.label}>{label}</Text>
                <View style={s.inputRow}>
                  <Text style={s.inputIcon}>{icon}</Text>
                  <TextInput
                    style={s.input}
                    value={value}
                    onChangeText={setter}
                    placeholder={placeholder}
                    placeholderTextColor={T.textM}
                    keyboardType={kb}
                    autoCapitalize={kb === 'email-address' ? 'none' : 'words'}
                  />
                  {label === 'Phone Number' && (
                    !userInfo.isPhoneVerified ? (
                      <TouchableOpacity onPress={() => navigation.navigate('Verify', { phone: userInfo.phone })}>
                        <Text style={{ color: T.gold, fontWeight: 'bold' }}>Verify</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: 'green', fontWeight: 'bold' }}>✓ Verified</Text>
                    )
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[T.maroon, T.maroonL]} style={s.saveBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.saveBtnTxt}>💾 Save Changes</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Account info (read-only) ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 Account Info</Text>
            {[
              { label: 'Role',     value: userInfo?.role?.toUpperCase(), icon: role.icon },
              { label: 'District', value: userInfo?.district || '—',     icon: '📍'      },
              { label: 'Booth',    value: userInfo?.booth    || '—',     icon: '🏠'      },
            ].map(({ label, value, icon }) => (
              <View key={label} style={s.infoRow}>
                <Text style={s.infoIcon}>{icon}</Text>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoVal}>{value}</Text>
              </View>
            ))}
          </View>

          {/* ── Language ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🌐 Language / மொழி</Text>
            <View style={langS.row}>
              {[
                { code:'en', label:'English', sub:'English' },
                { code:'ta', label:'தமிழ்',   sub:'Tamil'   },
              ].map(({ code, label, sub }) => {
                const active = lang === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[langS.btn, active && langS.btnActive]}
                    onPress={() => changeLang(code)}
                    activeOpacity={0.85}
                  >
                    <Text style={[langS.label, active && { color:'#fff' }]}>{label}</Text>
                    <Text style={[langS.sub, active && { color:'rgba(255,255,255,0.75)' }]}>{sub}</Text>
                    {active && <View style={langS.checkBadge}><Text style={{ fontSize:12 }}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={s.logoutTxt}>🚪 Logout</Text>
          </TouchableOpacity>

          <Text style={s.version}>People Connect v1.0 · Tamil Nadu</Text>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },

  header:     { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24 },
  backBtn:    { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:    { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },

  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, marginTop: 20 },
  avatar:     { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  userName:   { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  userEmail:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
  roleBadge:  { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 50, marginBottom: 14 },
  roleTxt:    { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  pillRow:    { flexDirection: 'row', gap: 10 },
  pill:       { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pillTxt:    { color: '#fff', fontSize: 12, fontWeight: '600' },

  body:         { padding: 16 },
  section:      { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 16 },

  label:      { fontSize: 13, fontWeight: '700', color: T.textL, marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14 },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 15, color: T.text },

  saveBtn:     { borderRadius: 50, overflow: 'hidden', marginTop: 4, elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  saveBtnTxt:  { fontSize: 16, fontWeight: '800', color: '#fff' },

  infoRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  infoIcon:   { fontSize: 18, width: 32 },
  infoLabel:  { fontSize: 14, color: T.textM, flex: 1 },
  infoVal:    { fontSize: 14, fontWeight: '700', color: T.text },

  logoutBtn:  { backgroundColor: '#fff', borderRadius: 50, borderWidth: 2, borderColor: T.red + '60', paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  logoutTxt:  { fontSize: 16, fontWeight: '800', color: T.red },
  version:    { textAlign: 'center', fontSize: 12, color: T.textM },
});

const langS = StyleSheet.create({
  row:       { flexDirection:'row', gap:12 },
  btn:       { flex:1, borderRadius:16, borderWidth:2, borderColor:T.border, padding:16, alignItems:'center', backgroundColor:T.bg },
  btnActive: { backgroundColor:T.maroon, borderColor:T.maroon },
  label:     { fontSize:18, fontWeight:'800', color:T.text, marginBottom:4 },
  sub:       { fontSize:12, color:T.textM },
  checkBadge:{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:11, backgroundColor:'rgba(255,255,255,0.25)', alignItems:'center', justifyContent:'center' },
});
