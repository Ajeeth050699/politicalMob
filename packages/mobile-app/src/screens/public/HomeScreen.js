import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Linking, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { newsAPI, emergencyAPI, complaintAPI } from '../../services/api';
import { T } from '../../constants/theme';

const EMER_ICONS  = { police: '🚔', ambulance: '🚑', fire: '🚒', women: '👩', child: '👶', district: '🏢' };
const EMER_COLORS = { police: '#3b82f6', ambulance: '#ef4444', fire: '#f59e0b', women: '#ec4899', child: '#8b5cf6', district: '#22c55e' };

const QUICK_ACTIONS = [
  { icon: '📝', label: 'Report Issue',   color: T.maroon, route: 'AddComplaint' },
  { icon: '📋', label: 'My Complaints',  color: T.blue,   route: 'Complaints'  },
  { icon: '📰', label: 'Local News',     color: T.gold,   route: 'News'        },
  { icon: '📚', label: 'Education',      color: '#8b5cf6', route: 'Education'  },
  { icon: '🏕️', label: 'Welfare Camps',  color: '#16a34a', route: 'Camps'      },
  { icon: '🚨', label: 'Emergency',      color: T.red,    route: 'Emergency'   },
];

export default function HomeScreen({ navigation }) {
  const { userInfo } = useAuth();
  const [news,       setNews]       = useState([]);
  const [emergency,  setEmergency]  = useState([]);
  const [stats,      setStats]      = useState({ total: 0, pending: 0, done: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [newsRes, emerRes, cmpRes] = await Promise.all([
        newsAPI.getAll(),
        emergencyAPI.getAll(),
        complaintAPI.getAll(),
      ]);
      setNews(newsRes.data.slice(0, 3));
      setEmergency(emerRes.data.slice(0, 4));
      const cmps = cmpRes.data;
      setStats({
        total:   cmps.length,
        pending: cmps.filter(c => c.status === 'NEW' || c.status === 'IN PROGRESS').length,
        done:    cmps.filter(c => c.status === 'COMPLETED').length,
      });
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
      >
        {/* ── Hero Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL, '#B03A3A']} style={s.header}>
          {/* Top row */}
          <View style={s.headerTop}>
            <View style={s.logoCircle}>
              <Text style={{ fontSize: 22 }}>🏛️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.appName}>People Connect</Text>
              <Text style={s.districtTag}>📍 {userInfo?.district || 'Tamil Nadu'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatarBtn}>
              <Text style={{ fontSize: 22 }}>👤</Text>
              <View style={s.avatarDot} />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <Text style={s.greeting}>{greeting},</Text>
          <Text style={s.userName}>{userInfo?.name?.split(' ')[0] || 'Citizen'} 👋</Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            {[
              { label: 'Total',   value: stats.total,   color: T.goldL  },
              { label: 'Pending', value: stats.pending, color: '#fca5a5' },
              { label: 'Resolved',value: stats.done,    color: '#86efac' },
            ].map(({ label, value, color }) => (
              <View key={label} style={s.statCard}>
                <Text style={[s.statNum, { color }]}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.qGrid}>
            {QUICK_ACTIONS.map(({ icon, label, color, route }) => (
              <TouchableOpacity
                key={label}
                style={s.qCard}
                onPress={() => navigation.navigate(route)}
                activeOpacity={0.8}
              >
                <View style={[s.qIconBox, { backgroundColor: color + '18' }]}>
                  <Text style={{ fontSize: 24 }}>{icon}</Text>
                </View>
                <Text style={s.qLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Emergency Contacts ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>🚨 Emergency</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
              <Text style={s.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.emerGrid}>
            {emergency.map((e) => {
              const color = EMER_COLORS[e.type] || T.maroon;
              return (
                <TouchableOpacity
                  key={e.name}
                  style={[s.emerCard, { borderColor: color + '30' }]}
                  onPress={() => Linking.openURL(`tel:${e.number}`)}
                  activeOpacity={0.8}
                >
                  <View style={[s.emerIconBox, { backgroundColor: color + '15' }]}>
                    <Text style={{ fontSize: 22 }}>{EMER_ICONS[e.type] || '📞'}</Text>
                  </View>
                  <Text style={s.emerName} numberOfLines={1}>{e.name}</Text>
                  <Text style={[s.emerNum, { color }]}>{e.number}</Text>
                  <View style={[s.callTag, { backgroundColor: color + '15' }]}>
                    <Text style={[s.callTagTxt, { color }]}>Tap to call</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Latest News ── */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>📰 Latest News</Text>
            <TouchableOpacity onPress={() => navigation.navigate('News')}>
              <Text style={s.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {news.length === 0 ? (
            <View style={s.emptyNews}>
              <Text style={{ fontSize: 32 }}>📭</Text>
              <Text style={s.emptyTxt}>No news yet</Text>
            </View>
          ) : news.map((n) => {
            const levelColor = n.level === 'State' ? T.maroon : n.level === 'District' ? T.gold : T.green;
            return (
              <View key={n.id} style={s.newsCard}>
                <View style={[s.newsLevel, { backgroundColor: levelColor + '18' }]}>
                  <Text style={{ fontSize: 16 }}>
                    {n.level === 'State' ? '🏛️' : n.level === 'District' ? '🏙️' : '📍'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.newsTitle} numberOfLines={2}>{n.title}</Text>
                  <Text style={s.newsDesc} numberOfLines={1}>{n.description}</Text>
                  <View style={s.newsMeta}>
                    <View style={[s.levelBadge, { backgroundColor: levelColor + '18' }]}>
                      <Text style={[s.levelTxt, { color: levelColor }]}>{n.level}</Text>
                    </View>
                    <Text style={s.newsDate}>{n.date}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: T.bg },

  // header
  header:     { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28, paddingHorizontal: 20 },
  headerTop:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  appName:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  districtTag:{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  avatarBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarDot:  { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: T.green, borderWidth: 1, borderColor: '#fff' },
  greeting:   { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  userName:   { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 2, marginBottom: 20 },

  // stats
  statsRow:   { flexDirection: 'row', gap: 10 },
  statCard:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statNum:    { fontSize: 24, fontWeight: '900' },
  statLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '600' },

  // sections
  section:    { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 17, fontWeight: '800', color: T.text },
  seeAll:     { fontSize: 13, color: T.maroon, fontWeight: '700' },

  // quick actions
  qGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  qCard:      { width: '30%', backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  qIconBox:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qLabel:     { fontSize: 11, fontWeight: '700', color: T.text, textAlign: 'center' },

  // emergency
  emerGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emerCard:   { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  emerIconBox:{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emerName:   { fontSize: 12, fontWeight: '700', color: T.text, textAlign: 'center' },
  emerNum:    { fontSize: 20, fontWeight: '900', marginTop: 4 },
  callTag:    { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  callTagTxt: { fontSize: 10, fontWeight: '700' },

  // news
  newsCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  newsLevel:  { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  newsTitle:  { fontSize: 14, fontWeight: '700', color: T.text, lineHeight: 20 },
  newsDesc:   { fontSize: 12, color: T.textL, marginTop: 3 },
  newsMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  levelTxt:   { fontSize: 10, fontWeight: '700' },
  newsDate:   { fontSize: 11, color: T.textM },
  emptyNews:  { alignItems: 'center', paddingVertical: 32 },
  emptyTxt:   { fontSize: 14, color: T.textM, marginTop: 8 },
});