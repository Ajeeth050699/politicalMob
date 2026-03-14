import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS, PRIORITY_COLORS } from '../../constants/theme';

const STATUS_ICONS = {
  'NEW':         '🆕',
  'IN PROGRESS': '⚙️',
  'COMPLETED':   '✅',
};

const PRIORITY_ICONS = {
  high:   '🔴',
  medium: '🟡',
  low:    '🟢',
};

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage':          '🛣️',
  'Garbage Issue':        '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue':       '🚰',
  'Public Safety Issue':  '🚨',
  'Others':               '📝',
};

export default function MyComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('ALL');

  const load = async () => {
    try {
      const { data } = await complaintAPI.getAll();
      setComplaints(data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  };

  const FILTERS = ['ALL', 'NEW', 'IN PROGRESS', 'COMPLETED'];

  const filtered = filter === 'ALL'
    ? complaints
    : complaints.filter(c => c.status === filter);

  // Stats
  const newCount      = complaints.filter(c => c.status === 'NEW').length;
  const progressCount = complaints.filter(c => c.status === 'IN PROGRESS').length;
  const doneCount     = complaints.filter(c => c.status === 'COMPLETED').length;

  const renderItem = ({ item: c }) => {
    const sc = STATUS_COLORS[c.status] || { bg: '#f3f4f6', color: '#6b7280' };
    const pc = PRIORITY_COLORS[c.priority] || T.amber;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
        activeOpacity={0.85}
      >
        {/* Priority strip on left */}
        <View style={[s.priorityStrip, { backgroundColor: pc }]} />

        <View style={s.cardContent}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={s.categoryRow}>
              <Text style={{ fontSize: 20 }}>{CATEGORY_ICONS[c.category] || '📝'}</Text>
              <Text style={s.categoryText} numberOfLines={1}>{c.category}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: sc.bg + 'cc' }]}>
              <Text style={{ fontSize: 12 }}>{STATUS_ICONS[c.status]}</Text>
              <Text style={[s.statusText, { color: sc.color }]}>{c.status}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            <Text style={s.metaItem}>📍 {c.booth}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaItem}>🏙️ {c.district}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.metaItem}>📅 {new Date(c.time).toLocaleDateString('en-IN')}</Text>
          </View>

          {/* Priority + worker row */}
          <View style={s.bottomRow}>
            <View style={[s.priorityBadge, { backgroundColor: pc + '20' }]}>
              <Text style={{ fontSize: 10 }}>{PRIORITY_ICONS[c.priority]}</Text>
              <Text style={[s.priorityText, { color: pc }]}>
                {(c.priority || 'medium').toUpperCase()}
              </Text>
            </View>
            {c.assignedWorker && (
              <Text style={s.workerText}>👷 {c.assignedWorker}</Text>
            )}
            <Text style={s.arrow}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 12 }}>Loading complaints...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>My Complaints</Text>
        <Text style={s.headerSub}>Track all your submitted issues</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { label: 'New',      count: newCount,      color: T.amber },
            { label: 'Progress', count: progressCount, color: T.blue  },
            { label: 'Done',     count: doneCount,     color: T.green },
            { label: 'Total',    count: complaints.length, color: '#fff' },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statNum, { color }]}>{count}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Filter tabs ── */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterText, filter === f && { color: '#fff', fontWeight: '700' }]}>
              {f === 'ALL' ? 'All' : f === 'IN PROGRESS' ? 'In Progress' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>📭</Text>
            <Text style={s.emptyTitle}>No complaints yet</Text>
            <Text style={s.emptySub}>
              {filter === 'ALL'
                ? 'Tap the + button to report your first issue'
                : `No ${filter.toLowerCase()} complaints found`
              }
            </Text>
            {filter === 'ALL' && (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => navigation.navigate('AddComplaint')}
                activeOpacity={0.85}
              >
                <Text style={s.addBtnText}>+ Report an Issue</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('AddComplaint')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[T.maroon, T.maroonL]} style={s.fabGrad}>
          <Text style={s.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: T.bg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // header
  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 24 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },

  // stats
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '900' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },

  // filter
  filterRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  filterChip:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  filterChipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  filterText:  { fontSize: 12, fontWeight: '600', color: T.textL },

  // card
  card:        { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  priorityStrip: { width: 5 },
  cardContent: { flex: 1, padding: 14 },

  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  categoryText:{ fontSize: 14, fontWeight: '700', color: T.text, flex: 1 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  metaRow:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  metaItem:    { fontSize: 11, color: T.textM },
  metaDot:     { fontSize: 11, color: T.border },

  bottomRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  priorityText:{ fontSize: 10, fontWeight: '800' },
  workerText:  { fontSize: 11, color: T.textL, flex: 1 },
  arrow:       { fontSize: 16, color: T.maroon, fontWeight: '700' },

  // empty state
  empty:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center', lineHeight: 20 },
  addBtn:      { marginTop: 24, backgroundColor: T.maroon, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50 },
  addBtnText:  { color: '#fff', fontWeight: '800', fontSize: 15 },

  // FAB
  fab:         { position: 'absolute', bottom: 24, right: 24, borderRadius: 32, elevation: 8, shadowColor: T.maroon, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  fabGrad:     { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  fabText:     { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 32 },
});