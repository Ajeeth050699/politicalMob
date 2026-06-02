import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { notificationAPI } from '../../services/api';
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

export default function AdminNotifications({ navigation }) {
  const { t, i18n } = useTranslation();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('unread');

  const FILTERS = ['ALL', 'complaint', 'worker', 'announcement', 'news'];
  const STATUS_FILTERS = ['unread', 'read', 'ALL'];

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard');
  };

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

  const notificationText = (msg = '') => {
    if (i18n.language !== 'ta') return msg;
    return msg
      .replace('A worker is working on your complaint', 'உங்கள் புகாரில் பணியாளர் வேலை செய்து கொண்டிருக்கிறார்')
      .replace('Your complaint', 'உங்கள் புகார்')
      .replace('has been accepted by', 'ஏற்றுக்கொள்ளப்பட்டது -')
      .replace('New complaint in your nearby area:', 'உங்கள் அருகிலுள்ள பகுதியில் புதிய புகார்:')
      .replace('New complaint in your ward:', 'உங்கள் வார்டில் புதிய புகார்:')
      .replace('Road Damage', 'சாலை சேதம்')
      .replace('Street Light Problem', 'தெரு விளக்கு பிரச்சினை')
      .replace('Garbage Issue', 'குப்பை பிரச்சினை')
      .replace('Water Supply Problem', 'குடிநீர் விநியோக பிரச்சினை')
      .replace('Drainage Issue', 'வடிகால் பிரச்சினை')
      .replace('Public Safety Issue', 'பொது பாதுகாப்பு பிரச்சினை');
  };

  const renderItem = ({ item: n }) => {
    const meta = TYPE_META[n.type] || TYPE_META.announcement;
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: meta.color, borderLeftWidth: 4, opacity: n.status === 'read' ? 0.72 : 1 }]}
        onPress={() => navigation.navigate('NotificationDetail', { id: n._id || n.id })}
        activeOpacity={0.72}
      >
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Text style={s.iconText}>{meta.icon}</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.topRow}>
            <View style={[s.typeBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.typeTxt, { color: meta.color }]}>{t(meta.labelKey)}</Text>
            </View>
            {n.status === 'unread' && <View style={s.unreadDot} />}
            <Text style={s.time}>{timeAgo(n.time, t)}</Text>
          </View>
          <Text style={s.msg} numberOfLines={3}>{notificationText(n.msg)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={T.maroon} size="large" />
        <Text style={s.loadingText}>{t('loadingNotifications')}</Text>
      </View>
    );
  }

  const unreadCount = notifs.filter(n => n.status === 'unread').length;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🔔 {t('activityLog')}</Text>
        <Text style={s.headerSub}>{t('totalNotifications', { count: notifs.length })}</Text>
        {unreadCount > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{t('unreadCount', { count: unreadCount })}</Text>
          </View>
        )}
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

        <View style={s.filterBlockLast}>
          <Text style={s.filterLabel}>{t('status')}</Text>
          <View style={s.filterRow}>
            {STATUS_FILTERS.map(sf => (
              <TouchableOpacity
                key={sf}
                style={[s.chip, statusFilter === sf && s.chipActive]}
                onPress={() => setStatusFilter(sf)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipTxt, statusFilter === sf && s.chipTxtActive]}>
                  {sf === 'ALL' ? t('allStatus2') : sf === 'unread' ? `○ ${t('unread')}` : `✓ ${t('read')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={notifs}
        keyExtractor={n => (n._id || n.id)?.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[T.maroon]} tintColor={T.maroon} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔔</Text>
            <Text style={s.emptyTitle}>{t('noNotifications')}</Text>
            <Text style={s.emptySub}>{t('notificationsEmptySub')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: T.textM, marginTop: 10 },

  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 18, paddingHorizontal: 18, zIndex: 1 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, padding: 8, zIndex: 10, elevation: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: '600', marginTop: -4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4 },
  unreadBadge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'center' },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  filterPanel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  filterBlock: { marginBottom: 10 },
  filterBlockLast: { marginBottom: 0 },
  filterLabel: { fontSize: 11, fontWeight: '800', color: T.textM, marginBottom: 8, textTransform: 'uppercase' },
  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: T.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  chipTxt: { fontSize: 12, fontWeight: '700', color: T.textL },
  chipTxtActive: { color: '#fff', fontWeight: '800' },
  chipIcon: { fontSize: 12, marginRight: 5 },

  listContent: { padding: 14, paddingBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 13, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 20 },
  cardBody: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  typeTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.maroon },
  time: { fontSize: 11, color: T.textM, marginLeft: 'auto' },
  msg: { fontSize: 13, color: T.text, lineHeight: 19 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textM, textAlign: 'center' },
});
