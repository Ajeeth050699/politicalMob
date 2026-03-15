import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { T } from '../constants/theme';

// type: 'error' | 'success' | 'warning' | 'info'
export default function PopupToast({ message, type = 'error', visible, onHide }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible && message) {
      // Slide in
      Animated.parallel([
        Animated.timing(opacity,    { toValue:1,   duration:280, useNativeDriver:true }),
        Animated.spring(translateY, { toValue:0,   tension:80,   friction:6, useNativeDriver:true }),
      ]).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity,    { toValue:0, duration:250, useNativeDriver:true }),
          Animated.timing(translateY, { toValue:-20, duration:250, useNativeDriver:true }),
        ]).start(() => onHide?.());
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(0);
      translateY.setValue(-20);
    }
  }, [visible, message]);

  if (!visible || !message) return null;

  const colors = {
    error:   { bg: '#FEE2E2', border: '#ef4444', icon: '❌', text: '#dc2626' },
    success: { bg: '#DCFCE7', border: '#22c55e', icon: '✅', text: '#16a34a' },
    warning: { bg: '#FEF3C7', border: '#f59e0b', icon: '⚠️', text: '#d97706' },
    info:    { bg: '#DBEAFE', border: '#3b82f6', icon: 'ℹ️', text: '#2563eb' },
  };

  const c = colors[type] || colors.error;

  return (
    <Animated.View style={[
      s.toast,
      { backgroundColor: c.bg, borderLeftColor: c.border, opacity, transform:[{ translateY }] },
    ]}>
      <Text style={s.icon}>{c.icon}</Text>
      <Text style={[s.msg, { color: c.text }]}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position:    'absolute',
    top:         16,
    left:        16,
    right:       16,
    zIndex:      9999,
    borderRadius:14,
    borderLeftWidth:4,
    paddingVertical:14,
    paddingHorizontal:16,
    flexDirection:'row',
    alignItems:'center',
    gap:12,
    elevation:10,
    shadowColor:'#000',
    shadowOpacity:0.15,
    shadowRadius:12,
    shadowOffset:{ width:0, height:4 },
  },
  icon: { fontSize:18 },
  msg:  { fontSize:14, fontWeight:'600', flex:1, lineHeight:20 },
});