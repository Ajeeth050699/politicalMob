import { literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Platform, StatusBar, Alert } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { emergencyAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const TYPE_META = {
  police: { icon: '🚔', color: '#3b82f6', bg: '#dbeafe', label: 'Police' },
  ambulance: { icon: '🚑', color: '#ef4444', bg: '#fee2e2', label: 'Ambulance' },
  fire: { icon: '🚒', color: '#f59e0b', bg: '#fef3c7', label: 'Fire' },
  women: { icon: '👩', color: '#ec4899', bg: '#fce7f3', label: 'Women Helpline' },
  child: { icon: '👶', color: '#8b5cf6', bg: '#ede9fe', label: 'Child Helpline' },
  district: { icon: '🏢', color: '#22c55e', bg: '#dcfce7', label: 'District Control' }
};

export default function EmergencyScreen({ navigation }) {
  const { userInfo } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = String(userInfo?.role || '').toLowerCase();

  useEffect(() => {
    emergencyAPI.getAll().
    then(({ data }) => setContacts(data)).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const handleCall = (name, number) => {
    Alert.alert(
      `📞 Call ${name}?`,
      `You are about to call ${number}`,
      [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${number}`) }]

    );
  };

  const goDashboard = () => {
    if (role === 'admin' || role === 'superadmin' || role === 'agent') {
      navigation.navigate('AdminTabs', { screen: 'Dashboard' });
      return;
    }
    if (role === 'public' || role === 'citizen') {
      navigation.navigate('Home');
      return;
    }
    navigation.navigate('WorkerTabs', { screen: 'Dashboard' });
  };

  const renderItem = ({ item: c }) => {
    const meta = TYPE_META[c.type] || { icon: '📞', color: T.maroon, bg: '#fee2e2', label: 'Helpline' };
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: meta.color, borderLeftWidth: 4 }]}
        onPress={() => handleCall(c.name, c.number)}
        activeOpacity={0.85}>
        
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 30 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{c.name}</Text>
          <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
            <Text style={[s.typeTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={s.numberBox}>
          <Text style={[s.number, { color: meta.color }]}>{c.number}</Text>
          <View style={[s.callBtn, { backgroundColor: meta.color }]}>
            <Text style={s.callTxt}>{literalT("📞 Call")}</Text>
          </View>
        </View>
      </TouchableOpacity>);

  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>{literalT("Loading contacts...")}</Text>
    </View>);


  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={['#dc2626', T.maroon]} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={goDashboard} activeOpacity={0.82}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.alertBadge}>
          <Text style={s.alertTxt}>{literalT("🆘 EMERGENCY SERVICES")}</Text>
        </View>
        </View>
        <Text style={s.headerTitle}>{literalT("Emergency Contacts")}</Text>
        <Text style={s.headerSub}>{literalT("Tap any contact to call directly")}</Text>

        {/* Quick dial row */}
        <View style={s.quickRow}>
          {contacts.slice(0, 3).map((c) => {
            const meta = TYPE_META[c.type] || { icon: '📞', color: '#fff' };
            return (
              <TouchableOpacity
                key={c.name}
                style={s.quickBtn}
                onPress={() => Linking.openURL(`tel:${c.number}`)}
                activeOpacity={0.8}>
                
                <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
                <Text style={s.quickNum}>{c.number}</Text>
                <Text style={s.quickName}>{c.name.split(' ')[0]}</Text>
              </TouchableOpacity>);

          })}
        </View>
      </LinearGradient>

      {/* ── Warning banner ── */}
      <View style={s.warningBanner}>
        <Text style={{ fontSize: 14 }}>⚠️</Text>
        <Text style={s.warningTxt}>{literalT("Only call in genuine emergencies. Misuse is a criminal offence.")}</Text>
      </View>

      {/* ── Full List ── */}
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.name}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={renderItem}
        ListEmptyComponent={
        <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>📞</Text>
            <Text style={s.emptyTitle}>{literalT("No contacts available")}</Text>
          </View>
        } />
      
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  alertBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50 },
  alertTxt: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 18 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  quickNum: { fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 6 },
  quickName: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E7', borderBottomWidth: 1, borderBottomColor: '#C9982A', paddingHorizontal: 16, paddingVertical: 10 },
  warningTxt: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 17 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  iconBox: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 6 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  typeTxt: { fontSize: 11, fontWeight: '700' },
  numberBox: { alignItems: 'flex-end', gap: 8 },
  number: { fontSize: 22, fontWeight: '900' },
  callBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  callTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text }
});
