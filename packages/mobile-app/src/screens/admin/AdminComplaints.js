import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { complaintAPI, systemAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import PopupToast from '../../components/PopupToast';

const CATEGORY_ICONS = {
  'Street Light Problem':'💡', 'Road Damage':'🛣️', 'Garbage Issue':'🗑️',
  'Water Supply Problem':'💧', 'Drainage Issue':'🚰', 'Public Safety Issue':'🚨', 'Others':'📝',
};

const STATUS_COLORS = {
  'NEW':         { color:'#f59e0b', bg:'#fef3c7', icon:'🆕', label:'New'         },
  'ACCEPTED':    { color:'#3b82f6', bg:'#dbeafe', icon:'✅', label:'Accepted'     },
  'IN PROGRESS': { color:'#8b5cf6', bg:'#ede9fe', icon:'⚙️', label:'In Progress'  },
  'COMPLETED':   { color:'#22c55e', bg:'#dcfce7', icon:'🎉', label:'Completed'    },
};

const PRIORITY_COLORS = {
  'high':   '#ef4444',
  'medium': '#f59e0b',
  'low':    '#22c55e',
};

export default function AdminComplaints({ navigation }) {
  const { t }                    = useTranslation();
  const { userInfo }             = useAuth();
  const [complaints,    setComplaints]    = useState([]);
  const [thokuthis,     setThokuthis]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [selectedThokuthi, setSelectedThokuthi] = useState(() => userInfo?.booth || userInfo?.ward || 'ALL');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterStatus,  setFilterStatus]  = useState('ALL');
  const [toast,         setToast]         = useState({ visible:false, message:'', type:'error' });

  const showToast = (msg, type='error') => setToast({ visible:true, message:msg, type });

  const load = async () => {
    try {
      const [complaintRes, thokuthisRes] = await Promise.all([
        complaintAPI.getAll({ 
          ...(selectedThokuthi !== 'ALL' && { booth: selectedThokuthi }),
          ...(filterStatus !== 'ALL' && { status: filterStatus })
        }),
        systemAPI.getWards().catch(() => ({ data: { wards: [] } }))
      ]);
      setComplaints(complaintRes.data || []);
      
      // Extract unique thokuthis from wards
      if (thokuthisRes.data?.wards) {
        setThokuthis(['ALL', ...thokuthisRes.data.wards.map(w => w.name).filter(Boolean)]);
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
      showToast('Failed to load complaints', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [selectedThokuthi, filterStatus]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Filter complaints based on search
  const filtered = complaints.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.category?.toLowerCase().includes(query) ||
      c.user?.toLowerCase().includes(query) ||
      c.booth?.toLowerCase().includes(query) ||
      c.ward?.toLowerCase().includes(query) ||
      c.district?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  });

  const counts = {
    NEW:         complaints.filter(c => c.status === 'NEW').length,
    ACCEPTED:    complaints.filter(c => c.status === 'ACCEPTED').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN PROGRESS').length,
    COMPLETED:   complaints.filter(c => c.status === 'COMPLETED').length,
  };

  const renderItem = ({ item: c }) => {
    const sm = STATUS_COLORS[c.status] || STATUS_COLORS['NEW'];
    const catIcon = CATEGORY_ICONS[c.category] || '📝';
    const workerAcceptedStatus = c.assignedWorker ? 'Accepted' : 'Pending';
    const workerBadgeColor = c.assignedWorker ? '#dcfce7' : '#fee2e2';
    const workerTextColor = c.assignedWorker ? '#166534' : '#991b1b';

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ComplaintDetailAdmin', { id: c._id || c.id })}
        activeOpacity={0.92}
      >
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={[s.catIconBox, { backgroundColor:T.maroon + '12' }]}>
            <Text style={{ fontSize:22 }}>{catIcon}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.catTxt} numberOfLines={1}>{c.category}</Text>
            <Text style={s.metaTxt}>👤 {c.user} · 🏠 {c.booth}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor:sm.bg }]}>
            <Text style={{ fontSize:10 }}>{sm.icon}</Text>
            <Text style={[s.statusTxt, { color:sm.color }]}>{sm.label}</Text>
          </View>
        </View>

        {/* Meta Row */}
        <View style={s.metaRow}>
          <Text style={s.metaChip}>📍 {c.district}</Text>
          {c.wardNo && <Text style={s.metaChip}>🔢 Ward {c.wardNo}</Text>}
          <Text style={s.metaChip}>📅 {new Date(c.time).toLocaleDateString('en-IN')}</Text>
        </View>

        {/* Worker Status Badge */}
        <View style={[s.workerStatusBadge, { backgroundColor: workerBadgeColor }]}>
          <Text style={[s.workerStatusText, { color: workerTextColor }]}>
            👷 {c.assignedWorker ? `${c.assignedWorker} - Accepted` : 'Worker not accepted yet'}
          </Text>
        </View>

        {/* Description Preview */}
        <Text style={s.descriptionPreview} numberOfLines={2}>
          {c.description || 'No description provided'}
        </Text>

        {/* View Details Link */}
        <TouchableOpacity 
          style={s.viewDetailsBtn}
          onPress={() => navigation.navigate('ComplaintDetailAdmin', { id: c._id || c.id })}
        >
          <Text style={s.viewDetailsTxt}>📋 View Full Details →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color:T.textM, marginTop:10 }}>Loading complaints...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>📋 All Complaints</Text>
        <Text style={s.headerSub}>Admin View - View Only</Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={s.statsBar}>
        {[
          { label: 'New', count: counts.NEW, color: '#f59e0b' },
          { label: 'Accepted', count: counts.ACCEPTED, color: '#3b82f6' },
          { label: 'In Progress', count: counts.IN_PROGRESS, color: '#8b5cf6' },
          { label: 'Completed', count: counts.COMPLETED, color: '#22c55e' },
        ].map(({ label, count, color }) => (
          <TouchableOpacity
            key={label}
            style={[s.statItem, { borderColor: color }]}
            onPress={() => setFilterStatus(label === 'New' ? 'NEW' : label === 'Accepted' ? 'ACCEPTED' : label === 'In Progress' ? 'IN PROGRESS' : 'COMPLETED')}
          >
            <Text style={[s.statCount, { color }]}>{count}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters Section */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={s.filtersContainer}
        contentContainerStyle={s.filtersContent}
      >
        {/* Thokuthi Filter */}
        <View style={s.filterItem}>
          <Text style={s.filterLabel}>Thokuthi:</Text>
          <View style={s.pickerContainer}>
            <Picker
              selectedValue={selectedThokuthi}
              onValueChange={(value) => setSelectedThokuthi(value)}
              style={s.picker}
            >
              {thokuthis.map((thok) => (
                <Picker.Item key={thok} label={thok} value={thok} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Status Filter */}
        <View style={s.filterItem}>
          <Text style={s.filterLabel}>Status:</Text>
          <View style={s.pickerContainer}>
            <Picker
              selectedValue={filterStatus}
              onValueChange={(value) => setFilterStatus(value)}
              style={s.picker}
            >
              {['ALL', 'NEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED'].map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
          </View>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="🔍 Search by category, user, booth, ward..."
          placeholderTextColor={T.textM}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Results Count */}
      <View style={s.resultsInfo}>
        <Text style={s.resultsText}>
          Showing {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Complaints List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id || Math.random())}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={s.emptyTxt}>No complaints found</Text>
            <Text style={s.emptySubTxt}>Try adjusting your filters or search</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
        contentContainerStyle={s.listContent}
        scrollEnabled={true}
      />

      {/* Toast */}
      {toast.visible && (
        <PopupToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:     { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 16, marginBottom: 12 },
  headerTitle:{ fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  statsBar:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  statItem:  { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 2, alignItems: 'center', backgroundColor: T.bg },
  statCount: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, color: T.textM, marginTop: 2, fontWeight: '600' },

  filtersContainer:{ backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  filtersContent: { paddingHorizontal: 12, gap: 12 },
  filterItem:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.bg, borderRadius: 10 },
  filterLabel:   { fontSize: 12, fontWeight: '700', color: T.text, minWidth: 60 },
  pickerContainer:{ borderWidth: 1, borderColor: T.border, borderRadius: 8, overflow: 'hidden', minWidth: 120 },
  picker:        { height: 40, paddingHorizontal: 8 },

  searchContainer:{ paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput:   { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: T.text },

  resultsInfo:{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border },
  resultsText:{ fontSize: 12, color: T.textL, fontWeight: '600' },

  listContent:{ paddingHorizontal: 12, paddingVertical: 12 },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border, elevation: 2 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  catIconBox:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catTxt:         { fontSize: 14, fontWeight: '700', color: T.text },
  metaTxt:        { fontSize: 11, color: T.textM, marginTop: 3 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusTxt:      { fontSize: 9, fontWeight: '700', marginTop: 2 },

  metaRow:        { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  metaChip:       { fontSize: 10, backgroundColor: T.bg, color: T.textM, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  workerStatusBadge:{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 10 },
  workerStatusText: { fontSize: 11, fontWeight: '600' },

  descriptionPreview:{ fontSize: 12, color: T.textL, marginBottom: 10, lineHeight: 18 },

  viewDetailsBtn:{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: T.maroon + '15', borderWidth: 1, borderColor: T.maroon },
  viewDetailsTxt: { fontSize: 11, color: T.maroon, fontWeight: '700' },

  empty:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTxt:  { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 4 },
  emptySubTxt:{ fontSize: 12, color: T.textM },
});
