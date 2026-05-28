import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Platform, StatusBar, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationAPI } from '../../services/api';
import { T } from '../../constants/theme';

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

export default function AdminNotifications({ navigation }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('unread');

  const FILTERS = ['ALL', 'complaint', 'worker', 'announcement', 'news'];
  const STATUS_FILTERS = ['unread', 'read', 'ALL'];
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  };

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
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item: n }) => {
    const meta = TYPE_META[n.type] || TYPE_META.announcement;
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: meta.color, borderLeftWidth: 4, opacity: n.status === 'read' ? 0.7 : 1 }]}
        onPress={() => navigation.navigate('NotificationDetail', { id: n.id })}
        activeOpacity={0.7}
      >
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.topRow}>
            <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.typeTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {n.status === 'unread' && <View style={s.unreadDot} />}
          </View>
          <Text style={s.msg} numberOfLines={2}>{n.msg}</Text>
          <Text style={s.time}>{timeAgo(n.time)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={{ color: T.textM, marginTop: 10 }}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = notifs.filter(n => n.status === 'unread').length;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔔 Activity Log</Text>
        <Text style={s.headerSub}>{notifs.length} total notifications</Text>
        {unreadCount > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{unreadCount} Unread</Text>
          </View>
        )}
      </LinearGradient>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        <View style={s.filterRow}>
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
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        <View style={s.filterRow}>
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
        </View>
      </ScrollView>

      {/* List */}
      <FlatList
        data={notifs}
        keyExtractor={n => n.id?.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[T.maroon]} tintColor={T.maroon} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptySub}>Your notification activity will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 16, paddingHorizontal: 16, zIndex: 1 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, padding: 8, zIndex: 10, elevation: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: '600', marginTop: -4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2, textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  unreadBadge: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'center' },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  filterScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  chipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt: { fontSize: 13, fontWeight: '600', color: T.textL },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  typeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  unreadDot: { width: 6, height: 6, borderRadius: '50%', backgroundColor: T.maroon, marginLeft: 'auto' },
  msg: { fontSize: 13, color: T.text, lineHeight: 19, marginBottom: 2 },
  time: { fontSize: 11, color: T.textM },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textM, textAlign: 'center' },
});
