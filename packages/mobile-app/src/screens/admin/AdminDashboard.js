import { complaintCategoryT, literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI, dashboardAPI, notificationAPI, workerAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
  NEW: { label: 'New', color: T.amber, bg: '#FEF3C7' },
  ACCEPTED: { label: 'Accepted', color: T.blue, bg: '#DBEAFE' },
  'IN PROGRESS': { label: 'In Progress', color: '#8b5cf6', bg: '#EDE9FE' },
  COMPLETED: { label: 'Completed', color: T.green, bg: '#DCFCE7' }
};

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage': '🛣️',
  'Garbage Issue': '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue': '🚰',
  'Public Safety Issue': '🚨',
  Others: '📝'
};

function StatTile({ label, value, sub, color, icon, onPress }) {
  return (
    <TouchableOpacity
      style={s.statTile}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      disabled={!onPress}>
      
      <View style={s.cardTopLight} />
      <View style={s.cardBottomShade} />
      <View style={[s.statIconBox, { backgroundColor: color + '18' }]}>
        <Text style={s.statIcon}>{icon}</Text>
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      {!!sub && <Text style={s.statSub} numberOfLines={1}>{sub}</Text>}
    </TouchableOpacity>);

}

function SectionHeader({ title, action, onPress }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action &&
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      }
    </View>);

}

