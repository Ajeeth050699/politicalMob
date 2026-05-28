import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Platform, StatusBar, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationAPI, complaintAPI } from '../../services/api';
import { T } from '../../constants/theme';

const TYPE_META = {
  complaint:    { icon: '📋', color: '#3b82f6', bg: '#dbeafe', label: 'Complaint'    },
  worker:       { icon: '👷', color: '#8b5cf6', bg: '#ede9fe', label: 'Worker'       },
  camp:         { icon: '🏕️', color: '#16a34a', bg: '#dcfce7', label: 'Camp'         },
  news:         { icon: '📰', color: '#f59e0b', bg: '#fef3c7', label: 'News'         },
  announcement: { icon: '📢', color: T.maroon,  bg: '#fee2e2', label: 'Announcement' },
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationDetail({ route, navigation }) {
  const { id } = route.params;
  const [notification, setNotification] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotification = async () => {
      try {
        const { data } = await notificationAPI.getById(id);
        setNotification(data);

        // If this notification is related to a complaint, load it
        if (data.relatedComplaintId) {
          try {
            const { data: complaintData } = await complaintAPI.getById(data.relatedComplaintId);
            setComplaint(complaintData);
          } catch (err) {
            // Complaint might be deleted
          }
        }
      } catch (err) {
        console.error('Error loading notification:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotification();
  }, [id]);

  const handleOpenComplaint = () => {
    if (complaint?.id) {
      navigation.navigate('ComplaintDetail', { id: complaint.id });
    }
  };

  const handleArchive = async () => {
    try {
      await notificationAPI.archive(id);
      navigation.goBack();
    } catch (err) {
      console.error('Error archiving notification:', err);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={{ color: T.textM, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={s.center}>
        <Text style={{ color: T.textM, fontSize: 16 }}>Notification not found</Text>
      </View>
    );
  }

  const meta = TYPE_META[notification.type] || TYPE_META.announcement;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notification Details</Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Type Badge */}
        <View style={[s.typeBadgeContainer, { backgroundColor: meta.bg }]}>
          <Text style={s.typeIcon}>{meta.icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.typeLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={s.timeText}>{timeAgo(notification.time)}</Text>
          </View>
        </View>

        {/* Message */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Message</Text>
          <Text style={s.message}>{notification.msg}</Text>
        </View>

        {/* Complaint Details (if related) */}
        {complaint && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Related Complaint</Text>
            <View style={s.complaintBox}>
              <View style={s.complaintRow}>
                <Text style={s.label}>Category:</Text>
                <Text style={s.value}>{complaint.category}</Text>
              </View>
              <View style={s.complaintRow}>
                <Text style={s.label}>Status:</Text>
                <Text style={[s.value, { color: getStatusColor(complaint.status) }]}>
                  {complaint.status}
                </Text>
              </View>
              <View style={s.complaintRow}>
                <Text style={s.label}>Ward:</Text>
                <Text style={s.value}>{complaint.ward}</Text>
              </View>
              {complaint.assignedWorker && (
                <View style={s.complaintRow}>
                  <Text style={s.label}>Assigned Worker:</Text>
                  <Text style={s.value}>{complaint.assignedWorker}</Text>
                </View>
              )}
              <TouchableOpacity
                style={s.viewComplaintBtn}
                onPress={handleOpenComplaint}
              >
                <Text style={s.viewComplaintBtnText}>View Full Complaint →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Details</Text>
          <View style={s.metaRow}>
            <Text style={s.label}>Status:</Text>
            <Text style={[s.value, { color: notification.status === 'read' ? T.green : T.maroon }]}>
              {notification.status === 'read' ? '✓ Read' : '○ Unread'}
            </Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.label}>Date:</Text>
            <Text style={s.value}>{new Date(notification.time).toLocaleString('en-IN')}</Text>
          </View>
          {notification.createdBy && (
            <View style={s.metaRow}>
              <Text style={s.label}>From:</Text>
              <Text style={s.value}>{notification.createdBy}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, s.archiveBtn]}
            onPress={handleArchive}
          >
            <Text style={s.actionBtnText}>📦 Archive</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'COMPLETED':
      return '#16a34a';
    case 'IN PROGRESS':
      return '#f59e0b';
    case 'ACCEPTED':
      return '#3b82f6';
    case 'NEW':
      return '#8b5cf6';
    default:
      return T.text;
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 16, paddingHorizontal: 20, zIndex: 1 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, padding: 8, zIndex: 10, elevation: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: '600', marginTop: -4 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },

  content: { flex: 1, padding: 16 },

  typeBadgeContainer: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  typeIcon: { fontSize: 36, marginRight: 8 },
  typeLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  timeText: { fontSize: 12, color: T.textM },

  section: { marginBottom: 20, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: T.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  message: {
    fontSize: 15,
    color: T.text,
    lineHeight: 24,
    fontFamily: "'Source Sans 3',sans-serif",
  },

  complaintBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T.border },
  complaintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  complaintRow_last: { borderBottomWidth: 0 },
  label: { fontSize: 12, color: T.textM, fontWeight: '600' },
  value: { fontSize: 12, color: T.text, fontWeight: '700' },

  viewComplaintBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: T.maroon,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewComplaintBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },

  actions: { paddingHorizontal: 16, marginBottom: 20, flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  archiveBtn: { backgroundColor: '#f3f4f6', borderColor: T.border },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: T.text },
});
