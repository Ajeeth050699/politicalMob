import { complaintCategoryT, literalT } from "../../i18n/runtimeTamil";
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, StatusBar, Animated, Image, Dimensions, FlatList, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { complaintAPI, emergencyAPI } from '../../services/api';
import { T, STATUS_COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';


const { width } = Dimensions.get('window');
const APP_LOGO = require('../../../assets/images/icon.png');
const QA_CARD_WIDTH = Math.floor((width - 52) / 3);
const EMER_CARD_WIDTH = Math.min(138, Math.floor((width - 56) / 3));

const EMER_GRADS = {
  police: ['#1d4ed8', '#3b82f6'],
  ambulance: ['#b91c1c', '#ef4444'],
  fire: ['#b45309', '#f59e0b'],
  women: ['#9d174d', '#ec4899'],
  child: ['#6d28d9', '#8b5cf6'],
  district: ['#065f46', '#22c55e']
};
const EMER_BAR = { police: '#60a5fa', ambulance: '#fca5a5', fire: '#fcd34d', women: '#f9a8d4', child: '#c4b5fd', district: '#86efac' };
const EMER_ICON = { police: 'police-badge-outline', ambulance: 'ambulance', fire: 'fire-truck', women: 'face-woman-outline', child: 'baby-face-outline', district: 'office-building-marker-outline' };

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const CATEGORY_ICONS = {
  'Street Light Problem': 'lightbulb-on-outline',
  'Road Damage': 'road-variant',
  'Garbage Issue': 'trash-can-outline',
  'Water Supply Problem': 'water-outline',
  'Drainage Issue': 'pipe-leak',
  'Public Safety Issue': 'shield-alert-outline',
  Others: 'file-document-outline'
};

// ─────────────────────────────────────────────────────────────────────────────
// PULSE DOT
// ─────────────────────────────────────────────────────────────────────────────
function PulseDot({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, transform: [{ scale: pulse }] }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED LOOP BG
// ─────────────────────────────────────────────────────────────────────────────
function QuickActionBg() {
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3X = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(orb1X, { toValue: 18, duration: 3500, useNativeDriver: true }),
        Animated.timing(orb1Y, { toValue: -14, duration: 3500, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(orb1X, { toValue: -10, duration: 3500, useNativeDriver: true }),
        Animated.timing(orb1Y, { toValue: 10, duration: 3500, useNativeDriver: true })
      ])
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(orb2X, { toValue: -20, duration: 2800, useNativeDriver: true }),
        Animated.timing(orb2Y, { toValue: 12, duration: 2800, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(orb2X, { toValue: 14, duration: 2800, useNativeDriver: true }),
        Animated.timing(orb2Y, { toValue: -10, duration: 2800, useNativeDriver: true })
      ])
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(orb3X, { toValue: 12, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb3Y, { toValue: 8, duration: 4000, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(orb3X, { toValue: -8, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb3Y, { toValue: -12, duration: 4000, useNativeDriver: true })
      ])
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 2400, useNativeDriver: true })
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 3000, useNativeDriver: true })
    ])).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.04, 0.10, 0.04] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width * 0.6] });
  const waveScale = wave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const waveOpacity = wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.18, 0.08] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#FFF5F0', '#FEF0E8', '#FDE8E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={qa.dotGrid} pointerEvents="none">
        {Array.from({ length: 48 }).map((_, i) => <View key={i} style={qa.dot} />)}
      </View>
      <Animated.View style={[qa.orb, qa.orb1, { transform: [{ translateX: orb1X }, { translateY: orb1Y }] }]}>
        <LinearGradient colors={['rgba(139,26,26,0.18)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[qa.orb, qa.orb2, { transform: [{ translateX: orb2X }, { translateY: orb2Y }] }]}>
        <LinearGradient colors={['rgba(212,160,23,0.14)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[qa.orb, qa.orb3, { transform: [{ translateX: orb3X }, { translateY: orb3Y }] }]}>
        <LinearGradient colors={['rgba(236,72,153,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[qa.ripple, { transform: [{ scale: waveScale }], opacity: waveOpacity }]} />
      <Animated.View style={[qa.shimmerLine, { transform: [{ translateX: shimmerX }], opacity: shimmerOpacity }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED CARDS
// ─────────────────────────────────────────────────────────────────────────────
function ActionCard({ item, index, onPress }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScl = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true })
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000 + index * 300, delay: index * 200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000 + index * 300, useNativeDriver: true })
    ])).start();
  }, []);

  const onIn = () => Animated.spring(pressScl, { toValue: 0.91, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressScl, { toValue: 1, useNativeDriver: true }).start();
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });

  return (
    <Animated.View style={{ opacity, transform: [{ perspective: 900 }, { scale }], width: QA_CARD_WIDTH }}>
      <Animated.View style={{ transform: [{ scale: pressScl }] }}>
        <TouchableOpacity style={s.qCard} onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
          <View style={[s.qAccentBar, { backgroundColor: item.color }]} />
          <Animated.View style={[StyleSheet.absoluteFill, s.qCardGlow, { backgroundColor: item.color, opacity: glowOpacity }]} />
          <View style={s.qCardTopLight} />
          <View style={s.qCardBottomShade} />
          <View style={[s.qIconBox, { backgroundColor: item.bg }]}>
            <Icon name={item.icon} size={28} color={item.color} />
          </View>
          <Text style={s.qLabel}>{item.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function EmerCard({ e, index, onPress }) {
  const grads = EMER_GRADS[e.type] || [T.maroon, '#A52020'];
  const barColor = EMER_BAR[e.type] || '#fff';
  const anim = useRef(new Animated.Value(0)).current;
  const pressScl = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 6, delay: index * 100, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ring, { toValue: 1.3, duration: 900, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 900, useNativeDriver: true })
    ])).start();
  }, []);

  const onIn = () => Animated.spring(pressScl, { toValue: 0.94, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressScl, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ perspective: 900 }, { scale: Animated.multiply(anim, pressScl) }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
    }}>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1} style={s.emerCardWrap}>
        <LinearGradient colors={grads} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.emerCard}>
          <View style={[s.emerTopBar, { backgroundColor: barColor }]} />
          <View style={s.emerGlowOverlay} />
          <View style={s.emerIconWrap}>
            <Animated.View style={[s.emerRingOuter, { borderColor: barColor + '40', transform: [{ scale: ring }] }]} />
            <View style={s.emerIconCircle}>
              <Icon name={EMER_ICON[e.type] || 'phone-outline'} size={25} color="#fff" />
            </View>
          </View>
          <Text style={s.emerName} numberOfLines={2}>{e.name}</Text>
          <Text style={[s.emerNum, { color: barColor }]}>{e.number}</Text>
          <View style={s.emerCallBtn}>
            <Text style={s.emerCallTxt}>{literalT("Tap to Call")}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({ value, label, color, icon, delay, bg }) {
  const anim = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: value, duration: 1200, delay: delay + 200, useNativeDriver: false }).start();
    const id = count.addListener(({ value: v }) => setDisplayVal(Math.round(v)));
    return () => count.removeListener(id);
  }, [value, delay]);

  return (
    <Animated.View style={[s.newStatCard, { backgroundColor: bg || '#fff', opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={s.newStatTop}>
        <View style={[s.newStatIconWrap, { backgroundColor: '#fff' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        <Text style={[s.newStatValue, { color }]}>{displayVal}</Text>
      </View>
      <Text style={s.newStatLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function WorkerDashboard({ navigation }) {
  const { userInfo } = useAuth();
  const { weather, alerts, loading: weatherLoading } = useWeatherAlerts({ pollMs: 10 * 60 * 1000 });
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [complaints, setComplaints] = useState([]);
  const [emergency, setEmergency] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const load = async () => {
    try {
      const [complaintRes, emergencyRes] = await Promise.all([
        complaintAPI.getAll().catch(() => ({ data: [] })),
        emergencyAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setComplaints(asArray(complaintRes.data));
      setEmergency(asArray(emergencyRes.data).slice(0, 6));
    } catch {/* silent */} finally {setLoading(false);}
  };

  useEffect(() => {
    load();
    Animated.timing(heroAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true })
    ])).start();
  }, []);

  const onRefresh = async () => {setRefreshing(true);await load();setRefreshing(false);};

  const newCnt = complaints.filter((c) => c.status === 'NEW').length;
  const acceptedCnt = complaints.filter((c) => c.status === 'ACCEPTED').length;
  const progressCnt = complaints.filter((c) => c.status === 'IN PROGRESS').length;
  const doneCnt = complaints.filter((c) => c.status === 'COMPLETED').length;
  const openCnt = complaints.length - doneCnt;
  const rate = complaints.length > 0 ? Math.round(doneCnt / complaints.length * 100) : 0;
  const nextComplaint = complaints.find((c) => c.status === 'NEW') || complaints.find((c) => c.status === 'ACCEPTED') || complaints.find((c) => c.status === 'IN PROGRESS');
  const categoryStats = Object.entries(
    complaints.reduce((acc, c) => {
      const key = c.category || 'Others';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.75], extrapolate: 'clamp' });
  const headerTransY = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -30], extrapolate: 'clamp' });
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}>
        
        {/* ════ HERO HEADER ════ */}
        <LinearGradient colors={['#4a0a0a', '#8B1A1A', '#A52020', '#6B1212']} locations={[0, 0.35, 0.7, 1]} style={s.hero}>
          <View style={s.heroGrid} />
          <View style={s.heroOrb1} />
          <View style={s.heroOrb2} />
          <View style={s.heroRingsWrap}>
            {[0, 1, 2].map((i) => <View key={i} style={[s.heroRing, { opacity: 0.15 - i * 0.04 }]} />)}
          </View>

          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTransY }] }}>
            <View style={s.heroTop}>
              <View style={s.appPill}>
                <Image source={APP_LOGO} style={s.appLogo} />
                <View style={[s.onlineBlip, { backgroundColor: isOnline ? '#4ade80' : '#9ca3af' }]} />
                <Text style={s.appPillTxt}>{literalT("Worker Dashboard")}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => setIsOnline(!isOnline)} style={[s.dutyToggle, !isOnline && s.dutyToggleOff]}>
                  <View style={[s.dutyDot, { backgroundColor: isOnline ? '#4ade80' : '#f87171' }]} />
                  <Text style={s.dutyToggleTxt}>{isOnline ? 'Online' : 'Offline'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatarBtn}>
                  <Icon name="account-hard-hat" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
              <Text style={s.greetLabel}>{greetEmoji} {greeting},</Text>
              <Text style={s.greetName} numberOfLines={1}>{userInfo?.name || 'Worker'}</Text>
              <View style={s.locationRow}>
                <Text style={s.locationChip}>📍 {userInfo?.district || 'No District'}</Text>
                <Text style={s.locationChip}>{literalT("Thokuthi")} {userInfo?.thokuthi || userInfo?.ward || '—'}</Text>
              </View>
            </Animated.View>

            {/* NEW GRID STATS CARD */}
            <Animated.View style={[s.newStatsWrapper, { transform: [{ translateY: floatY }] }]}>
              {/* RESOLUTION RATE */}
              <View style={s.newProgressCard}>
                <View style={s.newProgressTextRow}>
                  <Text style={s.newProgressTitle}>{literalT("Overall Resolution")}</Text>
                  <Text style={s.newProgressValue}>{rate}%</Text>
                </View>
                <View style={s.newProgressBarWrap}>
                  <LinearGradient colors={['#fbbf24', '#22c55e']} start={{x:0, y:0}} end={{x:1, y:0}} style={[s.newProgressBarFill, { width: `${rate}%` }]} />
                </View>
              </View>

              <View style={s.newStatsGrid}>
                <StatCard value={newCnt} label={literalT("New")} color="#ef4444" icon="alert-circle-outline" delay={200} bg="#fef2f2" />
                <StatCard value={acceptedCnt} label={literalT("Accepted")} color="#eab308" icon="check-circle-outline" delay={300} bg="#fefce8" />
                <StatCard value={progressCnt} label={literalT("Progress")} color="#3b82f6" icon="progress-clock" delay={400} bg="#eff6ff" />
                <StatCard value={doneCnt} label={literalT("Done")} color="#22c55e" icon="check-decagram-outline" delay={500} bg="#f0fdf4" />
              </View>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        {(!userInfo?.district || !userInfo?.ward || !userInfo?.thokuthi) &&
        <TouchableOpacity
          style={s.warningAlert}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.warningTitle}>{literalT("Complete your profile")}</Text>
              <Text style={s.warningDesc}>{literalT("Tap here to update your Ward, Thokuthi, and District to receive proper assignments.")}</Text>
            </View>
            <Text style={{ fontSize: 20, color: '#9a3412' }}>›</Text>
        </TouchableOpacity>
        }



        {/* ════ QUICK ACTIONS ════ */}
        <View style={[s.section, s.qaSection]}>
          <QuickActionBg />
          <View style={s.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color={T.maroon} />
              <Text style={s.sectionTitle}>{literalT("Quick Actions")}</Text>
            </View>
            <View style={s.sectionLine} />
          </View>
          <View style={s.qGrid}>
            {[
              { icon: 'clipboard-list-outline', label: 'All Tasks', color: '#ec4899', route: 'Complaints', bg: '#fce7f3' },
              { icon: 'weather-partly-cloudy', label: 'Weather', color: '#0f766e', route: 'Weather', bg: '#ccfbf1' },
              { icon: 'phone-alert-outline', label: 'Emergency', color: '#ef4444', route: 'Emergency', bg: '#fee2e2' },
              { icon: 'bell-ring-outline', label: 'Alerts', color: '#f59e0b', route: 'Notifications', bg: '#fef3c7' },
              { icon: 'newspaper-variant-outline', label: 'News', color: '#3b82f6', route: 'News', bg: '#dbeafe' },
              { icon: 'account-hard-hat-outline', label: 'Profile', color: '#8b5cf6', route: 'Profile', bg: '#ede9fe' }
            ].map((action, i) => (
              <ActionCard key={action.label} item={action} index={i} onPress={() => navigation.navigate(action.route)} />
            ))}
          </View>
        </View>

        {/* ════ WEATHER & ALERTS ════ */}
        <View style={s.miniWidgetsRow}>
          <TouchableOpacity style={s.weatherWidget} onPress={() => navigation.navigate('Weather')} activeOpacity={0.82}>
            <Text style={{ fontSize: 28, marginRight: 8 }}>{weather?.condition ? '🌤️' : '🌤️'}</Text>
            <View style={{ marginLeft: 0 }}>
              <Text style={s.weatherTemp}>
                {weather?.temperatureC != null ? `${weather.temperatureC}°C` : '—'}
              </Text>
              <Text style={s.weatherDesc}>
                {weather?.condition || literalT('Fetching weather...')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={s.alertWidget}>
            <View style={s.alertIconWrap}>
              <Text style={{ fontSize: 16 }}>{alerts?.[0]?.severity === 'HIGH' ? '🚨' : '📣'}</Text>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.alertTitle}>{literalT('City Alert')}</Text>
              <Text style={s.alertDesc} numberOfLines={1}>
                {alerts?.[0]?.message || literalT('No active alerts now.')}
              </Text>
            </View>
          </View>
        </View>
        {/* ════ TODAY'S FOCUS ════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color="#ef4444" />
              <Text style={s.sectionTitle}>{literalT("Emergency Contacts")}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
              <Text style={s.seeAllBtn}>{literalT("See all")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={emergency}
          keyExtractor={(e) => e.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.emerListContent}
          renderItem={({ item: e, index: i }) => (
            <EmerCard e={e} index={i} onPress={() => Linking.openURL(`tel:${e.number}`)} />
          )}
          ListEmptyComponent={
            <View style={s.emptyEmer}>
              <Text style={s.emptyCardText}>{literalT("No contacts found")}</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={s.seeMoreBtn}
          onPress={() => navigation.navigate('Emergency')}
          activeOpacity={0.85}>
          <View style={s.seeMoreInner}>
            <Text style={s.seeMoreTxt}>{literalT("See All Emergency Contacts")}</Text>
            <Text style={s.seeMoreSub}>{emergency.length} {literalT("contacts available")}</Text>
          </View>
          <Icon name="arrow-right" size={20} color={T.maroon} />
        </TouchableOpacity>

        <View style={s.section}>
          <View style={s.focusCard}>
            <View style={s.focusHeader}>
              <Text style={s.focusTitle}>{openCnt} {literalT("Pending Tasks")}</Text>
              <View style={s.focusBadge}>
                <Text style={s.focusBadgeTxt}>{literalT("Priority")}</Text>
              </View>
            </View>

            {nextComplaint ?
            <TouchableOpacity
              style={s.nextTaskBox}
              onPress={() => navigation.navigate('ComplaintDetail', { id: nextComplaint._id || nextComplaint.id })}
              activeOpacity={0.8}>
                <LinearGradient colors={[T.maroon + '15', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[s.nextIconBox, { backgroundColor: '#fff' }]}>
                  <Icon name={CATEGORY_ICONS[nextComplaint.category] || CATEGORY_ICONS.Others} size={24} color={T.maroon} />
                </View>
                <View style={s.nextTaskInfo}>
                  <Text style={s.nextTaskTitle} numberOfLines={1}>{complaintCategoryT(nextComplaint.category, nextComplaint.customCategory)}</Text>
                  <Text style={s.nextTaskMeta} numberOfLines={1}>{nextComplaint.status} • {nextComplaint.thokuthi || 'Unknown'}</Text>
                </View>
                <View style={s.nextArrowWrap}>
                  <Text style={{ fontSize: 20, color: '#fff' }}>→</Text>
                </View>
            </TouchableOpacity> :
            <View style={s.emptyFocusBox}>
                <Icon name="check-circle" size={36} color="#22c55e" />
                <Text style={s.emptyFocusTitle}>{literalT("All caught up!")}</Text>
                <Text style={s.emptyFocusSub}>{literalT("No pending field work for now.")}</Text>
            </View>
            }
          </View>
        </View>

        {/* ════ WEEKLY PERFORMANCE ════ */}
        <View style={s.section}>
          <View style={s.performanceCard}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
            <View style={s.perfIconWrap}>
              <Icon name="trophy-award" size={36} color="#fbbf24" />
            </View>
            <View style={s.perfContent}>
              <Text style={s.perfTitle}>{literalT("Great Job")}, {userInfo?.name?.split(' ')[0] || 'Worker'}! 🏆</Text>
              <Text style={s.perfSub}>{literalT("You have resolved")} {doneCnt} {literalT("complaints this week.")}</Text>
            </View>
          </View>
        </View>

        {/* ════ WORK MIX ════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📊 {literalT("Work Mix")}</Text>
            <Text style={s.sectionSubTitle}>{complaints.length} {literalT("Total")}</Text>
          </View>
          
          {categoryStats.length === 0 ?
            <View style={s.emptyCard}>
              <Text style={s.emptyCardText}>{literalT("No category data yet")}</Text>
            </View> :
            <View style={s.mixGrid}>
              {categoryStats.map(([category, count], idx) => (
                <View key={idx} style={s.mixCard}>
                  <View style={s.mixCardTopLight} />
                  <View style={s.mixIcon}>
                    <Icon name={CATEGORY_ICONS[category] || CATEGORY_ICONS.Others} size={24} color={T.maroon} />
                  </View>
                  <View style={s.mixInfo}>
                    <Text style={s.mixCount}>{count}</Text>
                    <Text style={s.mixName} numberOfLines={2}>{complaintCategoryT(category)}</Text>
                  </View>
                </View>
              ))}
            </View>
          }
        </View>

        {/* ════ RECENT TASKS ════ */}
        <View style={[s.section, { marginBottom: 40 }]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📋 {literalT("Recent Tasks")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Complaints')}>
              <Text style={s.seeAllBtn}>{literalT("See all")}</Text>
            </TouchableOpacity>
          </View>

          {complaints.length === 0 ?
            <View style={s.emptyCard}>
              <Icon name="clipboard-text-off-outline" size={36} color="#9ca3af" />
              <Text style={s.emptyCardText}>{literalT("No tasks assigned yet")}</Text>
            </View> :
            complaints.slice(0, 5).map((c, idx) => {
              const sc = STATUS_COLORS[c.status] || { bg: '#f3f4f6', color: '#6b7280' };
              const catIcon = CATEGORY_ICONS[c.category] || CATEGORY_ICONS.Others;
              return (
                <TouchableOpacity
                  key={String(c.id || c._id)}
                  style={s.taskCard}
                  onPress={() => navigation.navigate('ComplaintDetail', { id: c._id || c.id })}
                  activeOpacity={0.7}>
                  <View style={s.taskCardTopLight} />
                  <View style={[s.taskIcon, { backgroundColor: T.maroon + '15' }]}>
                    <Icon name={catIcon} size={24} color={T.maroon} />
                  </View>
                  <View style={s.taskContent}>
                    <Text style={s.taskCat} numberOfLines={1}>{complaintCategoryT(c.category, c.customCategory)}</Text>
                    <Text style={s.taskLoc} numberOfLines={1}>{c.thokuthi || 'Unknown'} - {c.district || 'Unknown'}</Text>
                  </View>
                  <View style={[s.taskStatus, { backgroundColor: sc.bg || '#f3f4f6' }]}>
                    <Text style={[s.taskStatusTxt, { color: sc.color }]}>{c.status}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          }
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },

  // Hero
  hero: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 36, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 },
  heroOrb1: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,100,60,0.13)' },
  heroOrb2: { position: 'absolute', bottom: 10, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(212,160,23,0.10)' },
  heroRingsWrap: { position: 'absolute', top: 24, right: 24, width: 100, height: 100 },
  heroRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 50, borderWidth: 1, borderColor: '#fff' },

  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  appPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  appLogo: { width: 22, height: 22, borderRadius: 11 },
  onlineBlip: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  appPillTxt: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },

  greetLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  greetName: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 6 },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 22 },
  locationChip: { fontSize: 12, color: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },

  newStatsWrapper: { marginTop: 10, paddingBottom: 10 },
  newProgressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  newProgressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  newProgressTitle: { fontSize: 13, fontWeight: '700', color: '#475569' },
  newProgressValue: { fontSize: 18, fontWeight: '900', color: '#22c55e' },
  newProgressBarWrap: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  newProgressBarFill: { height: '100%', borderRadius: 4 },

  newStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  newStatCard: { width: '48%', borderRadius: 16, padding: 14, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  newStatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  newStatIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  newStatValue: { fontSize: 22, fontWeight: '900' },
  newStatLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  warningAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffedd5', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fdba74' },
  warningTitle: { fontSize: 14, fontWeight: '800', color: '#9a3412', marginBottom: 2 },
  warningDesc: { fontSize: 12, color: '#9a3412', lineHeight: 16 },

  dutyToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dutyToggleOff: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' },
  dutyDot: { width: 8, height: 8, borderRadius: 4 },
  dutyToggleTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  miniWidgetsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 12 },
  weatherWidget: { flex: 0.8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  weatherTemp: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  weatherDesc: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  
  alertWidget: { flex: 1.2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffaf0', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#fef08a', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  alertIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#9a3412' },
  alertDesc: { fontSize: 11, fontWeight: '500', color: '#b45309' },

  performanceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, overflow: 'hidden', elevation: 6, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  perfIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  perfContent: { flex: 1 },
  perfTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  perfSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },

  // Sections
  qaSection: { paddingBottom: 20, overflow: 'hidden' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: T.text },
  sectionSubTitle: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  sectionLine: { flex: 1, height: 1, backgroundColor: T.border, marginLeft: 10 },
  seeAllBtn: { fontSize: 12, color: T.maroon, fontWeight: '700', backgroundColor: 'rgba(139,26,26,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },

  // QA Grid
  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' },
  qCard: { width: '100%', height: 112, backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 10, paddingTop: 18, paddingBottom: 12, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 9, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, overflow: 'hidden' },
  qAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 18 },
  qCardGlow: { borderRadius: 18 },
  qCardTopLight: { position: 'absolute', top: 4, left: 8, right: 8, height: 22, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.55)' },
  qCardBottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, backgroundColor: 'rgba(0,0,0,0.025)' },
  qIconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  qLabel: { minHeight: 26, fontSize: 11, lineHeight: 14, fontWeight: '800', color: T.text, textAlign: 'center', textAlignVertical: 'center' },

  // Emergency horizontal scroll
  emerListContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 12 },
  emerCardWrap: { width: EMER_CARD_WIDTH, borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  emerCard: { width: '100%', minHeight: 200, paddingTop: 24, paddingBottom: 20, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
  emerTopBar: { position: 'absolute', top: 8, alignSelf: 'center', width: '40%', height: 4, borderRadius: 20, opacity: 0.8 },
  emerGlowOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20 },
  emerIconWrap: { position: 'relative', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 4 },
  emerRingOuter: { position: 'absolute', inset: -8, borderRadius: 36, borderWidth: 1.5 },
  emerIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  emerName: { minHeight: 34, fontSize: 11, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 16, marginBottom: 4 },
  emerNum: { minHeight: 28, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  emerCallBtn: { minHeight: 32, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  emerCallTxt: { fontSize: 10, fontWeight: '800', color: '#fff', textAlign: 'center' },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(139,26,26,0.06)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(139,26,26,0.18)' },
  seeMoreInner: { flex: 1 },
  seeMoreTxt: { fontSize: 13, fontWeight: '800', color: T.maroon },
  seeMoreSub: { fontSize: 11, color: T.textM, marginTop: 2 },
  emptyEmer: { paddingHorizontal: 16, paddingVertical: 24 },

  // Focus
  focusCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  focusTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  focusBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  focusBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#ef4444' },
  
  nextTaskBox: { position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  nextIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  nextTaskInfo: { flex: 1 },
  nextTaskTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  nextTaskMeta: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  nextArrowWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.maroon, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.3, shadowRadius: 8 },

  emptyFocusBox: { alignItems: 'center', paddingVertical: 20 },
  emptyFocusTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginTop: 12 },
  emptyFocusSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

  // Work Mix
  mixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mixCard: { position: 'relative', width: (width - 44) / 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden' },
  mixCardTopLight: { position: 'absolute', top: 2, left: 4, right: 4, height: 18, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)' },
  mixIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mixInfo: { flex: 1 },
  mixCount: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  mixName: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 2 },

  // Task Cards
  taskCard: { position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 18, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  taskCardTopLight: { position: 'absolute', top: 2, left: 6, right: 6, height: 20, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)' },
  taskIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  taskContent: { flex: 1 },
  taskCat: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  taskLoc: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  taskStatus: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  taskStatusTxt: { fontSize: 11, fontWeight: '800' },

  emptyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowOpacity: 0.05 },
  emptyCardText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 8 }
});

// Quick Action BG styles (separate to avoid confusion)
const qa = StyleSheet.create({
  dotGrid: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 18, opacity: 0.35 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.maroon },
  orb: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  orb1: { width: 160, height: 160, top: -20, right: -20 },
  orb2: { width: 120, height: 120, bottom: -10, left: 10 },
  orb3: { width: 100, height: 100, top: 30, left: width * 0.4 },
  ripple: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: T.maroon, top: '50%', left: '50%', marginLeft: -100, marginTop: -100 },
  shimmerLine: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: '#fff', transform: [{ skewX: '-20deg' }] }
});