export default function AdminDashboard({ navigation }) {
  const { userInfo, logout } = useAuth();
  const [stats, setStats] = useState({
    totalComplaints: 0,
    newComplaints: 0,
    acceptedComplaints: 0,
    inProgressComplaints: 0,
    completedComplaints: 0,
    totalWorkers: 0,
    activeWorkers: 0
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [
      statRes,
      weeklyRes,
      categoryRes,
      districtRes,
      recentRes,
      workerRes,
      notifRes] =
      await Promise.all([
      dashboardAPI.getStats().catch(() => null),
      dashboardAPI.getWeekly().catch(() => null),
      dashboardAPI.getByCategory().catch(() => null),
      dashboardAPI.getDistrictPerf().catch(() => null),
      dashboardAPI.getRecentComplaints().catch(() => null),
      workerAPI.getAll().catch(() => ({ data: [] })),
      notificationAPI.getAll({ limit: 5, status: 'ALL' }).catch(() => ({ data: { data: [] } }))]
      );

      let complaints = Array.isArray(recentRes?.data) ? recentRes.data : [];
      let computedStats = {
        totalComplaints: statRes?.data?.totalComplaints || 0,
        newComplaints: statRes?.data?.pending || 0,
        acceptedComplaints: 0,
        inProgressComplaints: statRes?.data?.inProgress || 0,
        completedComplaints: statRes?.data?.completed || 0,
        totalWorkers: workerRes.data?.length || 0,
        activeWorkers: statRes?.data?.activeWorkers || workerRes.data?.filter((w) => w.status === 'active').length || 0
      };

      if (!statRes || !recentRes) {
        const complaintRes = await complaintAPI.getAll().catch(() => ({ data: [] }));
        const allComplaints = complaintRes.data || [];
        complaints = allComplaints.slice(0, 10);
        computedStats = {
          ...computedStats,
          totalComplaints: allComplaints.length,
          newComplaints: allComplaints.filter((c) => c.status === 'NEW').length,
          acceptedComplaints: allComplaints.filter((c) => c.status === 'ACCEPTED').length,
          inProgressComplaints: allComplaints.filter((c) => c.status === 'IN PROGRESS').length,
          completedComplaints: allComplaints.filter((c) => c.status === 'COMPLETED').length
        };
      }

      setStats(computedStats);
      setWeekly(Array.isArray(weeklyRes?.data) ? weeklyRes.data : []);
      setCategories(Array.isArray(categoryRes?.data) ? categoryRes.data : []);
      setDistricts(Array.isArray(districtRes?.data) ? districtRes.data : []);
      setRecentComplaints(Array.isArray(complaints) ? complaints.slice(0, 6) : []);

      const notifs = notifRes.data?.data || notifRes.data || [];
      setRecentNotifications(Array.isArray(notifs) ? notifs.slice(0, 3) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {load();}, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const completionRate = stats.totalComplaints > 0 ?
  Math.round(stats.completedComplaints / stats.totalComplaints * 100) :
  0;
  const attentionCount = stats.newComplaints + stats.acceptedComplaints + stats.inProgressComplaints;
  const activeWorkerRate = stats.totalWorkers > 0 ?
  Math.round(stats.activeWorkers / stats.totalWorkers * 100) :
  0;
  const maxWeekly = Math.max(1, ...weekly.map((w) => Math.max(w.complaints || 0, w.resolved || 0)));

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={s.loadingText}>{literalT("Loading admin dashboard...")}</Text>
      </View>);

  }

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroonD} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}>
        
        <LinearGradient colors={[T.maroonD, T.maroon, '#B23A2F']} style={s.header}>
          <View style={s.headerTop}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{(userInfo?.name || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.headerCopy}>
              <Text style={s.greeting}>{greeting}</Text>
              <Text style={s.adminName} numberOfLines={1}>{userInfo?.name || 'Admin'}</Text>
              <View style={s.adminMetaRow}>
                <Text style={s.adminMetaChip}>📍 {userInfo?.district || 'Tamil Nadu'}</Text>
                <Text style={s.adminMetaChip}>{literalT("Administration")}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={logout} style={s.headerButton} activeOpacity={0.75}>
              <Text style={s.headerButtonTxt}>⎋</Text>
            </TouchableOpacity>
          </View>

          <View style={s.healthPanel}>
            <View>
              <Text style={s.healthLabel}>{literalT("Resolution rate")}</Text>
              <Text style={s.healthValue}>{completionRate}%</Text>
            </View>
            <View style={s.healthRight}>
              <Text style={s.healthNote}>{attentionCount}{literalT("need attention")}</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${completionRate}%` }]} />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={s.statGrid}>
          <StatTile label={literalT("Total")} value={stats.totalComplaints} sub={literalT("Complaints")} color={T.maroon} icon="📋" onPress={() => navigation.navigate('AdminComplaints')} />
          <StatTile label={literalT("New")} value={stats.newComplaints} sub={literalT("Unassigned")} color={T.amber} icon="🆕" onPress={() => navigation.navigate('AdminComplaints', { status: 'NEW' })} />
          <StatTile label={literalT("Progress")} value={stats.inProgressComplaints} sub={literalT("Active work")} color="#8b5cf6" icon="⚙️" onPress={() => navigation.navigate('AdminComplaints', { status: 'IN PROGRESS' })} />
          <StatTile label={literalT("Done")} value={stats.completedComplaints} sub={literalT("Resolved")} color={T.green} icon="✓" onPress={() => navigation.navigate('AdminComplaints', { status: 'COMPLETED' })} />
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Operations")} />
          <View style={s.opsGrid}>
            <TouchableOpacity style={s.opsCard} onPress={() => navigation.navigate('AdminComplaints')} activeOpacity={0.82}>
              <View style={s.cardTopLight} />
              <View style={s.cardBottomShade} />
              <Text style={s.opsIcon}>🔎</Text>
              <Text style={s.opsTitle}>{literalT("Review Complaints")}</Text>
              <Text style={s.opsSub}>{literalT("Filter by thokuthi, status, and search.")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.opsCard} onPress={() => navigation.navigate('AdminWorkers')} activeOpacity={0.82}>
              <View style={s.cardTopLight} />
              <View style={s.cardBottomShade} />
              <Text style={s.opsIcon}>👷</Text>
              <Text style={s.opsTitle}>{literalT("Worker Coverage")}</Text>
              <Text style={s.opsSub}>{stats.activeWorkers}/{stats.totalWorkers}{literalT("active,")}{activeWorkerRate}{literalT("% coverage.")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("7-Day Trend")} />
          <View style={s.trendCard}>
            {weekly.length === 0 ?
            <Text style={s.emptyText}>{literalT("Weekly trend data will appear here.")}</Text> :
            weekly.map((item) => {
              const complaintHeight = Math.max(6, Math.round((item.complaints || 0) / maxWeekly * 82));
              const resolvedHeight = Math.max(6, Math.round((item.resolved || 0) / maxWeekly * 82));
              return (
                <View key={item.day} style={s.trendColumn}>
                  <View style={s.barPair}>
                    <View style={[s.bar, s.barComplaint, { height: complaintHeight }]} />
                    <View style={[s.bar, s.barResolved, { height: resolvedHeight }]} />
                  </View>
                  <Text style={s.trendLabel}>{item.day}</Text>
                </View>);

            })}
          </View>
          <View style={s.legendRow}>
            <Text style={s.legendText}>{literalT("● Complaints")}</Text>
            <Text style={[s.legendText, { color: T.green }]}>{literalT("● Resolved")}</Text>
          </View>
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Category Mix")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
            {categories.length === 0 ?
            <View style={s.inlineEmpty}><Text style={s.emptyText}>{literalT("No category data.")}</Text></View> :
            categories.map((cat) =>
            <View key={cat.name} style={s.categoryCard}>
                <View style={s.cardTopLight} />
                <View style={s.cardBottomShade} />
                <Text style={s.categoryIcon}>{CATEGORY_ICONS[cat.name] || '📝'}</Text>
                <Text style={s.categoryName} numberOfLines={2}>{complaintCategoryT(cat.name)}</Text>
                <Text style={s.categoryValue}>{cat.value}%</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("District Performance")} />
          <View style={s.tableCard}>
            {districts.length === 0 ?
            <Text style={s.emptyText}>{literalT("District performance data will appear after complaints are filed.")}</Text> :
            districts.slice(0, 5).map((district) => {
              const rate = district.total > 0 ? Math.round(district.resolved / district.total * 100) : 0;
              return (
                <View key={district.district} style={s.districtRow}>
                  <View style={s.districtNameWrap}>
                    <Text style={s.districtName} numberOfLines={1}>{district.district}</Text>
                    <Text style={s.districtMeta}>{district.pending}{literalT("pending")}</Text>
                  </View>
                  <View style={s.districtTrack}>
                    <View style={[s.districtFill, { width: `${rate}%` }]} />
                  </View>
                  <Text style={s.districtRate}>{rate}%</Text>
                </View>);

            })}
          </View>
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Recent Complaints")} action={literalT("See all →")} onPress={() => navigation.navigate('AdminComplaints')} />
          {recentComplaints.length === 0 ?
          <View style={s.emptyCard}><Text style={s.emptyText}>{literalT("No complaints yet.")}</Text></View> :
          recentComplaints.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.NEW;
            return (
              <TouchableOpacity
                key={String(item.id || item._id)}
                style={s.complaintCard}
                onPress={() => navigation.navigate('ComplaintDetailAdmin', { id: item.id || item._id })}
                activeOpacity={0.84}>
                
                <View style={[s.complaintIconBox, { backgroundColor: meta.bg }]}>
                  <Text style={s.complaintIcon}>{CATEGORY_ICONS[item.category] || '📝'}</Text>
                </View>
                <View style={s.complaintInfo}>
                  <Text style={s.complaintTitle} numberOfLines={1}>{complaintCategoryT(item.category, item.customCategory)}</Text>
                  <Text style={s.complaintMeta} numberOfLines={1}>{item.thokuthi || item.ward || 'Thokuthi'} · {item.district || 'District'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </TouchableOpacity>);

          })}
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Notifications")} action={literalT("See all →")} onPress={() => navigation.navigate('AdminNotifications')} />
          {recentNotifications.length === 0 ?
          <View style={s.emptyCard}><Text style={s.emptyText}>{literalT("No recent notifications.")}</Text></View> :
          recentNotifications.map((notif) =>
          <TouchableOpacity
            key={String(notif.id)}
            style={s.notificationCard}
            onPress={() => navigation.navigate('NotificationDetail', { id: notif.id })}
            activeOpacity={0.84}>
            
              <View style={s.notificationDot} />
              <View style={s.notificationBody}>
                <Text style={s.notificationMsg} numberOfLines={2}>{notif.msg}</Text>
                <Text style={s.notificationTime}>{notif.time ? new Date(notif.time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadingText: { color: T.textM, marginTop: 10, fontSize: 13 },
  scrollContent: { paddingBottom: 34 },

  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingHorizontal: 18, paddingBottom: 22 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', elevation: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  avatarTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
  adminName: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 1 },
  adminMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
  adminMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  adminMetaChip: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  headerButtonTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },

  healthPanel: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 8, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  healthLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '700' },
  healthValue: { color: T.goldL, fontSize: 34, fontWeight: '900', lineHeight: 38 },
  healthRight: { flex: 1, gap: 8 },
  healthNote: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: T.goldL },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, paddingTop: 14 },
  statTile: { width: '48%', height: 136, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 9, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, overflow: 'hidden' },
  statIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  statIcon: { fontSize: 21 },
  statValue: { color: T.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: T.text, fontSize: 13, fontWeight: '800', marginTop: 2 },
  statSub: { color: T.textM, fontSize: 11, marginTop: 2 },

  section: { paddingHorizontal: 14, paddingTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: T.text, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: T.maroon, fontSize: 13, fontWeight: '800' },

  opsGrid: { flexDirection: 'row', gap: 10 },
  opsCard: { flex: 1, height: 132, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 9, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, overflow: 'hidden' },
  opsIcon: { fontSize: 26, marginBottom: 8 },
  opsTitle: { color: T.text, fontSize: 14, fontWeight: '900' },
  opsSub: { color: T.textM, fontSize: 11, lineHeight: 16, marginTop: 4 },

  trendCard: { height: 146, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', elevation: 8, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  trendColumn: { alignItems: 'center', flex: 1 },
  barPair: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 7, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barComplaint: { backgroundColor: T.maroon },
  barResolved: { backgroundColor: T.green },
  trendLabel: { color: T.textM, fontSize: 10, fontWeight: '700', marginTop: 7 },
  legendRow: { flexDirection: 'row', gap: 16, paddingTop: 8, paddingHorizontal: 4 },
  legendText: { color: T.maroon, fontSize: 11, fontWeight: '700' },

  categoryRow: { gap: 10, paddingRight: 14 },
  categoryCard: { width: 118, height: 128, backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 8, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, overflow: 'hidden' },
  categoryIcon: { fontSize: 24, marginBottom: 8 },
  categoryName: { color: T.text, fontSize: 12, fontWeight: '800', lineHeight: 16, minHeight: 32 },
  categoryValue: { color: T.maroon, fontSize: 20, fontWeight: '900', marginTop: 8 },
  inlineEmpty: { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 7, shadowColor: '#000', shadowOpacity: 0.11, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },

  tableCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  districtRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.border },
  districtNameWrap: { width: 108 },
  districtName: { color: T.text, fontSize: 12, fontWeight: '800' },
  districtMeta: { color: T.textM, fontSize: 10, marginTop: 1 },
  districtTrack: { flex: 1, height: 8, backgroundColor: T.bg, borderRadius: 4, overflow: 'hidden' },
  districtFill: { height: '100%', backgroundColor: T.green, borderRadius: 4 },
  districtRate: { width: 38, textAlign: 'right', color: T.text, fontSize: 12, fontWeight: '900' },

  complaintCard: { backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 7, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: 7 } },
  complaintIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  complaintIcon: { fontSize: 20 },
  complaintInfo: { flex: 1, minWidth: 0 },
  complaintTitle: { color: T.text, fontSize: 13, fontWeight: '900' },
  complaintMeta: { color: T.textM, fontSize: 11, marginTop: 3 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },

  notificationCard: { backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', gap: 10, elevation: 7, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: 7 } },
  notificationDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: T.maroon, marginTop: 5 },
  notificationBody: { flex: 1 },
  notificationMsg: { color: T.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  notificationTime: { color: T.textM, fontSize: 10, marginTop: 4 },

  emptyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 7, shadowColor: '#000', shadowOpacity: 0.11, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  cardTopLight: { position: 'absolute', top: 4, left: 8, right: 8, height: 22, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.5)' },
  cardBottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, backgroundColor: 'rgba(0,0,0,0.025)' },
  emptyText: { color: T.textM, fontSize: 12, textAlign: 'center' }
});
