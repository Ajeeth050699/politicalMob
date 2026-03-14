import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS, PRIORITY_COLORS } from '../../constants/theme';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡',
  'Road Damage':          '🛣️',
  'Garbage Issue':        '🗑️',
  'Water Supply Problem': '💧',
  'Drainage Issue':       '🚰',
  'Public Safety Issue':  '🚨',
  'Others':               '📝',
};

const STATUS_ICONS = {
  'NEW':         '🆕',
  'IN PROGRESS': '⚙️',
  'COMPLETED':   '✅',
};

export default function ComplaintDetail({ route, navigation }) {
  const { id } = route.params;
  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    complaintAPI.getById(id)
      .then(({ data }) => setComplaint(data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>Loading details...</Text>
    </View>
  );
  if (!complaint) return null;

  const sc = STATUS_COLORS[complaint.status] || { bg: '#f3f4f6', color: '#6b7280' };
  const pc = PRIORITY_COLORS[complaint.priority] || T.amber;
  const catIcon = CATEGORY_ICONS[complaint.category] || '📝';

  const rows = [
    { label: 'Description',      value: complaint.description,                    icon: '📝' },
    { label: 'Booth',            value: complaint.booth,                           icon: '🏠' },
    { label: 'District',         value: complaint.district,                        icon: '📍' },
    { label: 'Submitted By',     value: complaint.user?.name    || 'Unknown',      icon: '👤' },
    { label: 'Assigned Worker',  value: complaint.assignedWorker?.name || 'Not yet assigned', icon: '👷' },
    { label: 'Date Submitted',   value: new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅' },
  ];

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>

          {/* Category icon */}
          <View style={s.catIconBox}>
            <Text style={{ fontSize: 36 }}>{catIcon}</Text>
          </View>

          <Text style={s.catTitle}>{complaint.category}</Text>

          {/* Status + Priority badges */}
          <View style={s.badgeRow}>
            <View style={[s.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={{ fontSize: 14 }}>{STATUS_ICONS[complaint.status]}</Text>
              <Text style={s.statusTxt}>{complaint.status}</Text>
            </View>
            <View style={[s.priorityBadge, { backgroundColor: pc + '30' }]}>
              <Text style={[s.priorityTxt, { color: pc }]}>
                {(complaint.priority || 'medium').toUpperCase()} PRIORITY
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Status timeline ── */}
        <View style={s.timeline}>
          {['NEW', 'IN PROGRESS', 'COMPLETED'].map((step, i) => {
            const isActive = complaint.status === step;
            const isDone   = ['NEW', 'IN PROGRESS', 'COMPLETED'].indexOf(complaint.status) > i;
            return (
              <React.Fragment key={step}>
                <View style={s.timelineStep}>
                  <View style={[
                    s.timelineDot,
                    isActive && { backgroundColor: T.maroon, borderColor: T.maroon },
                    isDone   && { backgroundColor: T.green,  borderColor: T.green  },
                  ]}>
                    <Text style={{ fontSize: 10, color: (isActive || isDone) ? '#fff' : T.textM }}>
                      {isDone ? '✓' : i + 1}
                    </Text>
                  </View>
                  <Text style={[s.timelineLabel, (isActive || isDone) && { color: T.text, fontWeight: '700' }]}>
                    {step === 'IN PROGRESS' ? 'In Progress' : step.charAt(0) + step.slice(1).toLowerCase()}
                  </Text>
                </View>
                {i < 2 && (
                  <View style={[s.timelineLine, isDone && { backgroundColor: T.green }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Details ── */}
        <View style={s.body}>
          {rows.map(({ label, value, icon }) => (
            <View key={label} style={s.row}>
              <View style={s.rowIcon}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowValue}>{value}</Text>
              </View>
            </View>
          ))}

          {/* Proof photo indicator */}
          {complaint.proofPhoto && (
            <View style={s.proofCard}>
              <Text style={{ fontSize: 24 }}>📸</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.proofTitle}>Proof Photo Uploaded</Text>
                <Text style={s.proofSub}>Worker has submitted proof of resolution</Text>
              </View>
              <View style={s.proofBadge}>
                <Text style={s.proofBadgeTxt}>Verified</Text>
              </View>
            </View>
          )}

          {/* Worker not assigned info */}
          {!complaint.assignedWorker && (
            <View style={s.infoCard}>
              <Text style={{ fontSize: 20 }}>ℹ️</Text>
              <Text style={s.infoTxt}>
                Your complaint is pending assignment. A worker from your booth will be assigned shortly.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28, alignItems: 'center', paddingHorizontal: 24 },
  backBtn:     { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  catIconBox:  { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 8 },
  catTitle:    { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 14 },
  badgeRow:    { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  statusTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  priorityBadge:{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  priorityTxt: { fontSize: 11, fontWeight: '800' },

  // Timeline
  timeline:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: T.border },
  timelineStep:  { alignItems: 'center', gap: 6 },
  timelineDot:   { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: T.border, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  timelineLabel: { fontSize: 10, color: T.textM, fontWeight: '600', textAlign: 'center', maxWidth: 70 },
  timelineLine:  { flex: 1, height: 2, backgroundColor: T.border, marginHorizontal: 4, marginBottom: 20 },

  // Details
  body:       { padding: 16 },
  row:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  rowIcon:    { width: 40, height: 40, borderRadius: 12, backgroundColor: T.maroon + '10', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:   { fontSize: 11, color: T.textM, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  rowValue:   { fontSize: 15, color: T.text, fontWeight: '500', lineHeight: 22 },

  proofCard:  { backgroundColor: '#dcfce7', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 1, borderColor: '#16a34a40' },
  proofTitle: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  proofSub:   { fontSize: 12, color: '#166534', marginTop: 2 },
  proofBadge: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  proofBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: '700' },

  infoCard:   { backgroundColor: '#fef3c7', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#d97706' + '40' },
  infoTxt:    { fontSize: 13, color: '#92400e', flex: 1, lineHeight: 19 },
});