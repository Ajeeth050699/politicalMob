import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../constants/theme';

export default function CompactSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  searchable = true,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const safeOptions = useMemo(() => Array.isArray(options) ? options.filter(Boolean) : [], [options]);
  const selectedLabel = value === 'ALL' ? 'All' : value || placeholder;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeOptions;
    return safeOptions.filter((item) => String(item).toLowerCase().includes(q));
  }, [safeOptions, query]);

  const choose = (item) => {
    onChange(item);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <TouchableOpacity style={s.control} onPress={() => setOpen(true)} activeOpacity={0.82}>
        <Text style={s.label} numberOfLines={1}>{label}</Text>
        <Text style={s.value} numberOfLines={1}>{selectedLabel}</Text>
        <Text style={s.chevron}>v</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity style={s.sheet} activeOpacity={1}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{label}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={() => setOpen(false)}>
                <Text style={s.closeTxt}>x</Text>
              </TouchableOpacity>
            </View>
            {searchable && safeOptions.length > 8 && (
              <TextInput
                style={s.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={T.textM}
              />
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item)}
              keyboardShouldPersistTaps="handled"
              style={s.list}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <TouchableOpacity
                    style={[s.option, active && s.optionActive]}
                    onPress={() => choose(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.optionTxt, active && s.optionTxtActive]} numberOfLines={2}>
                      {item === 'ALL' ? 'All' : item}
                    </Text>
                    {active && <Text style={s.check}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={s.empty}>No options found</Text>}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  control: {
    flex: 1,
    minWidth: 150,
    maxWidth: 230,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: { fontSize: 11, color: T.textM, fontWeight: '800', maxWidth: 72 },
  value: { flex: 1, minWidth: 0, fontSize: 12, color: T.text, fontWeight: '800' },
  chevron: { color: T.maroon, fontSize: 12, fontWeight: '900' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    maxHeight: '76%',
  },
  sheetHandle: { width: 42, height: 4, borderRadius: 4, backgroundColor: T.border, alignSelf: 'center', marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: T.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 15, color: T.textL, fontWeight: '900' },
  search: {
    height: 42,
    borderRadius: 12,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    color: T.text,
    fontSize: 13,
    marginBottom: 10,
  },
  list: { maxHeight: 430 },
  option: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    backgroundColor: T.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionActive: { backgroundColor: T.maroon },
  optionTxt: { flex: 1, color: T.text, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  optionTxtActive: { color: '#fff' },
  check: { color: '#fff', fontSize: 14, fontWeight: '900' },
  empty: { textAlign: 'center', color: T.textM, paddingVertical: 28, fontWeight: '700' },
});
