import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../constants/theme';

const TYPE_META = {
  complaint:    { icon: '📋', color: '#3b82f6', bg: '#dbeafe', labelKey: 'complaint' },
  worker:       { icon: '👷', color: '#8b5cf6', bg: '#ede9fe', labelKey: 'worker' },
  camp:         { icon: '🏕️', color: '#16a34a', bg: '#dcfce7', labelKey: 'camp' },
  news:         { icon: '📰', color: '#f59e0b', bg: '#fef3c7', labelKey: 'news' },
  announcement: { icon: '📢', color: T.maroon,  bg: '#fee2e2', labelKey: 'announcement' },
};

function timeAgo(dateStr, t) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / 1000));
  if (seconds < 60) return t('secondsAgo', { count: seconds });
  if (seconds < 3600) return t('minutesAgo', { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('hoursAgo', { count: Math.floor(seconds / 3600) });
  return t('daysAgo', { count: Math.floor(seconds / 86400) });
}

export default function NotificationsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { userInfo } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('unread');

  const FILTERS = ['ALL', 'complaint', 'news', 'camp', 'announcement'];
  const STATUS_FILTERS = ['unread', 'read', 'ALL'];

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const params = {};
      if (filter !== 'ALL') params.type = filter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await notificationAPI.getAll(params);
      setNotifs(Array.isArray(data) ? data : data?.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(userInfo?.role === 'worker' ? 'Dashboard' : 'Home');
  };

  const notificationText = (msg = '') => {
    if (i18n.language !== 'ta') return msg;
    return msg
      .replace('A worker is working on your complaint', 'உங்கள் புகாரில் பணியாளர் பணிபுரிகிறார்')
      .replace('Your complaint', 'உங்கள் புகார்')
      .replace('has been accepted by', 'ஏற்றுக்கொள்ளப்பட்டது -')
      .replace('New complaint in your nearby area:', 'உங்கள் அருகிலுள்ள பகுதியில் புதிய புகார்:')
      .replace('New complaint in your ward:', 'உங்கள் வார்டில் புதிய புகார்:')
      .replace('Road Damage', 'சாலை சேதம்')
      .replace('Street Light Problem', 'தெரு விளக்கு பிரச்சனை')
      .replace('Garbage Issue', 'குப்பை பிரச்சனை')
      .replace('Water Supply Problem', 'குடிநீர் விநியோக பிரச்சனை')
      .replace('Drainage Issue', 'வடிகால் பிரச்சனை')
      .replace('Public Safety Issue', 'பொது பாதுகாப்பு பிரச்சனை');
  };

  const renderItem = ({ item: n }) => {
    const meta = TYPE_META[n.type] || TYPE_META.announcement;
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: meta.color, borderLeftWidth: 4, opacity: n.status === 'read' ? 0.7 : 1 }]}
        onPress={() => navigation.navigate('NotificationDetail', { id: n._id || n.id })}
        activeOpacity={0.7}
      >
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.topRow}>
            <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.typeTxt, { color: meta.color }]}>{t(meta.labelKey)}</Text>
            </View>
            <Text style={s.time}>{timeAgo(n.time, t)}</Text>
          </View>
          <Text style={s.msg}>{notificationText(n.msg)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>{t('loadingNotifications')}</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔔 {t('notifications')}</Text>
        <Text style={s.headerSub}>{t('notificationsSubtitle')}</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.length}</Text>
            <Text style={s.statLabel}>{t('total')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.filter(n => n.type === 'complaint').length}</Text>
            <Text style={s.statLabel}>{t('complaints')}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{notifs.filter(n => n.type === 'announcement').length}</Text>
            <Text style={s.statLabel}>{t('announcements')}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={s.filterPanel}>
        <View style={s.filterBlock}>
          <Text style={s.filterLabel}>{t('notificationType')}</Text>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.chip, filter === f && s.chipActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                {f !== 'ALL' && <Text style={s.chipIcon}>{TYPE_META[f]?.icon}</Text>}
                <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>
                  {f === 'ALL' ? t('all') : t(TYPE_META[f]?.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.filterBlock}>
          <Text style={s.filterLabel}>{t('status')}</Text>
          <View style={s.filterRow}>
            {STATUS_FILTERS.map(s_f => (
              <TouchableOpacity
                key={s_f}
                style={[s.chip, statusFilter === s_f && s.chipActive]}
                onPress={() => setStatusFilter(s_f)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipTxt, statusFilter === s_f && s.chipTxtActive]}>
                  {s_f === 'ALL' ? t('allStatus2') : s_f === 'unread' ? `○ ${t('unread')}` : `✓ ${t('read')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={notifs}
        keyExtractor={n => (n._id || n.id)?.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.maroon]} tintColor={T.maroon} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>🔔</Text>
            <Text style={s.emptyTitle}>{t('noNotificationsYet')}</Text>
            <Text style={s.emptySub}>{t('notificationsEmptySub')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 20, paddingHorizontal: 20, zIndex: 1 },
  backBtn:     { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, padding: 8, zIndex: 10, elevation: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: '600', marginTop: -4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '900', color: '#fff' },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600', textAlign: 'center' },

  filterPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  filterBlock: { marginBottom: 10 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: T.textM, marginBottom: 8, textTransform: 'uppercase' },
  filterRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  chip:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: T.border, backgroundColor: '#fff' },
  chipActive:  { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt:     { fontSize: 12, fontWeight: '700', color: T.textL },
  chipTxtActive: { color: '#fff', fontWeight: '800' },
  chipIcon:    { fontSize: 12, marginRight: 5 },

  card:        { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  iconBox:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  typeBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  typeTxt:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  time:        { fontSize: 11, color: T.textM, marginLeft: 'auto' },
  msg:         { fontSize: 14, color: T.text, lineHeight: 21 },

  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: T.textM, textAlign: 'center' },
});
