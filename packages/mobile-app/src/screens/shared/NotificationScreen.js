import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../constants/theme';   // ← fixed from ../../utils/theme

const TYPE_META = {
  complaint:    { icon: '📋', color: '#3b82f6', bg: '#dbeafe', label: 'Complaint'    },
  worker:       { icon: '👷', color: '#8b5cf6', bg: '#ede9fe', label: 'Worker'       },
  camp:         { icon: '🏕️', color: '#16a34a', bg: '#dcfce7', label: 'Camp'         },
  news:         { icon: '📰', color: '#f59e0b', bg: '#fef3c7', label: 'News'         },
  announcement: { icon: '📢', color: T.maroon,  bg: '#fee2e2', label: 'Announcement' },
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const { userInfo } = useAuth();
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('unread');

  const FILTERS = ['ALL', 'complaint', 'news', 'camp', 'announcement'];
  const STATUS_FILTERS = ['unread', 'read', 'ALL'];

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = {};
      if (filter !== 'ALL') params.type = filter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await notificationAPI.getAll(params);
      setNotifs(Array.isArray(data) ? data : data?.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [filter, statusFilter]);
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(userInfo?.role === 'worker' ? 'Dashboard' : 'Home');
  };

  const filtered = notifs;

  const renderItem = ({ item: n }) => {
    const meta = TYPE_META[n.type] || TYPE_META.announcement;
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: meta.color, borderLeftWidth: 4, opacity: n.status === 'read' ? 0.7 : 1 }]}
        onPress={() => navigation.navigate('NotificationDetail', { id: n.id })}
        activeOpacity={0.7}
      >
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.topRow}>
            <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.typeTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={s.time}>{timeAgo(n.time)}</Text>
          </View>
          <Text style={s.msg}>{n.msg}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading notifications...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔔 Notifications</Text>
        <Text style={s.headerSub}>Stay updated with latest activity</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.length}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.filter(n => n.type === 'complaint').length}</Text>
            <Text style={s.statLabel}>Complaints</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.filter(n => n.type === 'announcement').length}</Text>
            <Text style={s.statLabel}>Announcements</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            {f !== 'ALL' && <Text style={{ fontSize: 11, marginRight: 3 }}>{TYPE_META[f]?.icon}</Text>}
            <Text style={[s.chipTxt, filter === f && { color: '#fff', fontWeight: '700' }]}>
              {f === 'ALL' ? 'All' : TYPE_META[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Status Filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {STATUS_FILTERS.map(s_f => (
          <TouchableOpacity
            key={s_f}
            style={[s.chip, statusFilter === s_f && s.chipActive]}
            onPress={() => setStatusFilter(s_f)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, statusFilter === s_f && { color: '#fff' }]}>
              {s_f === 'ALL' ? 'All Status' : s_f === 'unread' ? '○ Unread' : '✓ Read'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={n => n.id?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.maroon]} tintColor={T.maroon} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>🔔</Text>
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptySub}>Updates and announcements will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 20, zIndex: 1 },
  backBtn:     { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, padding: 8, zIndex: 10, elevation: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: '600', marginTop: -4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '900', color: '#fff' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  filterScroll:{ flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border, maxHeight: 54 },
  filterRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', minHeight: 34, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  chipActive:  { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt:     { fontSize: 13, fontWeight: '600', color: T.textL },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  iconBox:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  typeBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  typeTxt:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  time:        { fontSize: 11, color: T.textM, marginLeft: 'auto' },
  msg:         { fontSize: 14, color: T.text, lineHeight: 21 },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});
