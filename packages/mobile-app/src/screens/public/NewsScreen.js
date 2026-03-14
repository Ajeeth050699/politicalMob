import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { newsAPI } from '../../services/api';
import { T } from '../../constants/theme';

const LEVEL_META = {
  State:    { icon: '🏛️', color: T.maroon,  bg: T.maroon  + '15', label: 'State News'    },
  District: { icon: '🏙️', color: T.gold,    bg: T.gold    + '15', label: 'District News' },
  Booth:    { icon: '📍', color: T.green,   bg: T.green   + '15', label: 'Booth News'    },
};

const FILTERS = ['All', 'State', 'District', 'Booth'];

export default function NewsScreen() {
  const [news,       setNews]       = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await newsAPI.getAll();
      setNews(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'All' ? news : news.filter(n => n.level === filter);

  const stateCnt    = news.filter(n => n.level === 'State').length;
  const districtCnt = news.filter(n => n.level === 'District').length;
  const boothCnt    = news.filter(n => n.level === 'Booth').length;

  const renderItem = ({ item: n }) => {
    const meta = LEVEL_META[n.level] || LEVEL_META.State;
    return (
      <View style={s.card}>
        <View style={[s.levelBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle} numberOfLines={2}>{n.title}</Text>
          <Text style={s.cardDesc}  numberOfLines={2}>{n.description}</Text>
          <View style={s.cardMeta}>
            <View style={[s.levelBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.levelBadgeTxt, { color: meta.color }]}>{n.level}</Text>
            </View>
            <Text style={s.cardDate}>📅 {n.date}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading news...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>📰 Local News</Text>
        <Text style={s.headerSub}>Stay updated with Tamil Nadu</Text>

        {/* News count badges */}
        <View style={s.countRow}>
          {[
            { label: 'State',    count: stateCnt,    color: '#fca5a5' },
            { label: 'District', count: districtCnt, color: T.goldL   },
            { label: 'Booth',    count: boothCnt,    color: '#86efac' },
            { label: 'Total',    count: news.length, color: '#fff'    },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.countCard}>
              <Text style={[s.countNum, { color }]}>{count}</Text>
              <Text style={s.countLabel}>{label}</Text>
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
            {f !== 'All' && <Text style={{ fontSize: 12, marginRight: 4 }}>{LEVEL_META[f]?.icon}</Text>}
            <Text style={[s.filterTxt, filter === f && { color: '#fff', fontWeight: '700' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={n => n.id?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>📭</Text>
            <Text style={s.emptyTitle}>No news available</Text>
            <Text style={s.emptySub}>
              {filter === 'All' ? 'Check back later for updates' : `No ${filter} level news yet`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: T.bg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },

  countRow:    { flexDirection: 'row', gap: 10 },
  countCard:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12, alignItems: 'center' },
  countNum:    { fontSize: 20, fontWeight: '900' },
  countLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },

  filterRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  filterChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg },
  filterChipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  filterTxt:   { fontSize: 13, fontWeight: '600', color: T.textL },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  levelBox:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: T.text, lineHeight: 21 },
  cardDesc:    { fontSize: 12, color: T.textL, marginTop: 4, lineHeight: 17 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  levelBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  levelBadgeTxt:{ fontSize: 11, fontWeight: '700' },
  cardDate:    { fontSize: 11, color: T.textM },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});