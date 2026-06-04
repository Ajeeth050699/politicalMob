import { literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, StatusBar, Linking, TextInput,
  ScrollView, Alert, RefreshControl } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { educationAPI } from '../../services/api';
import { T, useAppTheme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const JOB_STATUS = [
{ key: 'all', label: 'All' },
{ key: 'live', label: 'Live' },
{ key: 'upcoming', label: 'Upcoming' },
{ key: 'previous', label: 'Previous Year' }];


const VIDEO_META = {
  Educational: { color: '#3b82f6', bg: '#dbeafe', icon: 'Book' },
  'General Knowledge': { color: '#8b5cf6', bg: '#ede9fe', icon: 'GK' },
  'Competitive Exam': { color: '#ef4444', bg: '#fee2e2', icon: 'Test' },
  'Women Skill': { color: '#ec4899', bg: '#fce7f3', icon: 'Skill' },
  'Career Guidance': { color: '#22c55e', bg: '#dcfce7', icon: 'Career' }
};

function Stat({ label, value, theme }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>);

}

function Empty({ title, sub, theme }) {
  return (
    <View style={s.empty}>
      <Text style={[s.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[s.emptySub, { color: theme.textM }]}>{sub}</Text>
    </View>);

}

export default function EducationScreen({ navigation }) {
  const { userInfo } = useAuth();
  const isWorker = userInfo?.role === 'worker';
  const theme = useAppTheme();

  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [exams, setExams] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobSummary, setJobSummary] = useState({ live: 0, upcoming: 0, previous: 0, applications: 0, updates: [] });
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [adaptive, setAdaptive] = useState(null);
  const [jobStatus, setJobStatus] = useState('all');
  const [jobQuery, setJobQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const requests = [
    educationAPI.getVideos().catch(() => ({ data: [] })),
    isWorker ? Promise.resolve({ data: [] }) : educationAPI.getExams().catch(() => ({ data: [] })),
    educationAPI.getGovernmentJobs({ status: jobStatus, q: jobQuery || undefined }).catch(() => ({ data: { data: [] } })),
    educationAPI.getGovernmentJobSummary().catch(() => ({ data: jobSummary })),
    educationAPI.getJobAnalytics().catch(() => ({ data: null })),
    educationAPI.getJobLeaderboard().catch(() => ({ data: [] })),
    educationAPI.getAdaptivePractice().catch(() => ({ data: null }))];

    const [vRes, eRes, jRes, summaryRes, analyticsRes, leaderboardRes, adaptiveRes] = await Promise.all(requests);
    setVideos(Array.isArray(vRes.data) ? vRes.data : []);
    setExams(Array.isArray(eRes.data?.data) ? eRes.data.data : Array.isArray(eRes.data) ? eRes.data : []);
    setJobs(Array.isArray(jRes.data?.data) ? jRes.data.data : []);
    setJobSummary(summaryRes.data || jobSummary);
    setAnalytics(analyticsRes.data);
    setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
    setAdaptive(adaptiveRes.data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isWorker, jobStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tabs = useMemo(() => [
  { key: 'videos', label: 'Videos', count: videos.length },
  ...(!isWorker ? [{ key: 'exams', label: 'Mock Tests', count: exams.length }] : []),
  { key: 'jobs', label: 'Govt Jobs', count: jobSummary.live + jobSummary.upcoming + jobSummary.previous }],
  [videos.length, exams.length, isWorker, jobSummary]);

  const openVideo = (video) => {
    if (video.videoUrl) {
      educationAPI.incrementView(video.id).catch(() => {});
      Linking.openURL(video.videoUrl);
    }
  };

  const applyJob = async (job, status = 'applied') => {
    try {
      const { data } = await educationAPI.applyGovernmentJob(job.id, { status });
      setJobs((list) => list.map((item) => item.id === job.id ? data : item));
      setJobSummary((prev) => ({ ...prev, applications: prev.applications + (job.myApplication ? 0 : 1) }));
      Alert.alert(status === 'saved' ? 'Saved' : 'Application tracked', `${job.title} has been updated in your jobs list.`);
    } catch {
      Alert.alert('Could not update', 'Please try again after checking your connection.');
    }
  };

  const renderVideo = ({ item }) => {
    const meta = VIDEO_META[item.category] || { color: theme.maroon, bg: theme.goldP, icon: 'Play' };
    return (
      <TouchableOpacity style={[s.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => openVideo(item)} activeOpacity={0.86}>
        <View style={[s.videoThumb, { backgroundColor: meta.bg }]}>
          <Text style={[s.thumbText, { color: meta.color }]}>{meta.icon}</Text>
          <View style={s.playBtn}><Text style={s.playTxt}>{literalT("Play")}</Text></View>
        </View>
        <View style={s.cardBody}>
          <Text style={[s.title, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[s.meta, { color: theme.textM }]}>{item.category} · {(item.views || 0).toLocaleString()}{literalT("views")}</Text>
        </View>
      </TouchableOpacity>);

  };

  const renderExam = ({ item }) =>
  <TouchableOpacity style={[s.examCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => navigation.navigate('Exam', { examId: item.id, title: item.title })} activeOpacity={0.86}>
      <View style={[s.roundIcon, { backgroundColor: theme.maroon + '18' }]}><Text style={[s.roundIconTxt, { color: theme.maroon }]}>{literalT("MCQ")}</Text></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[s.meta, { color: theme.textM }]}>{item.questions}{literalT("questions ·")}{item.duration} · {item.taken}{literalT("attempts")}</Text>
      </View>
      <LinearGradient colors={[theme.maroon, theme.maroonL]} style={s.smallButton}>
        <Text style={s.smallButtonTxt}>{literalT("Start")}</Text>
      </LinearGradient>
    </TouchableOpacity>;


  const renderJob = ({ item }) => {
    const due = item.applyBy ? new Date(item.applyBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'To be announced';
    const statusColor = item.status === 'live' ? theme.green : item.status === 'upcoming' ? theme.blue : theme.textM;
    return (
      <View style={[s.jobCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <View style={s.jobTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.jobTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[s.meta, { color: theme.textM }]} numberOfLines={1}>{item.department} · {item.location}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[s.statusTxt, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <View style={s.jobInfoGrid}>
          <Text style={[s.jobInfo, { color: theme.textL }]}>{literalT("Vacancies:")}{item.vacancies || 0}</Text>
          <Text style={[s.jobInfo, { color: theme.textL }]}>{literalT("Apply by:")}{due}</Text>
          <Text style={[s.jobInfo, { color: theme.textL }]}>{literalT("Eligibility:")}{item.qualification}</Text>
          <Text style={[s.jobInfo, { color: theme.textL }]}>{literalT("Year:")}{item.year || 'Current'}</Text>
        </View>
        <View style={s.jobActions}>
          <TouchableOpacity style={[s.outlineBtn, { borderColor: theme.border }]} onPress={() => applyJob(item, 'saved')}>
            <Text style={[s.outlineTxt, { color: theme.text }]}>{literalT("Save")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: theme.maroon }]} onPress={() => applyJob(item, 'applied')}>
            <Text style={s.primaryTxt}>{item.myApplication?.status === 'applied' ? 'Applied' : 'Track Apply'}</Text>
          </TouchableOpacity>
          {!!item.applicationUrl &&
          <TouchableOpacity style={[s.outlineBtn, { borderColor: theme.border }]} onPress={() => Linking.openURL(item.applicationUrl)}>
              <Text style={[s.outlineTxt, { color: theme.maroon }]}>{literalT("Open")}</Text>
            </TouchableOpacity>
          }
        </View>
      </View>);

  };

  const Header =
  <>
      <StatusBar backgroundColor={theme.maroon} barStyle="light-content" />
      <LinearGradient colors={[theme.maroonD, theme.maroon, theme.maroonL]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{literalT("Education Hub")}</Text>
        <Text style={s.headerSub}>{literalT("Learn · Practice · Apply")}</Text>
        <View style={s.statsRow}>
          <Stat label={literalT("Videos")} value={videos.length} theme={theme} />
          {!isWorker && <><View style={s.statDivider} /><Stat label={literalT("Tests")} value={exams.length} theme={theme} /></>}
          <View style={s.statDivider} />
          <Stat label={literalT("Live Jobs")} value={jobSummary.live} theme={theme} />
        </View>
      </LinearGradient>
      <View style={[s.tabRow, { backgroundColor: theme.bgCard, borderBottomColor: theme.border }]}>
        {tabs.map((item) =>
      <TouchableOpacity key={item.key} style={[s.tab, { borderColor: theme.border, backgroundColor: theme.bg }, tab === item.key && { backgroundColor: theme.maroon, borderColor: theme.maroon }]} onPress={() => setTab(item.key)}>
            <Text style={[s.tabTxt, { color: tab === item.key ? '#fff' : theme.textL }]}>{item.label}</Text>
            <Text style={[s.tabCount, { color: tab === item.key ? '#fff' : theme.textM }]}>{item.count}</Text>
          </TouchableOpacity>
      )}
      </View>
    </>;


  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.maroon} size="large" />
        <Text style={{ color: theme.textM, marginTop: 10 }}>{literalT("Loading education module...")}</Text>
      </View>);

  }

  if (tab === 'jobs') {
    return (
      <View style={[s.root, { backgroundColor: theme.bg }]}>
        {Header}
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderJob}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.maroon} colors={[theme.maroon]} />}
          contentContainerStyle={s.list}
          ListHeaderComponent={
          <View>
              <View style={[s.panel, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                <Text style={[s.panelTitle, { color: theme.text }]}>{literalT("Recruitment Command Center")}</Text>
                <View style={s.kpiRow}>
                  <Text style={[s.kpi, { color: theme.green }]}>{jobSummary.live}{literalT("live")}</Text>
                  <Text style={[s.kpi, { color: theme.blue }]}>{jobSummary.upcoming}{literalT("upcoming")}</Text>
                  <Text style={[s.kpi, { color: theme.textM }]}>{jobSummary.applications}{literalT("tracked")}</Text>
                </View>
                <View style={[s.searchBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <TextInput
                  value={jobQuery}
                  onChangeText={setJobQuery}
                  onSubmitEditing={onRefresh}
                  placeholder={literalT("Search department, exam, qualification")}
                  placeholderTextColor={theme.textM}
                  style={[s.searchInput, { color: theme.text }]}
                  returnKeyType="search" />
                
                  <TouchableOpacity onPress={onRefresh} style={[s.searchBtn, { backgroundColor: theme.maroon }]}>
                    <Text style={s.searchTxt}>{literalT("Search")}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                  {JOB_STATUS.map((item) =>
                <TouchableOpacity key={item.key} style={[s.filterChip, { borderColor: theme.border, backgroundColor: theme.bg }, jobStatus === item.key && { backgroundColor: theme.maroon, borderColor: theme.maroon }]} onPress={() => setJobStatus(item.key)}>
                      <Text style={[s.filterTxt, { color: jobStatus === item.key ? '#fff' : theme.textL }]}>{item.label}</Text>
                    </TouchableOpacity>
                )}
                </ScrollView>
              </View>

              <View style={s.twoCol}>
                <View style={[s.infoCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                  <Text style={[s.panelTitle, { color: theme.text }]}>{literalT("Performance")}</Text>
                  <Text style={[s.bigMetric, { color: theme.maroon }]}>{analytics?.averageScore || 0}%</Text>
                  <Text style={[s.meta, { color: theme.textM }]}>{analytics?.attempts || 0}{literalT("attempts · streak")}{analytics?.streak || 0}</Text>
                  <View style={s.badgeWrap}>
                    {(analytics?.badges || ['Start Practice']).map((badge) => <Text key={badge} style={[s.badge, { color: theme.maroon, backgroundColor: theme.goldP }]}>{badge}</Text>)}
                  </View>
                </View>
                <View style={[s.infoCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                  <Text style={[s.panelTitle, { color: theme.text }]}>{literalT("Adaptive Practice")}</Text>
                  <Text style={[s.meta, { color: theme.textM }]}>{literalT("Level:")}{adaptive?.nextDifficulty || 'foundation'}</Text>
                  {(adaptive?.focusAreas || ['General Knowledge']).slice(0, 3).map((area) =>
                <Text key={area} style={[s.focusArea, { color: theme.text }]}>{area}</Text>
                )}
                </View>
              </View>

              <View style={[s.panel, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                <Text style={[s.panelTitle, { color: theme.text }]}>{literalT("Leaderboard")}</Text>
                {leaderboard.slice(0, 5).map((row) =>
              <View key={`${row.rank}-${row.name}`} style={s.leaderRow}>
                    <Text style={[s.rank, { color: theme.maroon }]}>#{row.rank}</Text>
                    <Text style={[s.leaderName, { color: theme.text }]} numberOfLines={1}>{row.name}</Text>
                    <Text style={[s.meta, { color: theme.textM }]}>{row.accuracy}%</Text>
                  </View>
              )}
                {leaderboard.length === 0 && <Text style={[s.meta, { color: theme.textM }]}>{literalT("Leaderboard starts after mock test submissions.")}</Text>}
              </View>
            </View>
          }
          ListEmptyComponent={<Empty title={literalT("No jobs found")} sub={literalT("Live, upcoming, and previous year jobs will appear here.")} theme={theme} />} />
        
      </View>);

  }

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {Header}
      <FlatList
        data={tab === 'videos' ? videos : exams}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.maroon} colors={[theme.maroon]} />}
        renderItem={tab === 'videos' ? renderVideo : renderExam}
        ListEmptyComponent={<Empty title={tab === 'videos' ? 'No videos yet' : 'No mock tests yet'} sub={literalT("New learning content will appear here.")} theme={theme} />} />
      
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: 16, paddingHorizontal: 16 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 42, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  backTxt: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: -2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 14 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.72)', marginTop: 2, fontWeight: '700' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  tabRow: { flexDirection: 'row', padding: 10, gap: 8, borderBottomWidth: 1 },
  tab: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  tabTxt: { fontSize: 12, fontWeight: '800' },
  tabCount: { fontSize: 10, fontWeight: '800', marginTop: 1 },
  list: { padding: 14, paddingBottom: 34 },
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, elevation: 2 },
  videoThumb: { height: 128, alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 28, fontWeight: '900' },
  playBtn: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  playTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardBody: { padding: 14 },
  title: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  meta: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  examCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, elevation: 2 },
  roundIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roundIconTxt: { fontSize: 12, fontWeight: '900' },
  smallButton: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12 },
  smallButtonTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
  panel: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 12 },
  panelTitle: { fontSize: 15, fontWeight: '900', marginBottom: 10 },
  kpiRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  kpi: { fontSize: 12, fontWeight: '900' },
  searchBox: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden', alignItems: 'center' },
  searchInput: { flex: 1, minHeight: 44, paddingHorizontal: 12, fontSize: 13 },
  searchBtn: { alignSelf: 'stretch', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  searchTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
  filterRow: { gap: 8, paddingTop: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  filterTxt: { fontSize: 12, fontWeight: '800' },
  twoCol: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, minHeight: 132 },
  bigMetric: { fontSize: 30, fontWeight: '900' },
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  focusArea: { fontSize: 12, fontWeight: '800', marginTop: 7 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  rank: { width: 34, fontSize: 13, fontWeight: '900' },
  leaderName: { flex: 1, fontSize: 13, fontWeight: '800' },
  jobCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 12 },
  jobTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  jobTitle: { fontSize: 15, fontWeight: '900', lineHeight: 20 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  statusTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  jobInfoGrid: { marginTop: 12, gap: 5 },
  jobInfo: { fontSize: 12, lineHeight: 17 },
  jobActions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  outlineBtn: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outlineTxt: { fontSize: 12, fontWeight: '900' },
  primaryBtn: { flex: 1.2, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 }
});
