import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { educationAPI } from '../../services/api';
import { T } from '../../constants/theme';

const VIDEO_CAT_COLORS = {
  'Educational':      { color: '#3b82f6', bg: '#dbeafe', icon: '📖' },
  'General Knowledge':{ color: '#8b5cf6', bg: '#ede9fe', icon: '🧠' },
  'Competitive Exam': { color: '#ef4444', bg: '#fee2e2', icon: '🏆' },
  'Women Skill':      { color: '#ec4899', bg: '#fce7f3', icon: '👩' },
  'Career Guidance':  { color: '#22c55e', bg: '#dcfce7', icon: '🎯' },
};

export default function EducationScreen({ navigation }) {
  const [tab,     setTab]     = useState('videos');
  const [videos,  setVideos]  = useState([]);
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([educationAPI.getVideos(), educationAPI.getExams()])
      .then(([vRes, eRes]) => { setVideos(vRes.data); setExams(eRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const renderVideo = ({ item: v }) => {
    const meta = VIDEO_CAT_COLORS[v.category] || { color: T.maroon, bg: '#fee2e2', icon: '🎬' };
    return (
      <TouchableOpacity
        style={s.videoCard}
        onPress={() => v.videoUrl && Linking.openURL(v.videoUrl)}
        activeOpacity={0.85}
      >
        <View style={[s.videoThumb, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 32 }}>{meta.icon}</Text>
          <View style={s.playBtn}>
            <Text style={{ fontSize: 12 }}>▶</Text>
          </View>
        </View>
        <View style={s.videoInfo}>
          <Text style={s.videoTitle} numberOfLines={2}>{v.title}</Text>
          <View style={[s.catBadge, { backgroundColor: meta.bg }]}>
            <Text style={[s.catTxt, { color: meta.color }]}>{v.category}</Text>
          </View>
          <Text style={s.videoMeta}>👁️ {v.views?.toLocaleString() || 0} views</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExam = ({ item: e }) => (
    <TouchableOpacity
      style={s.examCard}
      onPress={() => navigation.navigate('Exam', { examId: e.id, title: e.title })}
      activeOpacity={0.85}
    >
      <View style={s.examLeft}>
        <View style={s.examIconBox}>
          <Text style={{ fontSize: 24 }}>📝</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.examTitle}>{e.title}</Text>
        <View style={s.examMetaRow}>
          <View style={s.examBadge}><Text style={s.examBadgeTxt}>❓ {e.questions} Qs</Text></View>
          <View style={s.examBadge}><Text style={s.examBadgeTxt}>⏱ {e.duration}</Text></View>
          <View style={s.examBadge}><Text style={s.examBadgeTxt}>👥 {e.taken}</Text></View>
        </View>
      </View>
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.startBtn}>
        <Text style={s.startTxt}>Start</Text>
        <Text style={{ color: '#fff', fontSize: 12 }}>→</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading content...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>📚 Education Hub</Text>
        <Text style={s.headerSub}>Learn · Practice · Grow</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{videos.length}</Text>
            <Text style={s.statLabel}>Videos</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCard}>
            <Text style={s.statNum}>{exams.length}</Text>
            <Text style={s.statLabel}>Exams</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCard}>
            <Text style={s.statNum}>{exams.reduce((a, e) => a + (e.taken || 0), 0)}</Text>
            <Text style={s.statLabel}>Attempts</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {[
          { key: 'videos', label: '🎥 Videos',    count: videos.length },
          { key: 'exams',  label: '📝 Exams',     count: exams.length  },
        ].map(({ key, label, count }) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, tab === key && s.tabActive]}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, tab === key && { color: '#fff' }]}>{label}</Text>
            <View style={[s.tabBadge, tab === key && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[s.tabBadgeTxt, tab === key && { color: '#fff' }]}>{count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {tab === 'videos' ? (
        <FlatList
          data={videos}
          keyExtractor={v => v.id?.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={renderVideo}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 14 }}>🎬</Text>
              <Text style={s.emptyTitle}>No videos yet</Text>
              <Text style={s.emptySub}>Educational videos will appear here</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={e => e.id?.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={renderExam}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 14 }}>📝</Text>
              <Text style={s.emptyTitle}>No exams yet</Text>
              <Text style={s.emptySub}>Practice exams will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16 },

  statsRow:    { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 16 },
  statCard:    { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  tabRow:      { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  tab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg, gap: 8 },
  tabActive:   { backgroundColor: T.maroon, borderColor: T.maroon },
  tabTxt:      { fontSize: 14, fontWeight: '700', color: T.textL },
  tabBadge:    { backgroundColor: T.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50 },
  tabBadgeTxt: { fontSize: 11, fontWeight: '700', color: T.textL },

  // video card
  videoCard:   { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  videoThumb:  { height: 140, alignItems: 'center', justifyContent: 'center' },
  playBtn:     { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  videoInfo:   { padding: 14 },
  videoTitle:  { fontSize: 15, fontWeight: '700', color: T.text, lineHeight: 21, marginBottom: 8 },
  catBadge:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, marginBottom: 6 },
  catTxt:      { fontSize: 11, fontWeight: '700' },
  videoMeta:   { fontSize: 12, color: T.textM },

  // exam card
  examCard:    { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  examLeft:    {},
  examIconBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: T.maroon + '15', alignItems: 'center', justifyContent: 'center' },
  examTitle:   { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 8 },
  examMetaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  examBadge:   { backgroundColor: T.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50, borderWidth: 1, borderColor: T.border },
  examBadgeTxt:{ fontSize: 11, color: T.textL, fontWeight: '600' },
  startBtn:    { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, alignItems: 'center', gap: 2 },
  startTxt:    { color: '#fff', fontSize: 13, fontWeight: '800' },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});