import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // Animation values
  const logoScale    = useRef(new Animated.Value(0.3)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(30)).current;
  const subOpacity   = useRef(new Animated.Value(0)).current;
  const subY         = useRef(new Animated.Value(20)).current;
  const pillOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const barOpacity   = useRef(new Animated.Value(0)).current;
  const ring1Scale   = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.3)).current;
  const ring2Scale   = useRef(new Animated.Value(0.6)).current;
  const ring2Opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    // Pulse rings
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale,   { toValue:1.15, duration:1800, useNativeDriver:true }),
          Animated.timing(ring1Opacity, { toValue:0,    duration:1800, useNativeDriver:true }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale,   { toValue:0.8,  duration:0,    useNativeDriver:true }),
          Animated.timing(ring1Opacity, { toValue:0.3,  duration:0,    useNativeDriver:true }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring2Scale,   { toValue:1.3,  duration:2400, useNativeDriver:true }),
          Animated.timing(ring2Opacity, { toValue:0,    duration:2400, useNativeDriver:true }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale,   { toValue:0.6,  duration:0,    useNativeDriver:true }),
          Animated.timing(ring2Opacity, { toValue:0.2,  duration:0,    useNativeDriver:true }),
        ]),
      ])
    ).start();

    // Main animation sequence
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue:1, tension:80, friction:6, useNativeDriver:true,
        }),
        Animated.timing(logoOpacity, {
          toValue:1, duration:400, useNativeDriver:true,
        }),
      ]),
      // Title slide up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue:1, duration:500, useNativeDriver:true }),
        Animated.timing(titleY,       { toValue:0, duration:500, useNativeDriver:true }),
      ]),
      // Subtitle
      Animated.parallel([
        Animated.timing(subOpacity, { toValue:1, duration:400, useNativeDriver:true }),
        Animated.timing(subY,       { toValue:0, duration:400, useNativeDriver:true }),
      ]),
      // Pills
      Animated.timing(pillOpacity, { toValue:1, duration:300, useNativeDriver:true }),
      // Progress bar
      Animated.timing(barOpacity, { toValue:1, duration:200, useNativeDriver:true }),
      // Fill bar
      Animated.timing(barWidth, {
        toValue: width * 0.55, duration:1800,
        useNativeDriver:false,
      }),
    ]).start(() => {
      // Done
      StatusBar.setHidden(false);
      if (Platform.OS === 'android') StatusBar.setBarStyle('light-content');
      setTimeout(() => onFinish?.(), 300);
    });
  }, []);

  return (
    <View style={s.root}>
      <StatusBar hidden />

      {/* Background gradient */}
      <LinearGradient
        colors={[T.maroonD, T.maroon, '#A03030']}
        start={{ x:0, y:0 }}
        end={{ x:1, y:1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Gold diagonal accent bar */}
      <View style={s.accent1} />
      <View style={s.accent2} />

      {/* Decorative dots pattern */}
      <View style={s.dotsGrid}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={s.dot} />
        ))}
      </View>

      {/* Center content */}
      <View style={s.center}>
        {/* Pulse rings */}
        <Animated.View style={[s.ring, s.ring2, { transform:[{ scale:ring2Scale }], opacity:ring2Opacity }]} />
        <Animated.View style={[s.ring, s.ring1, { transform:[{ scale:ring1Scale }], opacity:ring1Opacity }]} />

        {/* Logo circle */}
        <Animated.View style={[s.logoWrap, { opacity:logoOpacity, transform:[{ scale:logoScale }] }]}>
          <LinearGradient colors={['rgba(255,255,255,0.25)','rgba(255,255,255,0.1)']} style={s.logoCircle}>
            <Text style={s.logoEmoji}>🏛️</Text>
          </LinearGradient>
          {/* Gold ring */}
          <View style={s.goldRing} />
        </Animated.View>

        {/* App name */}
        <Animated.View style={{ opacity:titleOpacity, transform:[{ translateY:titleY }], alignItems:'center', marginTop:28 }}>
          <Text style={s.appName}>People Connect</Text>
          <View style={s.titleUnderline} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity:subOpacity, transform:[{ translateY:subY }], alignItems:'center', marginTop:14 }}>
          <Text style={s.tagline}>Tamil Nadu Public Service Platform</Text>
          <Text style={s.taglineSub}>Empowering Citizens · Enabling Governance</Text>
        </Animated.View>

        {/* Emblem pills */}
        <Animated.View style={[s.pillRow, { opacity:pillOpacity }]}>
          {['🤝 Citizens First', '⚡ Fast Response', '🔒 Secure'].map((label) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillTxt}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom — progress bar + version */}
      <View style={s.bottom}>
        <Animated.View style={{ opacity:barOpacity, width:'100%', alignItems:'center' }}>
          <View style={s.barTrack}>
            <Animated.View style={[s.barFill, { width:barWidth }]} />
          </View>
          <Text style={s.loadingTxt}>Loading your dashboard...</Text>
        </Animated.View>

        <View style={s.bottomRow}>
          <Text style={s.version}>v1.0.0</Text>
          <Text style={s.govBadge}>🇮🇳 Government of Tamil Nadu</Text>
          <Text style={s.version}>© 2025</Text>
        </View>
      </View>
    </View>
  );
}

