import { complaintCategoryT, literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar, Animated, Image } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { complaintAPI, dashboardAPI, notificationAPI, workerAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';

const APP_LOGO = require('../../../assets/images/icon.png');
const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const STATUS_META = {
  NEW: { label: 'New', color: T.amber, bg: '#FEF3C7' },
  ACCEPTED: { label: 'Accepted', color: T.blue, bg: '#DBEAFE' },
  'IN PROGRESS': { label: 'In Progress', color: '#8b5cf6', bg: '#EDE9FE' },
  COMPLETED: { label: 'Completed', color: T.green, bg: '#DCFCE7' }
};

const CATEGORY_ICONS = {
  'Street Light Problem': 'lightbulb-on-outline',
  'Road Damage': 'road-variant',
  'Garbage Issue': 'trash-can-outline',
  'Water Supply Problem': 'water-outline',
  'Drainage Issue': 'pipe-leak',
  'Public Safety Issue': 'shield-alert-outline',
  Others: 'file-document-outline'
};

const categoryIconName = (category) => ({
  'Street Light Problem': 'lightbulb-on-outline',
  'Road Damage': 'road-variant',
  'Garbage Issue': 'trash-can-outline',
  'Water Supply Problem': 'water-outline',
  'Drainage Issue': 'pipe-leak',
  'Public Safety Issue': 'shield-alert-outline',
  Others: 'file-document-outline'
})[category] || 'file-document-outline';

function StatTile({ label, value, sub, color, iconName, onPress }) {
  const resolvedIcon = iconName || {
    Total: 'clipboard-list-outline',
    New: 'alert-circle-outline',
    Progress: 'progress-clock',
    Done: 'check-decagram-outline'
  }[label] || 'chart-box-outline';

  return (
    <TouchableOpacity
      style={s.statTile}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
      disabled={!onPress}>
      
      <View style={s.cardTopLight} />
      <View style={s.cardBottomShade} />
      <View style={[s.statIconBox, { backgroundColor: color + '18' }]}>
        <Icon name={resolvedIcon} size={22} color={color} />
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

function QuickActionCard({ icon, label, sub, color, onPress }) {
  return (
    <TouchableOpacity style={s.quickActionCard} onPress={onPress} activeOpacity={0.84}>
      <View style={s.cardTopLight} />
      <View style={s.cardBottomShade} />
      <View style={[s.quickActionIcon, { backgroundColor: color + '16' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={s.quickActionLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.quickActionSub} numberOfLines={2}>{sub}</Text>
    </TouchableOpacity>);

}

export default function AdminDashboard({ navigation }) {
  const { userInfo } = useAuth();
  const { weather, alerts, loading: weatherLoading } = useWeatherAlerts({ pollMs: 10 * 60 * 1000 });
  const heroAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
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

      let complaints = asArray(recentRes?.data);
      const workerList = asArray(workerRes?.data);
      let computedStats = {
        totalComplaints: statRes?.data?.totalComplaints || 0,
        newComplaints: statRes?.data?.pending || 0,
        acceptedComplaints: 0,
        inProgressComplaints: statRes?.data?.inProgress || 0,
        completedComplaints: statRes?.data?.completed || 0,
        totalWorkers: workerList.length,
        activeWorkers: statRes?.data?.activeWorkers || workerList.filter((w) => w.status === 'active' || w.isActive).length || 0
      };

      if (!statRes || !recentRes) {
        const complaintRes = await complaintAPI.getAll().catch(() => ({ data: [] }));
        const allComplaints = asArray(complaintRes.data);
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
      setWeekly(asArray(weeklyRes?.data));
      setCategories(asArray(categoryRes?.data));
      setDistricts(asArray(districtRes?.data));
      setRecentComplaints(Array.isArray(complaints) ? complaints.slice(0, 6) : []);

      setRecentNotifications(asArray(notifRes?.data).slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    Animated.timing(heroAnim, { toValue: 1, duration: 760, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true })]
      )
    ).start();
  }, []);

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
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

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
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}>
        
        <LinearGradient colors={['#4a0a0a', '#8B1A1A', '#A52020', '#6B1212']} locations={[0, 0.35, 0.7, 1]} style={s.header}>
          <View style={s.heroGrid} />
          <View style={s.heroOrb1} />
          <View style={s.heroOrb2} />
          <View style={s.heroRingsWrap}>
            {[0, 1, 2].map((i) => <View key={i} style={[s.heroRing, { opacity: 0.15 - i * 0.04 }]} />)}
          </View>
          <View style={s.heroTop}>
            <View style={s.appPill}>
              <Image source={APP_LOGO} style={s.appLogo} />
              <View style={s.onlineBlip} />
              <Text style={s.appPillTxt}>{literalT("Admin Dashboard")}</Text>
            </View>
          </View>
          <Animated.View style={[s.headerTop, {
            opacity: heroAnim,
            transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }]
          }]}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{(userInfo?.name || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.headerCopy}>
              <Text style={s.greeting}>{greeting}</Text>
              <Text style={s.adminName} numberOfLines={1}>{userInfo?.name || 'Admin'}</Text>
              <View style={s.adminMetaRow}>
                <View style={s.adminMetaChip}><Icon name="map-marker-outline" size={12} color="rgba(255,255,255,0.82)" /><Text style={s.adminMetaChipTxt}>{userInfo?.district || 'Tamil Nadu'}</Text></View>
                <View style={s.adminMetaChip}><Text style={s.adminMetaChipTxt}>{literalT("Administration")}</Text></View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[s.healthPanel, { transform: [{ translateY: floatY }] }]}>
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
          </Animated.View>
        </LinearGradient>

        {/* ════ WEATHER & ALERTS ════ */}
        <View style={s.miniWidgetsRow}>
          <TouchableOpacity style={s.weatherWidget} onPress={() => navigation.navigate('Weather')} activeOpacity={0.82}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>{weather?.condition ? '🌤️' : '🌤️'}</Text>
            <View style={{ marginLeft: 10 }}>
              <Text style={s.weatherTemp}>
                {weather?.temperatureC != null ? `${weather.temperatureC}°C` : '—'}
              </Text>
              <Text style={s.weatherDesc}>
                {weather?.condition || literalT('Fetching weather...')}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={s.alertWidget}>
            <View style={s.alertIconWrap}>
              <Text style={{ fontSize: 16 }}>{alerts?.[0]?.severity === 'HIGH' ? '🚨' : '📣'}</Text>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.alertTitle}>{literalT("City Alert")}</Text>
              <Text style={s.alertDesc} numberOfLines={1}>
                {alerts?.[0]?.message || literalT("No active alerts now.")}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.statGrid}>
          <StatTile label={literalT("Total")} value={stats.totalComplaints} sub={literalT("Complaints")} color={T.maroon} iconName="clipboard-list-outline" onPress={() => navigation.navigate('AdminComplaints')} />
          <StatTile label={literalT("New")} value={stats.newComplaints} sub={literalT("Unassigned")} color={T.amber} iconName="alert-circle-outline" onPress={() => navigation.navigate('AdminComplaints', { status: 'NEW' })} />
          <StatTile label={literalT("Progress")} value={stats.inProgressComplaints} sub={literalT("Active work")} color="#8b5cf6" iconName="progress-clock" onPress={() => navigation.navigate('AdminComplaints', { status: 'IN PROGRESS' })} />
          <StatTile label={literalT("Done")} value={stats.completedComplaints} sub={literalT("Resolved")} color={T.green} iconName="check-decagram-outline" onPress={() => navigation.navigate('AdminComplaints', { status: 'COMPLETED' })} />
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Quick Actions")} />
          <View style={s.quickActionGrid}>
            <QuickActionCard icon="clipboard-search-outline" label={literalT("Complaints")} sub={literalT("Review and filter cases")} color={T.maroon} onPress={() => navigation.navigate('AdminComplaints')} />
            <QuickActionCard icon="account-hard-hat" label={literalT("Workers")} sub={literalT("Manage field coverage")} color={T.blue} onPress={() => navigation.navigate('AdminWorkers')} />
            <QuickActionCard icon="weather-partly-cloudy" label={literalT("Weather")} sub={literalT("Area forecast and alerts")} color="#0f766e" onPress={() => navigation.navigate('Weather')} />
            <QuickActionCard icon="bell-ring-outline" label={literalT("Notify")} sub={literalT("Send public updates")} color="#f59e0b" onPress={() => navigation.navigate('AdminNotifications')} />
          </View>
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Operations")} />
          <View style={s.opsGrid}>
            <TouchableOpacity style={s.opsCard} onPress={() => navigation.navigate('AdminComplaints')} activeOpacity={0.82}>
              <View style={s.cardTopLight} />
              <View style={s.cardBottomShade} />
              <View style={s.opsIconBox}><Icon name="magnify" size={25} color={T.maroon} /></View>
              <Text style={s.opsTitle}>{literalT("Review Complaints")}</Text>
              <Text style={s.opsSub}>{literalT("Filter by thokuthi, status, and search.")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.opsCard} onPress={() => navigation.navigate('AdminWorkers')} activeOpacity={0.82}>
              <View style={s.cardTopLight} />
              <View style={s.cardBottomShade} />
              <View style={s.opsIconBox}><Icon name="account-hard-hat" size={25} color={T.blue} /></View>
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
            <Text style={s.legendText}>{literalT("Complaints")}</Text>
            <Text style={[s.legendText, { color: T.green }]}>{literalT("Resolved")}</Text>
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
                <View style={s.categoryIconBox}><Icon name={categoryIconName(cat.name)} size={24} color={T.maroon} /></View>
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
          <SectionHeader title={literalT("Recent Complaints")} action={literalT("See all")} onPress={() => navigation.navigate('AdminComplaints')} />
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
                  <Icon name={categoryIconName(item.category)} size={22} color={meta.color} />
                </View>
                <View style={s.complaintInfo}>
                  <Text style={s.complaintTitle} numberOfLines={1}>{complaintCategoryT(item.category, item.customCategory)}</Text>
                  <Text style={s.complaintMeta} numberOfLines={1}>{item.thokuthi || item.ward || 'Thokuthi'} - {item.district || 'District'}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </TouchableOpacity>);

          })}
        </View>

        <View style={s.section}>
          <SectionHeader title={literalT("Notifications")} action={literalT("See all")} onPress={() => navigation.navigate('AdminNotifications')} />
          {recentNotifications.length === 0 ?
          <View style={s.emptyCard}><Text style={s.emptyText}>{literalT("No recent notifications.")}</Text></View> :
          recentNotifications.map((notif) =>
          <TouchableOpacity
            key={String(notif.id || notif._id)}
            style={s.notificationCard}
            onPress={() => navigation.navigate('NotificationDetail', { id: notif.id || notif._id })}
            activeOpacity={0.84}>
            
              <View style={s.notificationDot} />
              <View style={s.notificationBody}>
                <Text style={s.notificationMsg} numberOfLines={2}>{notif.msg}</Text>
                <Text style={s.notificationTime}>{notif.time ? new Date(notif.time).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadingText: { color: T.textM, marginTop: 10, fontSize: 13 },
  scrollContent: { paddingBottom: 34 },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingHorizontal: 20, paddingBottom: 30, position: 'relative', overflow: 'hidden' },
  heroGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 },
  heroOrb1: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,100,60,0.13)' },
  heroOrb2: { position: 'absolute', bottom: 10, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(212,160,23,0.10)' },
  heroRingsWrap: { position: 'absolute', top: 24, right: 24, width: 100, height: 100 },
  heroRing: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 50, borderWidth: 1, borderColor: '#fff' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  appPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  appLogo: { width: 22, height: 22, borderRadius: 11 },
  onlineBlip: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  appPillTxt: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', elevation: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  avatarTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
  adminName: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 1 },
  adminMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
  adminMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  adminMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  adminMetaChipTxt: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '700' },
  healthPanel: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 8, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  healthLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '700' },
  healthValue: { color: T.goldL, fontSize: 34, fontWeight: '900', lineHeight: 38 },
  healthRight: { flex: 1, gap: 8 },
  healthNote: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: T.goldL },

  miniWidgetsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 12 },
  weatherWidget: { flex: 0.8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  weatherTemp: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  weatherDesc: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  
  alertWidget: { flex: 1.2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf0', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#fef08a', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  alertIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#9a3412' },
  alertDesc: { fontSize: 11, fontWeight: '500', color: '#b45309' },

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

  quickActionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickActionCard: { width: '48%', minHeight: 124, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 8, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, overflow: 'hidden' },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickActionLabel: { color: T.text, fontSize: 14, fontWeight: '900' },
  quickActionSub: { color: T.textM, fontSize: 11, lineHeight: 15, marginTop: 4 },

  opsGrid: { flexDirection: 'row', gap: 10 },
  opsCard: { flex: 1, height: 132, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 9, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, overflow: 'hidden' },
  opsIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
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
  categoryIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: T.maroon + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
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
