import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { newsAPI } from '../../services/api';
import { T } from '../../constants/theme';   // ← fixed from '../../../constants/theme'

const CAMP_META = {
  medical:    { icon: '🏥', color: '#ef4444', bg: '#fee2e2', label: 'Medical'    },
  blood:      { icon: '🩸', color: '#dc2626', bg: '#fee2e2', label: 'Blood Camp' },
  women:      { icon: '👩', color: '#ec4899', bg: '#fce7f3', label: 'Women'      },
  employment: { icon: '💼', color: '#3b82f6', bg: '#dbeafe', label: 'Employment' },
  education:  { icon: '📚', color: '#8b5cf6', bg: '#ede9fe', label: 'Education'  },
};

const STATUS_META = {
  upcoming:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming'  },
  active:    { bg: '#dcfce7', color: '#16a34a', label: 'Active'    },
  completed: { bg: '#f3f4f6', color: '#6b7280', label: 'Completed' },
};

const STATUS_FILTERS = ['ALL', 'upcoming', 'active', 'completed'];
const TYPE_FILTERS   = ['ALL', 'medical', 'blood', 'women', 'employment', 'education'];

export default function CampsScreen({ navigation }) {
  const [camps,        setCamps]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter,   setTypeFilter]   = useState('ALL');

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const { data } = await newsAPI.getCamps();
      setCamps(data);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = camps.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (typeFilter   !== 'ALL' && c.type   !== typeFilter)   return false;
    return true;
  });

  const upcomingCnt = camps.filter(c => c.status === 'upcoming').length;
  const activeCnt   = camps.filter(c => c.status === 'active').length;
  const doneCnt     = camps.filter(c => c.status === 'completed').length;

  const renderItem = ({ item: c }) => {
    const meta   = CAMP_META[c.type]   || { icon: '🏕️', color: T.maroon, bg: '#fee2e2', label: 'Camp' };
    const status = STATUS_META[c.status] || STATUS_META.upcoming;
    return (
      <View style={[s.card, { borderTopColor: meta.color, borderTopWidth: 3 }]}>
        {/* Card header */}
        <View style={s.cardHeader}>
          <View style={[s.campIconBox, { backgroundColor: meta.bg }]}>
            <Text style={{ fontSize: 30 }}>{meta.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.campName} numberOfLines={2}>{c.name}</Text>
            <View style={s.badgeRow}>
              <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
                <Text style={[s.typeTxt, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[s.statusTxt, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={s.details}>
          <View style={s.detailRow}><Text style={s.di}>📍</Text><Text style={s.dt}>{c.location}{c.district ? `, ${c.district}` : ''}</Text></View>
          <View style={s.detailRow}><Text style={s.di}>📅</Text><Text style={s.dt}>{c.date}</Text></View>
          {!!c.slots && <View style={s.detailRow}><Text style={s.di}>👥</Text><Text style={s.dt}>{c.slots} slots available</Text></View>}
        </View>

        {/* Action */}
        {c.status !== 'completed' && (
          <TouchableOpacity
            style={[s.regBtn, { backgroundColor: meta.color }]}
            onPress={() => Linking.openURL('tel:1800')}
            activeOpacity={0.85}
          >
            <Text style={s.regBtnTxt}>📞 Register / Enquire</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading camps...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏕️ Welfare Camps</Text>
        <Text style={s.headerSub}>Government welfare programs near you</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Upcoming',  count: upcomingCnt, color: '#93c5fd' },
            { label: 'Active',    count: activeCnt,   color: '#86efac' },
            { label: 'Completed', count: doneCnt,     color: '#d1d5db' },
            { label: 'Total',     count: camps.length,color: '#fff'    },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statNum, { color }]}>{count}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Status filter ── */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, statusFilter === f && s.chipActive]}
            onPress={() => setStatusFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, statusFilter === f && { color: '#fff' }]}>
              {f === 'ALL' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Type filter ── */}
      <View style={[s.filterRow, { borderTopWidth: 0 }]}>
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, typeFilter === f && { ...s.chipActive, backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }]}
            onPress={() => setTypeFilter(f)}
            activeOpacity={0.8}
          >
            {f !== 'ALL' && <Text style={{ fontSize: 11, marginRight: 3 }}>{CAMP_META[f]?.icon}</Text>}
            <Text style={[s.chipTxt, typeFilter === f && { color: '#fff' }]}>
              {f === 'ALL' ? 'All Types' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.maroon]} tintColor={T.maroon} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>🏕️</Text>
            <Text style={s.emptyTitle}>No camps found</Text>
            <Text style={s.emptySub}>Try changing your filters or check back soon</Text>
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
  backBtn:     { marginBottom: 10 },
  backTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },

  statsRow:    { flexDirection: 'row', gap: 8 },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum:     { fontSize: 18, fontWeight: '900' },
  statLabel:   { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  filterRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border, flexWrap: 'nowrap' },
  chip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  chipActive:  { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt:     { fontSize: 12, fontWeight: '600', color: T.textL },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  cardHeader:  { flexDirection: 'row', gap: 14, marginBottom: 14 },
  campIconBox: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  campName:    { fontSize: 16, fontWeight: '700', color: T.text, flex: 1, lineHeight: 22, marginBottom: 6 },
  badgeRow:    { flexDirection: 'row', gap: 6 },
  typeBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  typeTxt:     { fontSize: 10, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  statusTxt:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  details:     { gap: 6, marginBottom: 14 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  di:          { fontSize: 14, width: 20 },
  dt:          { fontSize: 13, color: T.textL, flex: 1 },
  regBtn:      { borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  regBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});