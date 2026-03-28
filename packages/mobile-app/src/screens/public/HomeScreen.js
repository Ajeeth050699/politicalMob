import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Linking, Platform, StatusBar, Animated,
  Dimensions, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { newsAPI, emergencyAPI, complaintAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useLang } from '../../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const EMER_ICONS   = { police: '🚔', ambulance: '🚑', fire: '🚒', women: '👩', child: '👶', district: '🏢' };
const EMER_GRADS   = {
  police:    ['#1d4ed8', '#3b82f6'],
  ambulance: ['#b91c1c', '#ef4444'],
  fire:      ['#b45309', '#f59e0b'],
  women:     ['#9d174d', '#ec4899'],
  child:     ['#6d28d9', '#8b5cf6'],
  district:  ['#065f46', '#22c55e'],
};
const EMER_BAR     = { police: '#60a5fa', ambulance: '#fca5a5', fire: '#fcd34d', women: '#f9a8d4', child: '#c4b5fd', district: '#86efac' };

const QUICK_ACTION_KEYS = [
  { icon: '📝', key: 'reportIssue',  color: T.maroon,  route: 'AddComplaint', bg: '#FEE2E2' },
  { icon: '📋', key: 'myComplaints', color: '#3b82f6', route: 'Complaints',   bg: '#DBEAFE' },
  { icon: '📰', key: 'localNews',    color: T.gold,    route: 'News',         bg: '#FEF3C7' },
  { icon: '📚', key: 'education',    color: '#8b5cf6', route: 'Education',    bg: '#EDE9FE' },
  { icon: '🏕️', key: 'welfareCamps', color: '#16a34a', route: 'Camps',        bg: '#DCFCE7' },
  { icon: '🚨', key: 'emergency',    color: '#ef4444', route: 'Emergency',    bg: '#FEE2E2' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED LOOP BG — for Quick Actions section
// Floating orbs + grid shimmer looping forever
// ─────────────────────────────────────────────────────────────────────────────
function QuickActionBg() {
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3X = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const wave    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orb 1 — slow diagonal drift
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1X, { toValue: 18, duration: 3500, useNativeDriver: true }),
          Animated.timing(orb1Y, { toValue: -14, duration: 3500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orb1X, { toValue: -10, duration: 3500, useNativeDriver: true }),
          Animated.timing(orb1Y, { toValue: 10, duration: 3500, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Orb 2 — faster circle
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2X, { toValue: -20, duration: 2800, useNativeDriver: true }),
          Animated.timing(orb2Y, { toValue: 12, duration: 2800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orb2X, { toValue: 14, duration: 2800, useNativeDriver: true }),
          Animated.timing(orb2Y, { toValue: -10, duration: 2800, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Orb 3 — subtle pulse + drift
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb3X, { toValue: 12, duration: 4000, useNativeDriver: true }),
          Animated.timing(orb3Y, { toValue: 8, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orb3X, { toValue: -8, duration: 4000, useNativeDriver: true }),
          Animated.timing(orb3Y, { toValue: -12, duration: 4000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Shimmer sweep across the section
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    ).start();

    // Wave / ripple scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.04, 0.10, 0.04] });
  const shimmerX       = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width * 0.6] });
  const waveScale      = wave.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const waveOpacity    = wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.18, 0.08] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base gradient background */}
      <LinearGradient
        colors={['#FFF5F0', '#FEF0E8', '#FDE8E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dot grid */}
      <View style={qa.dotGrid} pointerEvents="none">
        {Array.from({ length: 48 }).map((_, i) => (
          <View key={i} style={qa.dot} />
        ))}
      </View>

      {/* Orb 1 — warm maroon */}
      <Animated.View style={[qa.orb, qa.orb1, { transform: [{ translateX: orb1X }, { translateY: orb1Y }] }]}>
        <LinearGradient colors={['rgba(139,26,26,0.18)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Orb 2 — gold */}
      <Animated.View style={[qa.orb, qa.orb2, { transform: [{ translateX: orb2X }, { translateY: orb2Y }] }]}>
        <LinearGradient colors={['rgba(212,160,23,0.14)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Orb 3 — soft pink accent */}
      <Animated.View style={[qa.orb, qa.orb3, { transform: [{ translateX: orb3X }, { translateY: orb3Y }] }]}>
        <LinearGradient colors={['rgba(236,72,153,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Ripple ring */}
      <Animated.View style={[qa.ripple, { transform: [{ scale: waveScale }], opacity: waveOpacity }]} />

      {/* Shimmer sweep line */}
      <Animated.View style={[qa.shimmerLine, { transform: [{ translateX: shimmerX }], opacity: shimmerOpacity }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION CARD
// ─────────────────────────────────────────────────────────────────────────────
function ActionCard({ item, index, onPress }) {
  const scale    = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(0)).current;
  const pressScl = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 80, friction: 6, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start();

    // Subtle glow loop on each card (offset per index)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000 + index * 300, delay: index * 200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000 + index * 300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onIn  = () => Animated.spring(pressScl, { toValue: 0.91, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressScl, { toValue: 1,    useNativeDriver: true }).start();

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] });

  return (
    <Animated.View style={{ opacity, transform: [{ scale: Animated.multiply(scale, pressScl) }], width: '30%' }}>
      <TouchableOpacity
        style={[s.qCard]}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        {/* Top accent bar */}
        <View style={[s.qAccentBar, { backgroundColor: item.color }]} />

        {/* Animated card glow */}
        <Animated.View style={[StyleSheet.absoluteFill, s.qCardGlow, { backgroundColor: item.color, opacity: glowOpacity }]} />

        <View style={[s.qIconBox, { backgroundColor: item.bg }]}>
          <Text style={{ fontSize: 24 }}>{item.icon}</Text>
        </View>
        <Text style={s.qLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ value, label, color, delay }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    Animated.timing(anim,  { toValue: 1, duration: 600, delay, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: value, duration: 1200, delay: delay + 200, useNativeDriver: false }).start();
    const id = count.addListener(({ value: v }) => setDisplayVal(Math.round(v)));
    return () => count.removeListener(id);
  }, [value]);

  return (
    <Animated.View style={[s.statCard, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <Text style={[s.statNum, { color }]}>{displayVal}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PULSE DOT
// ─────────────────────────────────────────────────────────────────────────────
function PulseDot({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, transform: [{ scale: pulse }] }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY CARD — horizontal scroll cinematic card
// ─────────────────────────────────────────────────────────────────────────────
function EmerCard({ e, index, onPress }) {
  const grads   = EMER_GRADS[e.type] || [T.maroon, T.maroon2];
  const barColor = EMER_BAR[e.type] || '#fff';
  const anim    = useRef(new Animated.Value(0)).current;
  const pressScl = useRef(new Animated.Value(1)).current;
  const ring    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 6, delay: index * 100, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onIn  = () => Animated.spring(pressScl, { toValue: 0.94, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressScl, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ scale: Animated.multiply(anim, pressScl) }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
    }}>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1} style={s.emerCardWrap}>
        <LinearGradient colors={grads} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.emerCard}>
          {/* Top shimmer bar */}
          <View style={[s.emerTopBar, { backgroundColor: barColor }]} />

          {/* Radial glow overlay */}
          <View style={s.emerGlowOverlay} />

          {/* Ring icon */}
          <View style={s.emerIconWrap}>
            <Animated.View style={[s.emerRingOuter, { borderColor: barColor + '40', transform: [{ scale: ring }] }]} />
            <View style={[s.emerIconCircle, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={{ fontSize: 22 }}>{EMER_ICONS[e.type] || '📞'}</Text>
            </View>
          </View>

          <Text style={s.emerName} numberOfLines={2}>{e.name}</Text>
          <Text style={[s.emerNum, { color: barColor }]}>{e.number}</Text>

          <View style={[s.emerCallBtn, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={s.emerCallTxt}>📞 Tap to Call</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWS CARD
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_META = {
  State:    { icon: '🏛️', color: '#8B1A1A', bg: '#FEE2E2' },
  District: { icon: '🏙️', color: '#D4A017', bg: '#FEF3C7' },
  Booth:    { icon: '📍', color: '#16a34a', bg: '#DCFCE7' },
};

function NewsCard({ n, index, onPress }) {
  const meta     = LEVEL_META[n.level] || LEVEL_META.State;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pressScl  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, []);

  const onIn  = () => Animated.spring(pressScl, { toValue: 0.97, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(pressScl, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{
      opacity: slideAnim,
      transform: [
        { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
        { scale: pressScl },
      ],
    }}>
      <TouchableOpacity style={s.newsCard} onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <View style={[s.newsIconBox, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.newsTitle} numberOfLines={2}>{n.title}</Text>
          <Text style={s.newsDesc}  numberOfLines={1}>{n.description}</Text>
          <View style={s.newsMeta}>
            <View style={[s.newsBadge, { backgroundColor: meta.bg }]}>
              <Text style={[s.newsBadgeTxt, { color: meta.color }]}>{n.level}</Text>
            </View>
            <Text style={s.newsDate}>{n.date}</Text>
          </View>
        </View>
        <Text style={s.newsChevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { userInfo }    = useAuth();
  const { lang, changeLang, t } = useLang();
  const [langDropdown, setLangDropdown] = useState(false);
  const [news,          setNews]       = useState([]);
  const [emergency,     setEmergency]  = useState([]);
  const [stats,         setStats]      = useState({ total: 0, pending: 0, done: 0 });
  const [refreshing,    setRefreshing] = useState(false);

  const heroAnim  = useRef(new Animated.Value(0)).current;
  const scrollY   = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [newsRes, emerRes, cmpRes] = await Promise.all([
        newsAPI.getAll(),
        emergencyAPI.getAll(),
        complaintAPI.getAll(),
      ]);
      setNews(newsRes.data.slice(0, 3));
      setEmergency(emerRes.data.slice(0, 6));
      const cmps = cmpRes.data;
      setStats({
        total:   cmps.length,
        pending: cmps.filter(c => c.status === 'NEW' || c.status === 'IN PROGRESS').length,
        done:    cmps.filter(c => c.status === 'COMPLETED').length,
      });
    } catch (e) { console.log(e); }
  }, []);

  useEffect(() => {
    fetchData();
    Animated.timing(heroAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.75], extrapolate: 'clamp' });
  const headerTransY  = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -30], extrapolate: 'clamp' });
  const floatY        = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >

        {/* ════ HERO HEADER ════ */}
        <LinearGradient colors={['#4a0a0a', '#8B1A1A', '#A52020', '#6B1212']} locations={[0, 0.35, 0.7, 1]} style={s.hero}>

          {/* Decorative mesh */}
          <View style={s.heroGrid} />
          <View style={s.heroOrb1} />
          <View style={s.heroOrb2} />
          <View style={s.heroRingsWrap}>
            {[0, 1, 2].map(i => <View key={i} style={[s.heroRing, { opacity: 0.15 - i * 0.04 }]} />)}
          </View>

          <Animated.View style={{ opacity: headerOpacity, transform: [{ translateY: headerTransY }] }}>

            {/* Top bar */}
            <View style={s.heroTop}>
              <View style={s.appPill}>
                <View style={s.onlineBlip} />
                <Text style={s.appPillTxt}>{t('appName')}</Text>
              </View>

              {/* Lang dropdown */}
              <View style={{ position: 'relative' }}>
                <TouchableOpacity style={s.langBtn} onPress={() => setLangDropdown(v => !v)} activeOpacity={0.8}>
                  <Text style={s.langBtnTxt}>{lang === 'ta' ? 'த' : 'EN'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>▼</Text>
                </TouchableOpacity>
                {langDropdown && (
                  <View style={s.langDropdown}>
                    {[{ code: 'en', label: 'English' }, { code: 'ta', label: 'தமிழ்' }].map(l => (
                      <TouchableOpacity
                        key={l.code}
                        style={[s.langOption, lang === l.code && s.langOptionActive]}
                        onPress={() => { changeLang(l.code); setLangDropdown(false); }}
                      >
                        <Text style={[s.langOptionTxt, lang === l.code && { color: '#fff', fontWeight: '800' }]}>{l.label}</Text>
                        {lang === l.code && <Text style={{ fontSize: 12 }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatarBtn}>
                <Text style={{ fontSize: 20 }}>👤</Text>
                <View style={s.onlineDot} />
              </TouchableOpacity>
            </View>

            {/* Greeting */}
            <Animated.View style={{
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            }}>
              <Text style={s.greetLabel}>{greetEmoji} {greeting},</Text>
              <Text style={s.greetName}>{userInfo?.name?.split(' ')[0] || 'Citizen'}</Text>
              <Text style={s.greetSub}>📍 {userInfo?.district || 'Tamil Nadu'} · Booth {userInfo?.booth || '—'}</Text>
            </Animated.View>

            {/* Floating stats */}
            <Animated.View style={[s.statsCard, { transform: [{ translateY: floatY }] }]}>
              <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.07)']} style={s.statsCardInner}>
                <StatCard value={stats.total}   label={t('total')}    color={T.goldL}    delay={200} />
                <View style={s.statsDivider} />
                <StatCard value={stats.pending} label={t('pending')}  color="#fca5a5"    delay={350} />
                <View style={s.statsDivider} />
                <StatCard value={stats.done}    label={t('resolved')} color="#86efac"    delay={500} />
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        {/* ════ QUICK ACTIONS ════ */}
        <View style={[s.section, s.qaSection]}>
          {/* Animated loop background */}
          <QuickActionBg />

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>⚡ {t('quickActions')}</Text>
            <View style={s.sectionLine} />
          </View>
          <View style={s.qGrid}>
            {QUICK_ACTION_KEYS.map((item, index) => (
              <ActionCard
                key={item.route}
                item={{ ...item, label: t(item.key) }}
                index={index}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
        </View>

        {/* ════ REPORT BANNER ════ */}
        <TouchableOpacity
          style={s.reportBanner}
          onPress={() => navigation.navigate('AddComplaint')}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[T.maroon, '#C0392B', '#A52020']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.reportBannerInner}
          >
            <View style={s.reportBannerCircle1} />
            <View style={s.reportBannerCircle2} />
            <View>
              <Text style={s.reportTitle}>🚨 {t('reportIssue')}</Text>
              <Text style={s.reportSub}>{lang === 'ta' ? 'புகைப்படம் & வீடியோ சான்றாக' : 'Photo & video proof supported'}</Text>
            </View>
            <View style={s.reportArrow}>
              <Text style={{ fontSize: 22, color: '#fff' }}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ════ EMERGENCY — HORIZONTAL SCROLL ════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color="#ef4444" />
              <Text style={s.sectionTitle}>{t('emergency')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
              <Text style={s.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal flatlist — outside section padding so cards bleed edge to edge */}
        <FlatList
          data={emergency}
          keyExtractor={e => e.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.emerListContent}
          renderItem={({ item: e, index: i }) => (
            <EmerCard
              e={e}
              index={i}
              onPress={() => Linking.openURL(`tel:${e.number}`)}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyEmer}>
              <Text style={s.emptyTxt}>No contacts found</Text>
            </View>
          }
        />

        {/* See all button */}
        <TouchableOpacity
          style={s.seeMoreBtn}
          onPress={() => navigation.navigate('Emergency')}
          activeOpacity={0.85}
        >
          <View style={s.seeMoreInner}>
            <Text style={s.seeMoreTxt}>🚨 {lang === 'ta' ? 'அனைத்து அவசர தொடர்புகள்' : 'See All Emergency Contacts'}</Text>
            <Text style={s.seeMoreSub}>{emergency.length} contacts available</Text>
          </View>
          <Text style={{ fontSize: 18, color: T.maroon }}>→</Text>
        </TouchableOpacity>

        {/* ════ LATEST NEWS ════ */}
        <View style={[s.section, { marginBottom: 40 }]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📰 {t('latestNews')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('News')}>
              <Text style={s.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {news.length === 0 ? (
            <View style={s.emptyNews}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={s.emptyTxt}>{lang === 'ta' ? 'இன்னும் செய்தி இல்லை' : 'No news yet'}</Text>
            </View>
          ) : (
            news.map((n, i) => (
              <NewsCard
                key={n.id}
                n={n}
                index={i}
                onPress={() => navigation.navigate('NewsDetail', { news: n })}
              />
            ))
          )}
        </View>

      </Animated.ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // Hero
  hero:         { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 36, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroGrid:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05,
                  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)' },
  heroOrb1:     { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,100,60,0.13)' },
  heroOrb2:     { position: 'absolute', bottom: 10, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(212,160,23,0.10)' },
  heroRingsWrap:{ position: 'absolute', top: 24, right: 24, width: 100, height: 100 },
  heroRing:     { position: 'absolute', inset: 0, borderRadius: 50, borderWidth: 1, borderColor: '#fff' },

  heroTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  appPill:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  onlineBlip:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  appPillTxt:   { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  avatarBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  onlineDot:    { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },

  langBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  langBtnTxt:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  langDropdown:     { position: 'absolute', top: 46, right: 0, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, zIndex: 999, minWidth: 130, borderWidth: 1, borderColor: T.border },
  langOption:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  langOptionActive: { backgroundColor: T.maroon },
  langOptionTxt:    { fontSize: 14, fontWeight: '600', color: T.text },

  greetLabel:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  greetName:    { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 6 },
  greetSub:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 22 },

  statsCard:      { borderRadius: 20, overflow: 'hidden' },
  statsCardInner: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statCard:       { flex: 1, alignItems: 'center' },
  statNum:        { fontSize: 28, fontWeight: '900' },
  statLabel:      { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statsDivider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: 4 },

  // Quick Actions section with animated bg
  qaSection:      { paddingBottom: 20, overflow: 'hidden' },
  section:        { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:   { fontSize: 16, fontWeight: '800', color: T.text },
  sectionLine:    { flex: 1, height: 1, backgroundColor: T.border, marginLeft: 10 },
  seeAll:         { fontSize: 12, color: T.maroon, fontWeight: '700', backgroundColor: 'rgba(139,26,26,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },

  // QA card
  qGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qCard:      { backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border, elevation: 4, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, overflow: 'hidden' },
  qAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 18 },
  qCardGlow:  { borderRadius: 18 },
  qIconBox:   { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qLabel:     { fontSize: 10, fontWeight: '700', color: T.text, textAlign: 'center' },

  // QA animated bg
  // (styles moved to `qa` below)

  // Report Banner
  reportBanner:       { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  reportBannerInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  reportBannerCircle1:{ position: 'absolute', top: -30, right: 70, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.05)' },
  reportBannerCircle2:{ position: 'absolute', bottom: -20, right: 16, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },
  reportTitle:        { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 4 },
  reportSub:          { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  reportArrow:        { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  // Emergency horizontal scroll
  emerListContent:  { paddingHorizontal: 16, paddingVertical: 4, gap: 12 },
  emerCardWrap:     { width: 130, borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  emerCard:         { width: '100%', minHeight: 168, paddingTop: 4, paddingBottom: 14, paddingHorizontal: 12, alignItems: 'center', position: 'relative' },
  emerTopBar:       { width: '100%', height: 4, borderRadius: 20, marginBottom: 10, opacity: 0.8 },
  emerGlowOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20 },
  emerIconWrap:     { position: 'relative', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emerRingOuter:    { position: 'absolute', inset: -8, borderRadius: 36, borderWidth: 1.5 },
  emerIconCircle:   { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emerName:         { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 15, marginBottom: 4 },
  emerNum:          { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  emerCallBtn:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50, borderWidth: 1 },
  emerCallTxt:      { fontSize: 10, fontWeight: '800', color: '#fff' },

  seeMoreBtn:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(139,26,26,0.06)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(139,26,26,0.18)' },
  seeMoreInner: { flex: 1 },
  seeMoreTxt:   { fontSize: 13, fontWeight: '700', color: T.maroon },
  seeMoreSub:   { fontSize: 11, color: T.textM, marginTop: 2 },

  // News
  newsCard:     { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, alignItems: 'center' },
  newsIconBox:  { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  newsTitle:    { fontSize: 13, fontWeight: '700', color: T.text, lineHeight: 19 },
  newsDesc:     { fontSize: 11, color: T.textL, marginTop: 3 },
  newsMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  newsBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  newsBadgeTxt: { fontSize: 10, fontWeight: '700' },
  newsDate:     { fontSize: 10, color: T.textM },
  newsChevron:  { fontSize: 22, color: '#ccc', marginLeft: 4 },

  emptyNews: { alignItems: 'center', paddingVertical: 32 },
  emptyEmer: { paddingHorizontal: 16, paddingVertical: 24 },
  emptyTxt:  { fontSize: 14, color: T.textM, marginTop: 8 },
});

// Quick Action BG styles (separate to avoid confusion)
const qa = StyleSheet.create({
  dotGrid: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 18, opacity: 0.35 },
  dot:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.maroon },
  orb:     { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  orb1:    { width: 160, height: 160, top: -20, right: -20 },
  orb2:    { width: 120, height: 120, bottom: -10, left: 10 },
  orb3:    { width: 100, height: 100, top: 30, left: width * 0.4 },
  ripple:  { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: T.maroon, top: '50%', left: '50%', marginLeft: -100, marginTop: -100 },
  shimmerLine: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: '#fff', transform: [{ skewX: '-20deg' }] },
});