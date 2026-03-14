import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS } from '../../constants/theme';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage':          '🛣️',
  'Garbage Issue':        '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue':       '🚰',
  'Public Safety Issue':  '🚨',
  'Others':               '📝',
};

const STATUSES = ['NEW', 'IN PROGRESS', 'COMPLETED'];

const STATUS_BTN_COLOR = {
  'NEW':         { active: '#f59e0b', label: '🆕 New'       },
  'IN PROGRESS': { active: '#3b82f6', label: '⚙️ Progress'  },
  'COMPLETED':   { active: '#16a34a', label: '✅ Done'       },
};

export default function AssignedComplaints({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating,   setUpdating]   = useState(null);
  const [filter,     setFilter]     = useState('ALL');

  const load = async () => {
    try {
      const { data } = await complaintAPI.getAll();
      setComplaints(data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await complaintAPI.updateStatus(id, { status });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter);

  const newCnt      = complaints.filter(c => c.status === 'NEW').length;
  const progressCnt = complaints.filter(c => c.status === 'IN PROGRESS').length;
  const doneCnt     = complaints.filter(c => c.status === 'COMPLETED').length;

  const renderItem = ({ item: c }) => {
    const sc      = STATUS_COLORS[c.status] || { bg: '#f3f4f6', color: '#6b7280' };
    const catIcon = CATEGORY_ICONS[c.category] || '📝';
    const isUpdating = updating === c.id;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
        activeOpacity={0.92}
      >
        {/* Card header */}
        <View style={s.cardHeader}>
          <View style={[s.catIcon, { backgroundColor: T.maroon + '12' }]}>
            <Text style={{ fontSize: 22 }}>{catIcon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.catTxt} numberOfLines={1}>{c.category}</Text>
            <Text style={s.metaTxt}>👤 {c.user} · 🏠 {c.booth}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc.bg + 'cc' }]}>
            <Text style={[s.statusTxt, { color: sc.color }]}>{c.status}</Text>
          </View>
        </View>

        {/* District + time */}
        <View style={s.cardMeta}>
          <Text style={s.metaChip}>📍 {c.district}</Text>
          <Text style={s.metaChip}>📅 {new Date(c.time).toLocaleDateString('en-IN')}</Text>
        </View>

        {/* Status action buttons */}
        <View style={s.actions}>
          {STATUSES.map((status) => {
            const isActive = c.status === status;
            const meta     = STATUS_BTN_COLOR[status];
            return (
              <TouchableOpacity
                key={status}
                onPress={() => !isActive && updateStatus(c.id, status)}
                style={[
                  s.actionBtn,
                  isActive && { backgroundColor: meta.active, borderColor: meta.active },
                  isUpdating && !isActive && { opacity: 0.5 },
                ]}
                disabled={isUpdating || isActive}
                activeOpacity={0.8}
              >
                {isUpdating && !isActive ? (
                  <ActivityIndicator color={T.textL} size="small" />
                ) : (
                  <Text style={[s.actionTxt, isActive && { color: '#fff' }]}>
                    {meta.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading complaints...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>Assigned Complaints</Text>
        <Text style={s.headerSub}>Manage and update complaint statuses</Text>
        <View style={s.statsRow}>
          {[
            { label: 'New',      count: newCnt,      color: '#fca5a5' },
            { label: 'Progress', count: progressCnt, color: '#93c5fd' },
            { label: 'Done',     count: doneCnt,     color: '#86efac' },
            { label: 'Total',    count: complaints.length, color: '#fff' },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statNum, { color }]}>{count}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Filter ── */}
      <View style={s.filterRow}>
        {['ALL', 'NEW', 'IN PROGRESS', 'COMPLETED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, filter === f && { color: '#fff' }]}>
              {f === 'ALL' ? 'All' : f === 'IN PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={c => c.id?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>📋</Text>
            <Text style={s.emptyTitle}>No complaints assigned</Text>
            <Text style={s.emptySub}>
              {filter === 'ALL' ? 'Complaints assigned to you will appear here' : `No ${filter.toLowerCase()} complaints`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '900' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  filterRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  chipActive:  { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt:     { fontSize: 12, fontWeight: '600', color: T.textL },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  catIcon:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catTxt:      { fontSize: 15, fontWeight: '700', color: T.text },
  metaTxt:     { fontSize: 12, color: T.textM, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },
  cardMeta:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metaChip:    { fontSize: 11, color: T.textL, backgroundColor: T.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: T.border },

  actions:     { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center', height: 38 },
  actionTxt:   { fontSize: 11, fontWeight: '700', color: T.textL },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});