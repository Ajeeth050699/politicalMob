import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage':          '🛣️',
  'Garbage Issue':        '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue':       '🚰',
  'Public Safety Issue':  '🚨',
  'Others':               '📝',
};

export default function WorkerDashboard({ navigation }) {
  const { userInfo, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await complaintAPI.getAll();
      setComplaints(data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const newCnt      = complaints.filter(c => c.status === 'NEW').length;
  const progressCnt = complaints.filter(c => c.status === 'IN PROGRESS').length;
  const doneCnt     = complaints.filter(c => c.status === 'COMPLETED').length;
  const rate        = complaints.length > 0 ? Math.round((doneCnt / complaints.length) * 100) : 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const handleLogout = () => {
    logout();
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
      >
        {/* ── Hero Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL, '#B03A3A']} style={s.header}>
          <View style={s.headerTop}>
            <View style={s.workerAvatar}>
              <Text style={{ fontSize: 24 }}>👷</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.greetingTxt}>{greeting},</Text>
              <Text style={s.workerName}>{userInfo?.name}</Text>
              <Text style={s.boothTxt}>🏠 Booth {userInfo?.booth || 'N/A'} · 📍 {userInfo?.district || 'N/A'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Text style={s.logoutTxt}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            {[
              { label: 'New',       count: newCnt,      color: '#fca5a5', icon: '🆕' },
              { label: 'Progress',  count: progressCnt, color: '#93c5fd', icon: '⚙️' },
              { label: 'Completed', count: doneCnt,     color: '#86efac', icon: '✅' },
              { label: 'Total',     count: complaints.length, color: '#fff', icon: '📋' },
            ].map(({ label, count, color, icon }) => (
              <View key={label} style={s.statCard}>
                <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
                <Text style={[s.statNum, { color }]}>{count}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Resolution rate */}
          <View style={s.rateCard}>
            <View style={s.rateLeft}>
              <Text style={s.rateTitle}>Resolution Rate</Text>
              <Text style={s.rateNum}>{rate}%</Text>
            </View>
            <View style={s.rateBarBg}>
              <View style={[s.rateBarFill, { width: `${rate}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.qGrid}>
            {[
              { icon: '📋', label: 'All Complaints', color: T.maroon, onPress: () => navigation.navigate('Complaints') },
              { icon: '👤', label: 'My Profile',     color: T.blue,   onPress: () => navigation.navigate('Profile')    },
            ].map(({ icon, label, color, onPress }) => (
              <TouchableOpacity key={label} style={s.qCard} onPress={onPress} activeOpacity={0.8}>
                <View style={[s.qIcon, { backgroundColor: color + '15' }]}>
                  <Text style={{ fontSize: 24 }}>{icon}</Text>
                </View>
                <Text style={s.qLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent complaints ── */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Recent Complaints</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Complaints')}>
              <Text style={s.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {complaints.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
              <Text style={s.emptyTxt}>No complaints assigned yet</Text>
            </View>
          ) : complaints.slice(0, 5).map((c) => {
            const sc      = STATUS_COLORS[c.status] || { bg: '#f3f4f6', color: '#6b7280' };
            const catIcon = CATEGORY_ICONS[c.category] || '📝';
            return (
              <TouchableOpacity
                key={c.id}
                style={s.complaintCard}
                onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
                activeOpacity={0.85}
              >
                <View style={[s.complaintIcon, { backgroundColor: T.maroon + '12' }]}>
                  <Text style={{ fontSize: 20 }}>{catIcon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.complaintCat} numberOfLines={1}>{c.category}</Text>
                  <Text style={s.complaintMeta}>📍 {c.booth} · 🏙️ {c.district}</Text>
                </View>
                <View style={[s.complaintBadge, { backgroundColor: sc.bg + 'cc' }]}>
                  <Text style={[s.complaintBadgeTxt, { color: sc.color }]}>{c.status}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:     { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  workerAvatar:{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  greetingTxt:{ fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  workerName: { fontSize: 18, fontWeight: '900', color: '#fff' },
  boothTxt:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutTxt:  { fontSize: 18 },

  statsGrid:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statNum:    { fontSize: 20, fontWeight: '900' },
  statLabel:  { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  rateCard:   { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rateLeft:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rateTitle:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  rateNum:    { fontSize: 14, fontWeight: '900', color: '#86efac' },
  rateBarBg:  { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  rateBarFill:{ height: '100%', backgroundColor: '#86efac', borderRadius: 4 },

  section:      { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  seeAll:       { fontSize: 13, color: T.maroon, fontWeight: '700' },

  qGrid:  { flexDirection: 'row', gap: 12, marginBottom: 4 },
  qCard:  { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: T.border, elevation: 2 },
  qIcon:  { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qLabel: { fontSize: 13, fontWeight: '700', color: T.text },

  complaintCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  complaintIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  complaintCat:     { fontSize: 14, fontWeight: '700', color: T.text },
  complaintMeta:    { fontSize: 11, color: T.textM, marginTop: 3 },
  complaintBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  complaintBadgeTxt:{ fontSize: 11, fontWeight: '700' },

  empty:    { alignItems: 'center', paddingVertical: 32 },
  emptyTxt: { fontSize: 14, color: T.textM, marginTop: 6 },
});