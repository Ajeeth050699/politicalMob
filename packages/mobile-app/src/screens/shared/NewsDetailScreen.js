import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Animated, Dimensions, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../../constants/theme';

const { width } = Dimensions.get('window');

const LEVEL_META = {
  State:    { icon: '🏛️', color: '#8B1A1A', bg: '#FEE2E2', grad: ['#4a0a0a', '#8B1A1A', '#A52020'], label: 'State News' },
  District: { icon: '🏙️', color: '#b45309', bg: '#FEF3C7', grad: ['#451a03', '#b45309', '#d97706'], label: 'District News' },
  Booth:    { icon: '📍', color: '#065f46', bg: '#DCFCE7', grad: ['#022c22', '#065f46', '#16a34a'], label: 'Booth News' },
};

// ─────────────────────────────────────────────────────────────────────────────
// TAG CHIP
// ─────────────────────────────────────────────────────────────────────────────
function Tag({ label, color, bg }) {
  return (
    <View style={[d.tag, { backgroundColor: bg }]}>
      <Text style={[d.tagTxt, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATED NEWS MINI CARD
// ─────────────────────────────────────────────────────────────────────────────
function RelatedCard({ n, onPress, index }) {
  const meta   = LEVEL_META[n.level] || LEVEL_META.State;
  const anim   = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay: index * 100, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <TouchableOpacity style={d.relCard} onPress={onPress} activeOpacity={0.85}>
        <View style={[d.relIcon, { backgroundColor: meta.bg }]}>
          <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={d.relTitle} numberOfLines={2}>{n.title}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            <View style={[d.relBadge, { backgroundColor: meta.bg }]}>
              <Text style={[d.relBadgeTxt, { color: meta.color }]}>{n.level}</Text>
            </View>
            <Text style={d.relDate}>{n.date}</Text>
          </View>
        </View>
        <Text style={d.relChev}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NEWS DETAIL SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function NewsDetailScreen({ route, navigation }) {
  // `news` object is passed from HomeScreen/NewsScreen via navigation params
  const { news, allNews = [] } = route.params || {};

  const meta       = LEVEL_META[news?.level] || LEVEL_META.State;
  const scrollY    = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 700, delay: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // Parallax hero
  const heroTranslate = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, -60], extrapolate: 'clamp' });
  const heroOpacity   = scrollY.interpolate({ inputRange: [0, 180], outputRange: [1, 0.5], extrapolate: 'clamp' });

  // Floating back button opacity based on scroll
  const backBg = scrollY.interpolate({ inputRange: [0, 140], outputRange: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.95)'], extrapolate: 'clamp' });
  const backColor = scrollY.interpolate({ inputRange: [0, 140], outputRange: ['#fff', '#1a1a1a'], extrapolate: 'clamp' });

  const handleShare = async () => {
    try {
      await Share.share({ message: `${news.title}\n\n${news.description}` });
    } catch (_) {}
  };

  const relatedNews = allNews.filter(n => n.id !== news?.id).slice(0, 3);

  if (!news) {
    return (
      <View style={d.root}>
        <Text style={{ padding: 20, color: T.textM }}>News not found.</Text>
      </View>
    );
  }

  return (
    <View style={d.root}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      {/* ════ HERO ════ */}
      <Animated.View style={[d.heroWrap, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
        <LinearGradient
          colors={meta.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={d.heroGrad}
        >
          {/* Decorative circles */}
          <View style={d.decCircle1} />
          <View style={d.decCircle2} />
          <View style={d.decGrid} />

          <Animated.View style={[d.heroBadgeRow, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <View style={d.heroBadge}>
              <Text style={d.heroBadgeIcon}>{meta.icon}</Text>
              <Text style={d.heroBadgeTxt}>{meta.label}</Text>
            </View>
            <TouchableOpacity style={d.shareBtn} onPress={handleShare}>
              <Text style={{ fontSize: 16 }}>📤</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text style={[d.heroTitle, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
          }]}>
            {news.title}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      {/* Floating Back Button */}
      <Animated.View style={[d.floatingBack, { backgroundColor: backBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={d.backInner}>
          <Animated.Text style={[d.backArrow, { color: backColor }]}>←</Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ════ SCROLLABLE BODY ════ */}
      <Animated.ScrollView
        style={d.scroll}
        contentContainerStyle={d.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Spacer for hero overlap */}
        <View style={d.heroSpacer} />

        {/* ── Card body ── */}
        <Animated.View style={[d.bodyCard, {
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>

          {/* Meta strip */}
          <View style={d.metaStrip}>
            <View style={d.metaItem}>
              <Text style={d.metaIcon}>📅</Text>
              <Text style={d.metaMd}>{news.date}</Text>
            </View>
            <View style={d.metaDivider} />
            <View style={d.metaItem}>
              <Text style={d.metaIcon}>{meta.icon}</Text>
              <Text style={d.metaMd}>{news.level} Level</Text>
            </View>
            <View style={d.metaDivider} />
            <View style={d.metaItem}>
              <Text style={d.metaIcon}>⏱</Text>
              <Text style={d.metaMd}>3 min read</Text>
            </View>
          </View>

          <View style={d.divider} />

          {/* Full content */}
          <Text style={d.bodyText}>{news.content || news.description}</Text>

          <View style={d.divider} />

          {/* Tags */}
          {news.tags?.length > 0 && (
            <View style={d.tagsSection}>
              <Text style={d.tagsSectionTitle}>Tags</Text>
              <View style={d.tagRow}>
                {news.tags.map(t => (
                  <Tag key={t} label={t} color={meta.color} bg={meta.bg} />
                ))}
              </View>
            </View>
          )}

          <View style={d.divider} />

          {/* Share CTA */}
          <TouchableOpacity style={[d.shareCta, { borderColor: meta.color + '30', backgroundColor: meta.bg }]} onPress={handleShare} activeOpacity={0.85}>
            <Text style={[d.shareCtaTxt, { color: meta.color }]}>📤 Share this news</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Related News ── */}
        {relatedNews.length > 0 && (
          <View style={d.relSection}>
            <Text style={d.relHeader}>More News</Text>
            {relatedNews.map((n, i) => (
              <RelatedCard
                key={n.id}
                n={n}
                index={i}
                onPress={() => navigation.replace('NewsDetail', { news: n, allNews })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const HERO_H = 300;

const d = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Hero
  heroWrap:  { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, zIndex: 0 },
  heroGrad:  { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: 20, paddingBottom: 30, position: 'relative', overflow: 'hidden' },
  decCircle1:{ position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)' },
  decCircle2:{ position: 'absolute', bottom: -30, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  decGrid:   { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.04 },

  heroBadgeRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7 },
  heroBadgeIcon: { fontSize: 14 },
  heroBadgeTxt:  { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  shareBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  heroTitle:     { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 30 },

  // Floating back
  floatingBack: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 16, zIndex: 99, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  backInner:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow:    { fontSize: 20, fontWeight: '700' },

  // Spacer so scroll content starts below hero
  heroSpacer: { height: HERO_H - 28 },

  // Body card
  bodyCard:    { marginHorizontal: 14, borderRadius: 24, backgroundColor: '#fff', padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, borderWidth: 1, borderColor: T.border },

  metaStrip:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  metaIcon:    { fontSize: 14 },
  metaMd:      { fontSize: 11, color: T.textM, fontWeight: '600' },
  metaDivider: { width: 1, height: 28, backgroundColor: T.border },
  divider:     { height: 1, backgroundColor: T.border, marginVertical: 18 },

  bodyText: { fontSize: 15, color: '#2d2d2d', lineHeight: 26, fontWeight: '400' },

  tagsSection:      { },
  tagsSectionTitle: { fontSize: 11, fontWeight: '700', color: T.textM, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  tagRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  tagTxt:           { fontSize: 11, fontWeight: '700' },

  shareCta:    { borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  shareCtaTxt: { fontSize: 14, fontWeight: '700' },

  // Related
  relSection: { paddingHorizontal: 14, paddingTop: 24 },
  relHeader:  { fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 12 },
  relCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, alignItems: 'center' },
  relIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  relTitle:   { fontSize: 13, fontWeight: '700', color: T.text, lineHeight: 18 },
  relBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 50 },
  relBadgeTxt:{ fontSize: 10, fontWeight: '700' },
  relDate:    { fontSize: 10, color: T.textM },
  relChev:    { fontSize: 20, color: '#ccc' },
});