const LOGO_SIZE = 110;
const RING1     = LOGO_SIZE + 50;
const RING2     = LOGO_SIZE + 100;

const s = StyleSheet.create({
  root:   { flex:1, alignItems:'center', justifyContent:'space-between', paddingBottom:48 },

  // Decorative
  accent1:  { position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:100, backgroundColor:'rgba(201,152,42,0.12)', transform:[{ rotate:'45deg' }] },
  accent2:  { position:'absolute', bottom:120, left:-80, width:260, height:260, borderRadius:130, backgroundColor:'rgba(255,255,255,0.05)', transform:[{ rotate:'-20deg' }] },
  dotsGrid: { position:'absolute', top:60, left:20, flexDirection:'row', flexWrap:'wrap', width:120, gap:12, opacity:0.15 },
  dot:      { width:4, height:4, borderRadius:2, backgroundColor:'#fff' },

  // Rings
  ring:  { position:'absolute', borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.2)' },
  ring1: { width:RING1, height:RING1, marginTop:-(RING1-LOGO_SIZE)/2 },
  ring2: { width:RING2, height:RING2, marginTop:-(RING2-LOGO_SIZE)/2 },

  // Logo
  center:     { flex:1, alignItems:'center', justifyContent:'center' },
  logoWrap:   { alignItems:'center', justifyContent:'center' },
  logoCircle: { width:LOGO_SIZE, height:LOGO_SIZE, borderRadius:LOGO_SIZE/2, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'rgba(255,255,255,0.3)' },
  logoEmoji:  { fontSize:50 },
  goldRing:   { position:'absolute', width:LOGO_SIZE+16, height:LOGO_SIZE+16, borderRadius:(LOGO_SIZE+16)/2, borderWidth:2, borderColor:T.gold, opacity:0.6 },

  // Text
  appName:       { fontSize:34, fontWeight:'900', color:'#fff', letterSpacing:1 },
  titleUnderline:{ width:60, height:3, backgroundColor:T.gold, borderRadius:2, marginTop:8 },
  tagline:       { fontSize:14, color:'rgba(255,255,255,0.85)', fontWeight:'600', textAlign:'center' },
  taglineSub:    { fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:5, textAlign:'center', letterSpacing:0.5 },

  // Pills
  pillRow: { flexDirection:'row', gap:8, marginTop:32, flexWrap:'wrap', justifyContent:'center', paddingHorizontal:20 },
  pill:    { backgroundColor:'rgba(255,255,255,0.12)', paddingHorizontal:14, paddingVertical:7, borderRadius:50, borderWidth:1, borderColor:'rgba(255,255,255,0.2)' },
  pillTxt: { color:'rgba(255,255,255,0.85)', fontSize:12, fontWeight:'600' },

  // Bottom
  bottom:      { width:'100%', alignItems:'center', paddingHorizontal:40, gap:16 },
  barTrack:    { width:'100%', height:3, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:2, overflow:'hidden' },
  barFill:     { height:'100%', backgroundColor:T.gold, borderRadius:2 },
  loadingTxt:  { fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:10, letterSpacing:0.5 },
  bottomRow:   { width:'100%', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  version:     { fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:'600' },
  govBadge:    { fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:'700' },
});