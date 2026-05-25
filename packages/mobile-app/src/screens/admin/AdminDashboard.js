import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI, workerAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard({ navigation }) {
  const { userInfo, logout } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    newComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    totalWorkers: 0,
    activeWorkers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [complaintRes, workerRes] = await Promise.all([
        complaintAPI.getAll(),
        workerAPI.getAll(),
      ]);

      const complaints = complaintRes.data || [];
      const workers = workerRes.data || [];

      setStats({
        totalComplaints: complaints.length,
        newComplaints: complaints.filter(c => c.status === 'NEW').length,
        inProgressComplaints: complaints.filter(c => c.status === 'IN PROGRESS').length,
        completedComplaints: complaints.filter(c => c.status === 'COMPLETED').length,
        totalWorkers: workers.length,
        activeWorkers: workers.filter(w => w.status === 'active').length,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const completionRate = stats.totalComplaints > 0 
    ? Math.round((stats.completedComplaints / stats.totalComplaints) * 100)
    : 0;

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
            <View style={s.adminAvatar}>
              <Text style={{ fontSize: 24 }}>👨‍💼</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.greetingTxt}>Welcome back,</Text>
              <Text style={s.adminName}>{userInfo?.name}</Text>
              <Text style={s.thokuthiTxt}>📍 {userInfo?.district || 'TN'} Admin</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Text style={s.logoutTxt}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Completion Rate Card */}
          <View style={s.completionCard}>
            <View style={s.completionLeft}>
              <Text style={s.completionTitle}>Overall Completion</Text>
              <Text style={s.completionNum}>{completionRate}%</Text>
            </View>
            <View style={s.completionBarBg}>
              <View style={[s.completionBarFill, { width: `${completionRate}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats Grid ── */}
        <View style={s.statsGridContainer}>
          <View style={[s.statCard, s.complaintCard]}>
            <Text style={s.statIcon}>📋</Text>
            <Text style={s.statNumber}>{stats.totalComplaints}</Text>
            <Text style={s.statLabel}>Total Complaints</Text>
          </View>
          <View style={[s.statCard, s.newCard]}>
            <Text style={s.statIcon}>🆕</Text>
            <Text style={s.statNumber}>{stats.newComplaints}</Text>
            <Text style={s.statLabel}>New</Text>
          </View>
          <View style={[s.statCard, s.progressCard]}>
            <Text style={s.statIcon}>⚙️</Text>
            <Text style={s.statNumber}>{stats.inProgressComplaints}</Text>
            <Text style={s.statLabel}>In Progress</Text>
          </View>
          <View style={[s.statCard, s.doneCard]}>
            <Text style={s.statIcon}>✅</Text>
            <Text style={s.statNumber}>{stats.completedComplaints}</Text>
            <Text style={s.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Workers Section ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>👷 Workers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminWorkers')}>
              <Text style={s.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={s.workerStats}>
            <View style={s.workerStatItem}>
              <Text style={s.workerStatNumber}>{stats.totalWorkers}</Text>
              <Text style={s.workerStatLabel}>Total Workers</Text>
            </View>
            <View style={s.workerStatItem}>
              <Text style={[s.workerStatNumber, { color: T.green }]}>{stats.activeWorkers}</Text>
              <Text style={s.workerStatLabel}>Active Now</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🚀 Quick Actions</Text>
          <View style={s.actionsGrid}>
            <TouchableOpacity
              style={s.actionCard}
              onPress={() => navigation.navigate('AdminComplaints')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#f59e0b22', '#f59e0b11']} style={s.actionCardBg}>
                <Text style={s.actionIcon}>📋</Text>
                <Text style={s.actionTitle}>All Complaints</Text>
                <Text style={s.actionDesc}>View and filter</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionCard}
              onPress={() => navigation.navigate('AdminWorkers')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#3b82f622', '#3b82f611']} style={s.actionCardBg}>
                <Text style={s.actionIcon}>👷</Text>
                <Text style={s.actionTitle}>Workers</Text>
                <Text style={s.actionDesc}>Manage team</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionCard}
              onPress={() => navigation.navigate('AdminComplaints')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#22c55e22', '#22c55e11']} style={s.actionCardBg}>
                <Text style={s.actionIcon}>✅</Text>
                <Text style={s.actionTitle}>Resolved</Text>
                <Text style={s.actionDesc}>{stats.completedComplaints} completed</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionCard}
              onPress={() => navigation.navigate('AdminComplaints')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#8b5cf622', '#8b5cf611']} style={s.actionCardBg}>
                <Text style={s.actionIcon}>⚙️</Text>
                <Text style={s.actionTitle}>In Progress</Text>
                <Text style={s.actionDesc}>{stats.inProgressComplaints} active</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <Text style={s.sectionTitle}>📊 Dashboard Insights</Text>
          
          <View style={s.insightCard}>
            <View style={s.insightIcon}>
              <Text style={{ fontSize: 24 }}>📈</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.insightTitle}>Completion Rate</Text>
              <Text style={s.insightValue}>{completionRate}% of all complaints resolved</Text>
            </View>
          </View>

          <View style={s.insightCard}>
            <View style={s.insightIcon}>
              <Text style={{ fontSize: 24 }}>⏳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.insightTitle}>Pending Tasks</Text>
              <Text style={s.insightValue}>{stats.newComplaints + stats.inProgressComplaints} complaints need attention</Text>
            </View>
          </View>

          <View style={s.insightCard}>
            <View style={s.insightIcon}>
              <Text style={{ fontSize: 24 }}>👥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.insightTitle}>Active Team</Text>
              <Text style={s.insightValue}>{stats.activeWorkers} out of {stats.totalWorkers} workers active</Text>
            </View>
          </View>
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
  adminAvatar:{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  greetingTxt:{ fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  adminName:  { fontSize: 18, fontWeight: '900', color: '#fff' },
  thokuthiTxt:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutTxt:  { fontSize: 18 },

  completionCard: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  completionLeft: { flex: 1 },
  completionTitle:{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  completionNum:  { fontSize: 20, fontWeight: '900', color: '#E8B84B' },
  completionBarBg:{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  completionBarFill:{ height: '100%', backgroundColor: '#E8B84B', borderRadius: 4 },

  statsGridContainer:{ paddingHorizontal: 12, paddingVertical: 16, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:   { flex: 1, minWidth: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border, elevation: 2 },
  complaintCard:{ borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  newCard:    { borderLeftWidth: 4, borderLeftColor: '#fca5a5' },
  progressCard:{ borderLeftWidth: 4, borderLeftColor: '#8b5cf6' },
  doneCard:   { borderLeftWidth: 4, borderLeftColor: '#86efac' },
  statIcon:   { fontSize: 22, marginBottom: 6 },
  statNumber: { fontSize: 18, fontWeight: '900', color: T.text },
  statLabel:  { fontSize: 10, color: T.textM, marginTop: 2, fontWeight: '600' },

  section:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: T.text },
  seeAll:       { fontSize: 12, color: T.maroon, fontWeight: '700' },

  workerStats: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  workerStatItem:{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  workerStatNumber:{ fontSize: 18, fontWeight: '900', color: T.maroon },
  workerStatLabel: { fontSize: 10, color: T.textM, marginTop: 4, fontWeight: '600' },

  actionsGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  actionCard: { flex: 1, minWidth: '47%', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  actionCardBg:{ padding: 14, alignItems: 'center' },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionTitle:{ fontSize: 12, fontWeight: '700', color: T.text, textAlign: 'center' },
  actionDesc: { fontSize: 10, color: T.textM, marginTop: 2, textAlign: 'center' },

  insightCard:{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: T.border },
  insightIcon:{ width: 40, height: 40, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  insightTitle:{ fontSize: 12, fontWeight: '700', color: T.text },
  insightValue:{ fontSize: 11, color: T.textM, marginTop: 2 },
});
