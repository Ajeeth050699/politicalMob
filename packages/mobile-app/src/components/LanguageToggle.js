import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../context/LanguageContext';
import { T } from '../constants/theme';

export default function LanguageToggle({ dark }) {
  const { lang, changeLang } = useLang();

  return (
    <View style={s.row}>
      {['en', 'ta'].map((l) => {
        const active = lang === l;
        return (
          <TouchableOpacity
            key={l}
            onPress={() => changeLang(l)}
            style={[
              s.btn,
              active && (dark ? s.btnActiveDark : s.btnActive),
              !active && (dark ? s.btnInactiveDark : s.btnInactive),
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              s.txt,
              active && (dark ? s.txtActiveDark : s.txtActive),
              !active && (dark ? s.txtInactiveDark : s.txtInactive),
            ]}>
              {l === 'en' ? 'EN' : 'த'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row:             { flexDirection:'row', gap:4 },
  btn:             { paddingHorizontal:12, paddingVertical:6, borderRadius:50, borderWidth:1.5 },
  btnActive:       { backgroundColor:T.maroon, borderColor:T.maroon },
  btnInactive:     { backgroundColor:'transparent', borderColor:T.border },
  btnActiveDark:   { backgroundColor:'#fff', borderColor:'#fff' },
  btnInactiveDark: { backgroundColor:'rgba(255,255,255,0.15)', borderColor:'rgba(255,255,255,0.3)' },
  txt:             { fontSize:12, fontWeight:'800' },
  txtActive:       { color:'#fff' },
  txtInactive:     { color:T.textL },
  txtActiveDark:   { color:T.maroon },
  txtInactiveDark: { color:'rgba(255,255,255,0.8)' },
});