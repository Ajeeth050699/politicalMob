import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Linking, Platform, StatusBar, Animated,
  Dimensions, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { newsAPI, emergencyAPI, complaintAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useLang } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const EMER_ICONS  = { police:'🚔', ambulance:'🚑', fire:'🚒', women:'👩', child:'👶', district:'🏢' };
const EMER_COLORS = { police:'#3b82f6', ambulance:'#ef4444', fire:'#f59e0b', women:'#ec4899', child:'#8b5cf6', district:'#22c55e' };

const QUICK_ACTION_KEYS = [
  { icon:'📝', key:'reportIssue',  color:T.maroon,   route:'AddComplaint', bg:'#FEE2E2' },
  { icon:'📋', key:'myComplaints', color:'#3b82f6',  route:'Complaints',   bg:'#DBEAFE' },
  { icon:'📰', key:'localNews',    color:T.gold,     route:'News',         bg:'#FEF3C7' },
  { icon:'📚', key:'education',    color:'#8b5cf6',  route:'Education',    bg:'#EDE9FE' },
  { icon:'🏕️', key:'welfareCamps', color:'#16a34a',  route:'Camps',        bg:'#DCFCE7' },
  { icon:'🚨', key:'emergency',    color:'#ef4444',  route:'Emergency',    bg:'#FEE2E2' },
];

// ── Animated quick action card ──────────────────────────────────────
function ActionCard({ item, index, onPress }) {
  const scale  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue:1, tension:80, friction:6, delay:index * 80, useNativeDriver:true }),
      Animated.timing(opacity, { toValue:1, duration:300, delay:index * 80, useNativeDriver:true }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(pressScale, { toValue:0.92, useNativeDriver:true }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue:1,    useNativeDriver:true }).start();

  return (
    <Animated.View style={{ opacity, transform:[{ scale: Animated.multiply(scale, pressScale) }], width:'30%' }}>
      <TouchableOpacity
        style={[s.qCard, { borderTopColor: item.color, borderTopWidth: 3 }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[s.qIconBox, { backgroundColor: item.bg }]}>
          <Text style={{ fontSize:24 }}>{item.icon}</Text>
        </View>
        <Text style={s.qLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Animated stat card ──────────────────────────────────────────────
function StatCard({ value, label, color, delay }) {
  const anim  = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:600, delay, useNativeDriver:true }).start();
    Animated.timing(count, { toValue: value, duration:1200, delay: delay + 200, useNativeDriver:false }).start();
    count.addListener(({ value:v }) => setDisplayVal(Math.round(v)));
    return () => count.removeAllListeners();
  }, [value]);

  return (
    <Animated.View style={[s.statCard, { opacity:anim, transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }] }]}>
      <Text style={[s.statNum, { color }]}>{displayVal}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ── Pulse dot for emergency ─────────────────────────────────────────
function PulseDot({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue:1.4, duration:800, useNativeDriver:true }),
        Animated.timing(pulse, { toValue:1,   duration:800, useNativeDriver:true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ width:8, height:8, borderRadius:4, backgroundColor:color, transform:[{ scale:pulse }] }} />
  );
}

