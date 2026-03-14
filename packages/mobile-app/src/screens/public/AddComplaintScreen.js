import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, COMPLAINT_CATEGORIES, TN_DISTRICTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage':          '🛣️',
  'Garbage Issue':        '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue':       '🚰',
  'Public Safety Issue':  '🚨',
  'Others':               '📝',
};

export default function AddComplaintScreen({ navigation }) {
  const { userInfo } = useAuth();
  const [form, setForm] = useState({
    category:    '',
    description: '',
    booth:       userInfo?.booth    || '',
    district:    userInfo?.district || 'Chennai',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.category) {
      Alert.alert('Missing', 'Please select an issue category.'); return;
    }
    if (!form.description.trim() || form.description.length < 10) {
      Alert.alert('Missing', 'Please describe the issue (at least 10 characters).'); return;
    }
    if (!form.booth.trim()) {
      Alert.alert('Missing', 'Please enter your booth number.'); return;
    }
    setLoading(true);
    try {
      await complaintAPI.create(form);
      Alert.alert('✅ Submitted!', 'Your complaint has been registered and assigned to your local worker.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* ── Maroon Header ── */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headerIcon}>
          <Text style={{ fontSize: 28 }}>📋</Text>
        </View>
        <Text style={s.headerTitle}>Report an Issue</Text>
        <Text style={s.headerSub}>We'll assign your complaint to the nearest booth worker</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Category ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🏷️</Text>
            <Text style={s.sectionTitle}>Issue Category *</Text>
          </View>
          <View style={s.categoryGrid}>
            {COMPLAINT_CATEGORIES.map((cat) => {
              const active = form.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.categoryChip, active && s.categoryChipActive]}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[s.categoryText, active && { color: '#fff', fontWeight: '700' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Description ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>📝</Text>
            <Text style={s.sectionTitle}>Description *</Text>
          </View>
          <TextInput
            style={s.textarea}
            placeholder="Describe the issue in detail... (minimum 10 characters)"
            placeholderTextColor={T.textM}
            value={form.description}
            onChangeText={v => setForm(f => ({ ...f, description: v }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} characters</Text>
        </View>

        {/* ── Booth ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>🏠</Text>
            <Text style={s.sectionTitle}>Booth Number *</Text>
          </View>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="e.g. Booth 12 or Ward 5"
              placeholderTextColor={T.textM}
              value={form.booth}
              onChangeText={v => setForm(f => ({ ...f, booth: v }))}
            />
          </View>
        </View>

        {/* ── District ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionIcon}>📍</Text>
            <Text style={s.sectionTitle}>District</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TN_DISTRICTS.map((d) => {
              const active = form.district === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[s.districtChip, active && s.districtChipActive]}
                  onPress={() => setForm(f => ({ ...f, district: d }))}
                  activeOpacity={0.8}
                >
                  <Text style={[s.districtText, active && { color: '#fff', fontWeight: '700' }]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Summary card ── */}
        {form.category && form.district && (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>📋 Complaint Summary</Text>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Category</Text>
              <Text style={s.summaryValue}>{CATEGORY_ICONS[form.category]} {form.category}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>District</Text>
              <Text style={s.summaryValue}>📍 {form.district}</Text>
            </View>
            {form.booth ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Booth</Text>
                <Text style={s.summaryValue}>🏠 {form.booth}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[T.maroon, T.maroonL]} style={s.submitGrad}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={s.submitText}>🚀 Submit Complaint</Text>
                  <Text style={s.submitSub}>Your complaint will be assigned instantly</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: T.bg },

  // header
  header:       { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn:      { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:      { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  headerIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  // scroll
  scroll:       { flex: 1 },
  scrollContent:{ padding: 20 },

  // sections
  section:      { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon:  { fontSize: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: T.text },

  // category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: { width: '46%', borderRadius: 16, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg, padding: 12, alignItems: 'center' },
  categoryChipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  categoryText: { fontSize: 12, fontWeight: '600', color: T.textL, textAlign: 'center', marginTop: 2 },

  // textarea
  textarea:     { borderWidth: 1.5, borderColor: T.border, borderRadius: 14, padding: 14, fontSize: 14, color: T.text, backgroundColor: T.bg, height: 110, textAlignVertical: 'top' },
  charCount:    { fontSize: 11, color: T.textM, textAlign: 'right', marginTop: 6 },

  // input
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: T.border, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14 },
  input:        { flex: 1, paddingVertical: 14, fontSize: 15, color: T.text },

  // district
  districtChip:       { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, marginRight: 8, backgroundColor: T.bg },
  districtChipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  districtText:       { fontSize: 13, color: T.textL, fontWeight: '600' },

  // summary
  summaryCard:  { backgroundColor: '#FFF8E7', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#C9982A' },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: T.maroonD, marginBottom: 12 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: T.textM, fontWeight: '600' },
  summaryValue: { fontSize: 13, color: T.text, fontWeight: '700' },

  // submit
  submitBtn:    { borderRadius: 50, overflow: 'hidden', elevation: 6, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  submitGrad:   { paddingVertical: 18, alignItems: 'center' },
  submitText:   { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  submitSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
});