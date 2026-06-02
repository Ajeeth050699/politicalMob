import { literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform, StatusBar } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { educationAPI } from '../../services/api';
import { T } from '../../constants/theme';

const initialForm = {
  title: '',
  department: '',
  category: 'Government',
  location: 'Tamil Nadu',
  qualification: 'Any Degree',
  vacancies: '0',
  status: 'upcoming',
  year: String(new Date().getFullYear()),
  applicationUrl: ''
};

function Field({ label, value, onChangeText, keyboardType = 'default', multiline = false }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 68, textAlignVertical: 'top' }]}
        placeholderTextColor={T.textM} />
      
    </View>);

}

export default function AdminEducation() {
  const [summary, setSummary] = useState({ live: 0, upcoming: 0, previous: 0, applications: 0 });
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [summaryRes, jobsRes] = await Promise.all([
    educationAPI.getGovernmentJobSummary().catch(() => ({ data: summary })),
    educationAPI.getGovernmentJobs({ limit: 20 }).catch(() => ({ data: { data: [] } }))]
    );
    setSummary(summaryRes.data || summary);
    setJobs(Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.title.trim() || !form.department.trim()) {
      Alert.alert('Missing details', 'Title and department are required.');
      return;
    }
    setSaving(true);
    try {
      await educationAPI.createGovernmentJob({
        ...form,
        vacancies: Number(form.vacancies) || 0,
        year: Number(form.year) || new Date().getFullYear()
      });
      setForm(initialForm);
      await load();
      Alert.alert('Job published', 'Government job has been added to Education.');
    } catch {
      Alert.alert('Could not save', 'Please verify the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={s.loading}>{literalT("Loading education admin...")}</Text>
      </View>);

  }

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroonD} barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[T.maroonD, T.maroon, T.maroonL]} style={s.header}>
          <Text style={s.headerTitle}>{literalT("Education Admin")}</Text>
          <Text style={s.headerSub}>{literalT("Government jobs, mock tests, analytics, and recruitment updates")}</Text>
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statNum}>{summary.live}</Text><Text style={s.statLabel}>{literalT("Live")}</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statNum}>{summary.upcoming}</Text><Text style={s.statLabel}>{literalT("Upcoming")}</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statNum}>{summary.applications}</Text><Text style={s.statLabel}>{literalT("Applications")}</Text></View>
          </View>
        </LinearGradient>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{literalT("Create Government Job")}</Text>
          <View style={s.formCard}>
            <Field label={literalT("Job title")} value={form.title} onChangeText={(v) => set('title', v)} />
            <Field label={literalT("Department")} value={form.department} onChangeText={(v) => set('department', v)} />
            <View style={s.row}>
              <View style={{ flex: 1 }}><Field label={literalT("Category")} value={form.category} onChangeText={(v) => set('category', v)} /></View>
              <View style={{ flex: 1 }}><Field label={literalT("Status")} value={form.status} onChangeText={(v) => set('status', v.toLowerCase())} /></View>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1 }}><Field label={literalT("Vacancies")} value={form.vacancies} onChangeText={(v) => set('vacancies', v)} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label={literalT("Year")} value={form.year} onChangeText={(v) => set('year', v)} keyboardType="number-pad" /></View>
            </View>
            <Field label={literalT("Qualification")} value={form.qualification} onChangeText={(v) => set('qualification', v)} />
            <Field label={literalT("Apply URL")} value={form.applicationUrl} onChangeText={(v) => set('applicationUrl', v)} />
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.65 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveTxt}>{literalT("Publish Job")}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{literalT("Recent Jobs")}</Text>
          {jobs.length === 0 ?
          <View style={s.empty}><Text style={s.emptyTxt}>{literalT("No government jobs created yet.")}</Text></View> :
          jobs.map((job) =>
          <View key={job.id} style={s.jobCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.jobTitle}>{job.title}</Text>
                <Text style={s.jobMeta}>{job.department} · {job.status} · {job.applications}{literalT("applications")}</Text>
              </View>
              <Text style={s.jobYear}>{job.year || 'Now'}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loading: { marginTop: 10, color: T.textM },
  scroll: { paddingBottom: 34 },
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingHorizontal: 18, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 16, padding: 14, marginTop: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '800', marginTop: 2 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  section: { paddingHorizontal: 14, paddingTop: 18 },
  sectionTitle: { color: T.text, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 14 },
  field: { marginBottom: 12 },
  label: { color: T.textL, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 44, color: T.text, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: { backgroundColor: T.maroon, borderRadius: 14, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  empty: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: T.border },
  emptyTxt: { color: T.textM, textAlign: 'center', fontSize: 13 },
  jobCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobTitle: { color: T.text, fontSize: 14, fontWeight: '900' },
  jobMeta: { color: T.textM, fontSize: 12, marginTop: 3 },
  jobYear: { color: T.maroon, fontSize: 13, fontWeight: '900' }
});