// ── Emergency card with animation ──────────────────────────────────
function EmerCard({ e, index, onPress }) {
  const color = EMER_COLORS[e.type] || T.maroon;
  const anim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue:1, tension:80, friction:6, delay:index*100, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={{ width:'47%', opacity:anim, transform:[{ scale:anim }] }}>
      <TouchableOpacity
        style={[s.emerCard, { borderColor: color + '40' }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[color + '15', color + '05']} style={s.emerCardGrad}>
          <View style={[s.emerIcon, { backgroundColor: color + '20' }]}>
            <Text style={{ fontSize:22 }}>{EMER_ICONS[e.type] || '📞'}</Text>
          </View>
          <Text style={s.emerName} numberOfLines={1}>{e.name}</Text>
          <Text style={[s.emerNum, { color }]}>{e.number}</Text>
          <View style={[s.emerCallTag, { backgroundColor: color }]}>
            <Text style={s.emerCallTxt}>📞 Call</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── News card with animation ────────────────────────────────────────
function NewsCard({ n, index }) {
  const levelColor = n.level==='State' ? T.maroon : n.level==='District' ? T.gold : T.green;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slideAnim, { toValue:1, duration:400, delay:index*100, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity:slideAnim, transform:[{ translateX: slideAnim.interpolate({ inputRange:[0,1], outputRange:[40,0] }) }] }}>
      <View style={s.newsCard}>
        <View style={[s.newsLevel, { backgroundColor: levelColor + '18' }]}>
          <Text style={{ fontSize:18 }}>{n.level==='State'?'🏛️':n.level==='District'?'🏙️':'📍'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={s.newsTitle} numberOfLines={2}>{n.title}</Text>
          <Text style={s.newsDesc}  numberOfLines={1}>{n.description}</Text>
          <View style={s.newsMeta}>
            <View style={[s.newsBadge, { backgroundColor: levelColor + '18' }]}>
              <Text style={[s.newsBadgeTxt, { color:levelColor }]}>{n.level}</Text>
            </View>
            <Text style={s.newsDate}>{n.date}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { userInfo } = useAuth();
  const { lang, changeLang, t } = useLang();
  const [langDropdown, setLangDropdown] = useState(false);
  const [news,       setNews]       = useState([]);
  const [emergency,  setEmergency]  = useState([]);
  const [stats,      setStats]      = useState({ total:0, pending:0, done:0 });
  const [refreshing, setRefreshing] = useState(false);

  // Hero animation values
  const heroAnim    = useRef(new Animated.Value(0)).current;
  const scrollY     = useRef(new Animated.Value(0)).current;
  const floatAnim   = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [newsRes, emerRes, cmpRes] = await Promise.all([
        newsAPI.getAll(),
        emergencyAPI.getAll(),
        complaintAPI.getAll(),
      ]);
      setNews(newsRes.data.slice(0, 3));
      setEmergency(emerRes.data.slice(0, 4));
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
    // Hero entrance animation
    Animated.timing(heroAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue:1, duration:2000, useNativeDriver:true }),
        Animated.timing(floatAnim, { toValue:0, duration:2000, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const hour     = new Date().getHours();
  const greeting   = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  // Parallax header
  const headerHeight = scrollY.interpolate({ inputRange:[0,120], outputRange:[0,-40], extrapolate:'clamp' });
  const headerOpacity = scrollY.interpolate({ inputRange:[0,80], outputRange:[1,0.7], extrapolate:'clamp' });

  // Float offset
  const floatY = floatAnim.interpolate({ inputRange:[0,1], outputRange:[0,-6] });

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver:false })}
        scrollEventThrottle={16}
      >
        {/* ══════ HERO HEADER ══════ */}
        <LinearGradient colors={[T.maroonD, T.maroon, '#A03030']} style={s.hero}>

          {/* Decorative circles */}
          <View style={s.deco1} />
          <View style={s.deco2} />
          <View style={s.decoGrid}>
            {Array.from({ length:12 }).map((_,i) => (
              <View key={i} style={s.decoDot} />
            ))}
          </View>

          <Animated.View style={{ opacity:headerOpacity, transform:[{ translateY:headerHeight }] }}>
            {/* Top bar */}
            <View style={s.heroTop}>
              <View style={s.appBadge}>
                <Text style={{ fontSize:16 }}>🏛️</Text>
                <Text style={s.appBadgeTxt}>{t('appName')}</Text>
              </View>

              {/* Language dropdown */}
              <View style={{ position:'relative' }}>
                <TouchableOpacity
                  style={s.langBtn}
                  onPress={() => setLangDropdown(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={s.langBtnTxt}>{lang === 'ta' ? 'த' : 'EN'}</Text>
                  <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:10 }}>▼</Text>
                </TouchableOpacity>
                {langDropdown && (
                  <View style={s.langDropdown}>
                    {[{code:'en',label:'English'},{code:'ta',label:'தமிழ்'}].map(l => (
                      <TouchableOpacity
                        key={l.code}
                        style={[s.langOption, lang===l.code && s.langOptionActive]}
                        onPress={() => { changeLang(l.code); setLangDropdown(false); }}
                      >
                        <Text style={[s.langOptionTxt, lang===l.code && { color:'#fff', fontWeight:'800' }]}>{l.label}</Text>
                        {lang===l.code && <Text style={{ fontSize:12 }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatarBtn}>
                <Text style={{ fontSize:20 }}>👤</Text>
                <View style={s.onlineDot} />
              </TouchableOpacity>
            </View>

            {/* Greeting */}
            <Animated.View style={{
              opacity: heroAnim,
              transform:[{ translateY: heroAnim.interpolate({ inputRange:[0,1], outputRange:[30,0] }) }],
            }}>
              <Text style={s.greetSmall}>{greetEmoji} {greeting},</Text>
              <Text style={s.greetName}>{userInfo?.name?.split(' ')[0] || 'Citizen'}</Text>
              <Text style={s.greetSub}>📍 {userInfo?.district || 'Tamil Nadu'} · Booth {userInfo?.booth || '—'}</Text>
            </Animated.View>

            {/* Floating stats card */}
            <Animated.View style={[s.statsCard, { transform:[{ translateY:floatY }] }]}>
              <LinearGradient colors={['rgba(255,255,255,0.18)','rgba(255,255,255,0.08)']} style={s.statsCardInner}>
                <StatCard value={stats.total}   label={t('total')}   color={T.goldL}    delay={200} />
                <View style={s.statsDivider} />
                <StatCard value={stats.pending} label={t('pending')} color="#fca5a5" delay={350} />
                <View style={s.statsDivider} />
                <StatCard value={stats.done}    label={t('resolved')} color="#86efac" delay={500} />
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        {/* ══════ QUICK ACTIONS ══════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t('quickActions')}</Text>
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

        {/* ══════ REPORT ISSUE BANNER ══════ */}
        <TouchableOpacity
          style={s.reportBanner}
          onPress={() => navigation.navigate('AddComplaint')}
          activeOpacity={0.92}
        >
          <LinearGradient colors={[T.maroon, '#C0392B']} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={s.reportBannerInner}>
            <View>
              <Text style={s.reportTitle}>🚨 {t('reportIssue')}</Text>
              <Text style={s.reportSub}>{lang==='ta'?'புகைப்படம் & வீடியோ சான்றாக':'Photo & video proof supported'}</Text>
            </View>
            <View style={s.reportArrow}>
              <Text style={{ fontSize:22, color:'#fff' }}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ══════ EMERGENCY ══════ */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <PulseDot color={T.red} />
              <Text style={s.sectionTitle}>{t('emergency')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
              <Text style={s.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.emerGrid}>
            {emergency.slice(0, 4).map((e, i) => (
              <EmerCard
                key={e.name}
                e={e}
                index={i}
                onPress={() => Linking.openURL(`tel:${e.number}`)}
              />
            ))}
          </View>

          {/* See more button */}
          <TouchableOpacity
            style={s.seeMoreBtn}
            onPress={() => navigation.navigate('Emergency')}
            activeOpacity={0.85}
          >
            <View style={s.seeMoreInner}>
              <Text style={s.seeMoreTxt}>🚨 {lang==='ta'?'அனைத்து அவசர தொடர்புகள்':'See All Emergency Contacts'}</Text>
              <Text style={s.seeMoreSub}>{emergency.length} contacts available</Text>
            </View>
            <Text style={{ fontSize:18, color:T.maroon }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ══════ LATEST NEWS ══════ */}
        <View style={[s.section, { marginBottom:32 }]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>📰 {t('latestNews')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('News')}>
              <Text style={s.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {news.length === 0 ? (
            <View style={s.emptyNews}>
              <Text style={{ fontSize:36 }}>📭</Text>
              <Text style={s.emptyTxt}>{lang==='ta'?'இன்னும் செய்தி இல்லை':'No news yet'}</Text>
            </View>
          ) : news.map((n, i) => (
            <NewsCard key={n.id} n={n} index={i} />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:T.bg },

  // ── Hero ──────────────────────────────────────────────────────────
  hero:       { paddingTop: Platform.OS==='ios'?52:40, paddingBottom:36, paddingHorizontal:20 },
  deco1:      { position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:'rgba(255,255,255,0.06)' },
  deco2:      { position:'absolute', bottom:20, left:-60, width:200, height:200, borderRadius:100, backgroundColor:'rgba(255,255,255,0.04)' },
  decoGrid:   { position:'absolute', top:50, right:16, flexDirection:'row', flexWrap:'wrap', width:80, gap:10, opacity:0.12 },
  decoDot:    { width:4, height:4, borderRadius:2, backgroundColor:'#fff' },

  heroTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  appBadge:   { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:14, paddingVertical:7, borderRadius:50 },
  appBadgeTxt:{ fontSize:13, fontWeight:'800', color:'#fff' },
  avatarBtn:  { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  onlineDot:  { position:'absolute', top:6, right:6, width:8, height:8, borderRadius:4, backgroundColor:T.green, borderWidth:1.5, borderColor:'#fff' },

  // Language dropdown
  langBtn:         { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(255,255,255,0.18)', paddingHorizontal:12, paddingVertical:7, borderRadius:50, borderWidth:1, borderColor:'rgba(255,255,255,0.3)' },
  langBtnTxt:      { fontSize:13, fontWeight:'800', color:'#fff' },
  langDropdown:    { position:'absolute', top:42, right:0, backgroundColor:'#fff', borderRadius:14, overflow:'hidden', elevation:20, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:16, shadowOffset:{width:0,height:4}, zIndex:999, minWidth:120, borderWidth:1, borderColor:T.border },
  langOption:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:13, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:T.border },
  langOptionActive:{ backgroundColor:T.maroon },
  langOptionTxt:   { fontSize:14, fontWeight:'600', color:T.text },

  greetSmall: { fontSize:14, color:'rgba(255,255,255,0.75)', fontWeight:'600' },
  greetName:  { fontSize:30, fontWeight:'900', color:'#fff', marginTop:2, marginBottom:4 },
  greetSub:   { fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:20 },

  // Stats floating card
  statsCard:      { borderRadius:20, overflow:'hidden' },
  statsCardInner: { flexDirection:'row', paddingVertical:16, paddingHorizontal:8, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.15)' },
  statCard:       { flex:1, alignItems:'center' },
  statNum:        { fontSize:26, fontWeight:'900' },
  statLabel:      { fontSize:10, color:'rgba(255,255,255,0.65)', marginTop:3, fontWeight:'600' },
  statsDivider:   { width:1, backgroundColor:'rgba(255,255,255,0.15)', marginHorizontal:4 },

  // ── Report Banner ─────────────────────────────────────────────────
  reportBanner:      { marginHorizontal:16, marginTop:20, borderRadius:18, overflow:'hidden', elevation:6, shadowColor:T.maroon, shadowOpacity:0.4, shadowRadius:12, shadowOffset:{width:0,height:4} },
  reportBannerInner: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:18, paddingHorizontal:20 },
  reportTitle:       { fontSize:17, fontWeight:'900', color:'#fff' },
  reportSub:         { fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:3 },
  reportArrow:       { width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },

  // ── Sections ─────────────────────────────────────────────────────
  section:       { paddingHorizontal:16, paddingTop:22 },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:  { fontSize:17, fontWeight:'800', color:T.text },
  sectionLine:   { flex:1, height:1, backgroundColor:T.border, marginLeft:12 },
  seeAll:        { fontSize:13, color:T.maroon, fontWeight:'700' },

  // ── Quick actions ─────────────────────────────────────────────────
  qGrid:    { flexDirection:'row', flexWrap:'wrap', gap:12 },
  qCard:    { backgroundColor:'#fff', borderRadius:18, padding:14, alignItems:'center', borderWidth:1, borderColor:T.border, elevation:3, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:10 },
  qIconBox: { width:50, height:50, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:8 },
  qLabel:   { fontSize:11, fontWeight:'700', color:T.text, textAlign:'center' },

  // ── Emergency ─────────────────────────────────────────────────────
  emerGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10 },
  emerCard:    { width:'100%', borderRadius:18, overflow:'hidden', borderWidth:1.5, elevation:3, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:10 },
  emerCardGrad:{ padding:14, alignItems:'center' },
  emerIcon:    { width:52, height:52, borderRadius:26, alignItems:'center', justifyContent:'center', marginBottom:8 },
  emerName:    { fontSize:12, fontWeight:'700', color:T.text, textAlign:'center' },
  emerNum:     { fontSize:20, fontWeight:'900', marginTop:4 },
  emerCallTag: { marginTop:10, paddingHorizontal:14, paddingVertical:6, borderRadius:50 },
  emerCallTxt: { color:'#fff', fontSize:11, fontWeight:'800' },

  // ── News ──────────────────────────────────────────────────────────
  newsCard:    { backgroundColor:'#fff', borderRadius:18, padding:14, marginBottom:10, flexDirection:'row', gap:12, borderWidth:1, borderColor:T.border, elevation:3, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10 },
  newsLevel:   { width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  newsTitle:   { fontSize:14, fontWeight:'700', color:T.text, lineHeight:20 },
  newsDesc:    { fontSize:12, color:T.textL, marginTop:3 },
  newsMeta:    { flexDirection:'row', alignItems:'center', gap:8, marginTop:6 },
  newsBadge:   { paddingHorizontal:8, paddingVertical:3, borderRadius:50 },
  newsBadgeTxt:{ fontSize:10, fontWeight:'700' },
  newsDate:    { fontSize:11, color:T.textM },
  seeMoreBtn:   { flexDirection:'row', alignItems:'center', marginTop:12, backgroundColor:T.maroon+'08', borderRadius:14, padding:14, borderWidth:1, borderColor:T.maroon+'30' },
  seeMoreInner: { flex:1 },
  seeMoreTxt:   { fontSize:14, fontWeight:'700', color:T.maroon },
  seeMoreSub:   { fontSize:11, color:T.textM, marginTop:2 },
  emptyNews:    { alignItems:'center', paddingVertical:32 },
  emptyTxt:    { fontSize:14, color:T.textM, marginTop:8 },
});