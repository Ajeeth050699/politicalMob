import { complaintCategoryT, literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage': '🛣️',
  'Garbage Issue': '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue': '🚰',
  'Public Safety Issue': '🚨',
  'Others': '📝'
};

export default function WorkerDashboard({ navigation }) {
  const { userInfo, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await complaintAPI.getAll();
      setComplaints(data);
    } catch {/* silent */} finally {setLoading(false);}
  };

  useEffect(() => {load();}, []);
  const onRefresh = async () => {setRefreshing(true);await load();setRefreshing(false);};

  const newCnt = complaints.filter((c) => c.status === 'NEW').length;
  const acceptedCnt = complaints.filter((c) => c.status === 'ACCEPTED').length;
  const progressCnt = complaints.filter((c) => c.status === 'IN PROGRESS').length;
  const doneCnt = complaints.filter((c) => c.status === 'COMPLETED').length;
  const openCnt = complaints.length - doneCnt;
  const rate = complaints.length > 0 ? Math.round(doneCnt / complaints.length * 100) : 0;
  const nextComplaint = complaints.find((c) => c.status === 'NEW') || complaints.find((c) => c.status === 'ACCEPTED') || complaints.find((c) => c.status === 'IN PROGRESS');
  const categoryStats = Object.entries(
    complaints.reduce((acc, c) => {
      const key = c.category || 'Others';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const handleLogout = () => {
    logout();
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
    </View>);


  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}>
        
        {/* ── Hero Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL, '#B03A3A']} style={s.header}>
          <View style={s.headerTop}>
            <View style={s.workerAvatar}>
              <Text style={{ fontSize: 24 }}>👷</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.greetingTxt}>{greeting},</Text>
              <Text style={s.workerName}>{userInfo?.name}</Text>
              <Text style={s.thokuthiTxt}>{literalT("🏠 Thokuthi")}{userInfo?.thokuthi || 'N/A'} · 📍 {userInfo?.district || 'N/A'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Text style={s.logoutTxt}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            {[
            { label: 'New', count: newCnt, color: '#fca5a5', icon: '🆕' },
            { label: 'Accepted', count: acceptedCnt, color: '#fde68a', icon: '✓' },
            { label: 'Progress', count: progressCnt, color: '#93c5fd', icon: '⚙️' },
            { label: 'Done', count: doneCnt, color: '#86efac', icon: '✅' }].
            map(({ label, count, color, icon }) =>
            <View key={label} style={s.statCard}>
                <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
                <Text style={[s.statNum, { color }]}>{count}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            )}
          </View>

          {/* Resolution rate */}
          <View style={s.rateCard}>
            <View style={s.rateLeft}>
              <Text style={s.rateTitle}>{literalT("Resolution Rate")}</Text>
              <Text style={s.rateNum}>{rate}%</Text>
            </View>
            <View style={s.rateBarBg}>
              <View style={[s.rateBarFill, { width: `${rate}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {(!userInfo?.district || !userInfo?.ward || !userInfo?.thokuthi) &&
        <TouchableOpacity
          style={{ backgroundColor: '#FEF3C7', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F59E0B40' }}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}>
          
            <Text style={{ fontSize: 24, marginRight: 12 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#92400e', marginBottom: 2 }}>{literalT("Complete your profile")}</Text>
              <Text style={{ fontSize: 12, color: '#92400e' }}>{literalT("Tap here to update your Ward, Thokuthi, and District to receive proper complaint assignments.")}</Text>
            </View>
            <Text style={{ fontSize: 20, color: '#92400e' }}>›</Text>
          </TouchableOpacity>
        }

        <View style={s.section}>
          <View style={s.focusCard}>
            <View style={s.focusTop}>
              <View>
                <Text style={s.focusKicker}>{literalT("Today focus")}</Text>
                <Text style={s.focusTitle}>{openCnt}{literalT("open task")}{openCnt === 1 ? '' : 's'}</Text>
              </View>
              <View style={s.focusPill}>
                <Text style={s.focusPillTxt}>{rate}{literalT("% resolved")}</Text>
              </View>
            </View>
            {nextComplaint ?
            <TouchableOpacity
              style={s.nextTask}
              onPress={() => navigation.navigate('ComplaintDetail', { id: nextComplaint._id || nextComplaint.id })}
              activeOpacity={0.86}>
              
                <View style={s.nextIcon}>
                  <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[nextComplaint.category] || '📝'}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.nextTitle} numberOfLines={1}>{complaintCategoryT(nextComplaint.category, nextComplaint.customCategory)}</Text>
                  <Text style={s.nextMeta} numberOfLines={1}>{nextComplaint.status} · {nextComplaint.thokuthi || 'Thokuthi'} · {nextComplaint.district || 'District'}</Text>
                </View>
                <Text style={s.nextArrow}>›</Text>
              </TouchableOpacity> :

            <View style={s.nextTask}>
                <View style={s.nextIcon}><Text style={{ fontSize: 20 }}>✓</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.nextTitle}>{literalT("No pending field work")}</Text>
                  <Text style={s.nextMeta}>{literalT("New assignments will appear here.")}</Text>
                </View>
              </View>
            }
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{literalT("Quick Actions")}</Text>
          <View style={s.qGrid}>
            {[
            { icon: '📋', label: 'All Complaints', color: T.maroon, onPress: () => navigation.navigate('Complaints') },
            { icon: '⚡', label: 'Start Work', color: '#8b5cf6', onPress: () => navigation.navigate('Complaints') },
            { icon: '👤', label: 'My Profile', color: T.blue, onPress: () => navigation.navigate('Profile') }].
            map(({ icon, label, color, onPress }) =>
            <TouchableOpacity key={label} style={s.qCard} onPress={onPress} activeOpacity={0.8}>
                <View style={[s.qIcon, { backgroundColor: color + '15' }]}>
                  <Text style={{ fontSize: 24 }}>{icon}</Text>
                </View>
                <Text style={s.qLabel}>{label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>{literalT("Work Mix")}</Text>
            <Text style={s.sectionHint}>{complaints.length}{literalT("total")}</Text>
          </View>
          {categoryStats.length === 0 ?
          <View style={s.mixEmpty}>
              <Text style={s.mixEmptyTitle}>{literalT("No category data yet")}</Text>
              <Text style={s.mixEmptySub}>{literalT("Accepted complaints will build your work mix.")}</Text>
            </View> :

          <View style={s.mixGrid}>
              {categoryStats.map(([category, count]) =>
            <View key={category} style={s.mixCard}>
                  <Text style={s.mixIcon}>{CATEGORY_ICONS[category] || '📝'}</Text>
                  <Text style={s.mixName} numberOfLines={2}>{complaintCategoryT(category)}</Text>
                  <Text style={s.mixCount}>{count}</Text>
                </View>
            )}
            </View>
          }
        </View>

        {/* ── Recent complaints ── */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>{literalT("Recent Complaints")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Complaints')}>
              <Text style={s.seeAll}>{literalT("See all →")}</Text>
            </TouchableOpacity>
          </View>

          {complaints.length === 0 ?
          <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
              <Text style={s.emptyTxt}>{literalT("No complaints assigned yet")}</Text>
            </View> :
          complaints.slice(0, 5).map((c) => {
            const sc = STATUS_COLORS[c.status] || { bg: '#f3f4f6', color: '#6b7280' };
            const catIcon = CATEGORY_ICONS[c.category] || '📝';
            return (
              <TouchableOpacity
                key={c.id}
                style={s.complaintCard}
                onPress={() => navigation.navigate('ComplaintDetail', { id: c._id || c.id })}
                activeOpacity={0.85}>
                
                <View style={[s.complaintIcon, { backgroundColor: T.maroon + '12' }]}>
                  <Text style={{ fontSize: 20 }}>{catIcon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.complaintCat} numberOfLines={1}>{complaintCategoryT(c.category, c.customCategory)}</Text>
                  <Text style={s.complaintMeta}>📍 {c.thokuthi} · 🏙️ {c.district}</Text>
                </View>
                <View style={[s.complaintBadge, { backgroundColor: sc.bg || '#f3f4f6' }]}>
                  <Text style={[s.complaintBadgeTxt, { color: sc.color }]}>{c.status}</Text>
                </View>
              </TouchableOpacity>);

          })}
        </View>
      </ScrollView>
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  workerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  greetingTxt: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  workerName: { fontSize: 18, fontWeight: '900', color: '#fff' },
  thokuthiTxt: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutTxt: { fontSize: 18 },

  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  rateCard: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rateLeft: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rateTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  rateNum: { fontSize: 14, fontWeight: '900', color: '#86efac' },
  rateBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  rateBarFill: { height: '100%', backgroundColor: '#86efac', borderRadius: 4 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  sectionHint: { fontSize: 12, color: T.textM, fontWeight: '700' },
  seeAll: { fontSize: 13, color: T.maroon, fontWeight: '700' },

  focusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  focusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  focusKicker: { fontSize: 11, color: T.textM, fontWeight: '800', textTransform: 'uppercase' },
  focusTitle: { fontSize: 20, color: T.text, fontWeight: '900', marginTop: 2 },
  focusPill: { backgroundColor: T.green + '18', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50 },
  focusPillTxt: { color: '#15803d', fontSize: 11, fontWeight: '900' },
  nextTask: { minHeight: 58, backgroundColor: T.bg, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  nextTitle: { fontSize: 13, fontWeight: '900', color: T.text },
  nextMeta: { fontSize: 11, color: T.textM, marginTop: 2, fontWeight: '600' },
  nextArrow: { fontSize: 22, color: T.maroon, fontWeight: '900' },

  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  qCard: { width: '31.5%', minHeight: 106, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border, elevation: 2 },
  qIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qLabel: { fontSize: 12, fontWeight: '800', color: T.text, textAlign: 'center' },

  mixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mixCard: { width: '48.5%', minHeight: 104, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: T.border },
  mixIcon: { fontSize: 22, marginBottom: 8 },
  mixName: { color: T.text, fontSize: 12, fontWeight: '800', lineHeight: 16, minHeight: 32 },
  mixCount: { marginTop: 8, color: T.maroon, fontSize: 18, fontWeight: '900' },
  mixEmpty: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  mixEmptyTitle: { color: T.text, fontSize: 14, fontWeight: '900' },
  mixEmptySub: { color: T.textM, fontSize: 12, marginTop: 4, fontWeight: '600' },

  complaintCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  complaintIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  complaintCat: { fontSize: 14, fontWeight: '700', color: T.text },
  complaintMeta: { fontSize: 11, color: T.textM, marginTop: 3 },
  complaintBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  complaintBadgeTxt: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyTxt: { fontSize: 14, color: T.textM, marginTop: 6 }
});
