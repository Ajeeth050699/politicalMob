import { complaintCategoryT, literalT } from "../../i18n/runtimeTamil";import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar, Modal,
  TextInput, ScrollView } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI, systemAPI } from '../../services/api';
import { T, TN_DISTRICTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import PopupToast from '../../components/PopupToast';
import CompactSelect from '../../components/CompactSelect';
import { exportRows } from '../../utils/exportData';
import { goBackOrHome } from '../../utils/navigation';

const CATEGORY_ICONS = {
  'Street Light Problem': '💡', 'Road Damage': '🛣️', 'Garbage Issue': '🗑️',
  'Water Supply Problem': '💧', 'Drainage Issue': '🚰', 'Public Safety Issue': '🚨', 'Others': '📝'
};

const STATUS_COLORS = {
  'NEW': { color: '#f59e0b', bg: '#fef3c7', icon: '🆕', label: 'New' },
  'ACCEPTED': { color: '#3b82f6', bg: '#dbeafe', icon: '✅', label: 'Accepted' },
  'IN PROGRESS': { color: '#8b5cf6', bg: '#ede9fe', icon: '⚙️', label: 'In Progress' },
  'COMPLETED': { color: '#22c55e', bg: '#dcfce7', icon: '🎉', label: 'Completed' }
};

export default function AdminComplaints({ route, navigation }) {
  const { userInfo } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [thokuthis, setThokuthis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedThokuthi, setSelectedThokuthi] = useState(() => userInfo?.thokuthi || userInfo?.ward || 'ALL');
  const [filterDistrict, setFilterDistrict] = useState(() => userInfo?.district || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(route?.params?.status || 'ALL');
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (msg, type = 'error') => setToast({ visible: true, message: msg, type });
  const goBack = () => goBackOrHome(navigation, 'Dashboard');

  const load = async () => {
    try {
      const [complaintRes, thokuthisRes] = await Promise.all([
      complaintAPI.getAll({
        ...(filterDistrict !== 'ALL' && { district: filterDistrict }),
        ...(selectedThokuthi !== 'ALL' && { thokuthi: selectedThokuthi }),
        ...(filterStatus !== 'ALL' && { status: filterStatus })
      }),
      systemAPI.getWards().catch(() => ({ data: { wards: [] } }))]
      );
      setComplaints(complaintRes.data || []);

      // Extract unique thokuthis from wards
      if (thokuthisRes.data?.wards) {
        setThokuthis(['ALL', ...thokuthisRes.data.wards.map((w) => w.name).filter(Boolean)]);
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
      showToast('Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.status) setFilterStatus(route.params.status);
  }, [route?.params?.status]);
  useEffect(() => {load();}, [filterDistrict, selectedThokuthi, filterStatus]);
  const onRefresh = async () => {setRefreshing(true);await load();setRefreshing(false);};

  // Filter complaints based on search
  const filtered = complaints.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.category?.toLowerCase().includes(query) ||
      c.user?.toLowerCase().includes(query) ||
      c.thokuthi?.toLowerCase().includes(query) ||
      c.ward?.toLowerCase().includes(query) ||
      c.district?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query));

  });

  const counts = {
    NEW: complaints.filter((c) => c.status === 'NEW').length,
    ACCEPTED: complaints.filter((c) => c.status === 'ACCEPTED').length,
    IN_PROGRESS: complaints.filter((c) => c.status === 'IN PROGRESS').length,
    COMPLETED: complaints.filter((c) => c.status === 'COMPLETED').length
  };

  const complaintExportData = () => ({
    headers: ['Category', 'User', 'Phone', 'Thokuthi', 'District', 'Status', 'Worker', 'Date', 'Description'],
    rows: filtered.map((c) => [
    c.category || 'N/A',
    c.user || 'N/A',
    c.userPhone || 'N/A',
    c.thokuthi || c.ward || 'N/A',
    c.district || 'N/A',
    c.status || 'N/A',
    c.assignedWorker || 'Unassigned',
    c.time ? new Date(c.time).toLocaleDateString('en-IN') : 'N/A',
    c.description || '']
    )
  });

  const handleExport = async (format) => {
    try {
      await exportRows({
        format,
        title: 'Complaints List',
        fileName: `complaints_${filterDistrict === 'ALL' ? 'all_districts' : filterDistrict}_${filterStatus.toLowerCase().replace(/\s+/g, '_')}`,
        ...complaintExportData()
      });
      setExportOpen(false);
      showToast(`${format.toUpperCase()} export ready`, 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to export', 'error');
    }
  };

  const renderItem = ({ item: c }) => {
    const sm = STATUS_COLORS[c.status] || STATUS_COLORS['NEW'];
    const catIcon = CATEGORY_ICONS[c.category] || '📝';
    const workerBadgeColor = c.assignedWorker ? '#dcfce7' : '#fee2e2';
    const workerTextColor = c.assignedWorker ? '#166534' : '#991b1b';

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('ComplaintDetailAdmin', { id: c._id || c.id })}
        activeOpacity={0.92}>
        
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={[s.catIconBox, { backgroundColor: T.maroon + '12' }]}>
            <Text style={{ fontSize: 22 }}>{catIcon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.catTxt} numberOfLines={1}>{complaintCategoryT(c.category, c.customCategory)}</Text>
            <Text style={s.metaTxt}>👤 {c.user} · 🏠 {c.thokuthi}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sm.bg }]}>
            <Text style={{ fontSize: 10 }}>{sm.icon}</Text>
            <Text style={[s.statusTxt, { color: sm.color }]}>{sm.label}</Text>
          </View>
        </View>

        {/* Meta Row */}
        <View style={s.metaRow}>
          <Text style={s.metaChip}>📍 {c.district}</Text>
          {c.wardNo && <Text style={s.metaChip}>{literalT("🔢 Ward")}{c.wardNo}</Text>}
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
          onPress={() => navigation.navigate('ComplaintDetailAdmin', { id: c._id || c.id })}>
          
          <Text style={s.viewDetailsTxt}>{literalT("📋 View Full Details →")}</Text>
        </TouchableOpacity>
      </TouchableOpacity>);

  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 10 }}>{literalT("Loading complaints...")}</Text>
    </View>);


  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{literalT("📋 All Complaints")}</Text>
        <Text style={s.headerSub}>{literalT("Admin View - View Only")}</Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={s.statsBar}>
        {[
        { label: 'New', count: counts.NEW, color: '#f59e0b' },
        { label: 'Accepted', count: counts.ACCEPTED, color: '#3b82f6' },
        { label: 'In Progress', count: counts.IN_PROGRESS, color: '#8b5cf6' },
        { label: 'Completed', count: counts.COMPLETED, color: '#22c55e' }].
        map(({ label, count, color }) =>
        <TouchableOpacity
          key={label}
          style={[s.statItem, { borderColor: color }]}
          onPress={() => setFilterStatus(label === 'New' ? 'NEW' : label === 'Accepted' ? 'ACCEPTED' : label === 'In Progress' ? 'IN PROGRESS' : 'COMPLETED')}>
          
            <Text style={[s.statCount, { color }]}>{count}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filtersContainer}
        contentContainerStyle={s.filtersContent}>
        
        <CompactSelect
          label={literalT("District")}
          value={filterDistrict}
          options={['ALL', ...TN_DISTRICTS]}
          onChange={setFilterDistrict} />
        
        <CompactSelect
          label={literalT("Thokuthi")}
          value={selectedThokuthi}
          options={thokuthis.length ? thokuthis : ['ALL']}
          onChange={setSelectedThokuthi} />
        
        <CompactSelect
          label={literalT("Status")}
          value={filterStatus}
          options={['ALL', 'NEW', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED']}
          onChange={setFilterStatus}
          searchable={false} />
        
      </ScrollView>

      <View style={s.activeFilters}>
        <Text style={s.activeFilterText}>{literalT("District:")}{filterDistrict === 'ALL' ? 'All' : filterDistrict}</Text>
        <Text style={s.activeFilterText}>{literalT("Thokuthi:")}{selectedThokuthi === 'ALL' ? 'All' : selectedThokuthi}</Text>
        <Text style={s.activeFilterText}>{literalT("Status:")}{filterStatus === 'ALL' ? 'All' : filterStatus}</Text>
      </View>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder={literalT("🔍 Search by category, user, thokuthi, ward...")}
          placeholderTextColor={T.textM}
          value={searchQuery}
          onChangeText={setSearchQuery} />
        
      </View>

      {/* Results Count */}
      <View style={s.resultsInfo}>
        <Text style={s.resultsText}>{literalT("Showing")}
          {filtered.length}{literalT("complaint")}{filtered.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity style={s.downloadBtn} onPress={() => setExportOpen(true)}>
          <Text style={s.downloadBtnText}>{literalT("Download")}</Text>
        </TouchableOpacity>
      </View>

      {/* Complaints List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id || Math.random())}
        renderItem={renderItem}
        ListEmptyComponent={
        <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={s.emptyTxt}>{literalT("No complaints found")}</Text>
            <Text style={s.emptySubTxt}>{literalT("Try adjusting your filters or search")}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
        contentContainerStyle={s.listContent}
        scrollEnabled={true} />
      

      <Modal visible={exportOpen} transparent animationType="fade" onRequestClose={() => setExportOpen(false)}>
        <View style={s.exportOverlay}>
          <View style={s.exportSheet}>
            <View style={s.exportHeader}>
              <Text style={s.exportTitle}>{literalT("Download complaints")}</Text>
              <TouchableOpacity onPress={() => setExportOpen(false)} style={s.exportClose}>
                <Text style={s.exportCloseTxt}>x</Text>
              </TouchableOpacity>
            </View>
            {[
            { key: 'csv', title: 'CSV file', sub: 'For simple data import' },
            { key: 'excel', title: 'Excel sheet', sub: 'Opens in Microsoft Excel' },
            { key: 'pdf', title: 'PDF report', sub: 'Printable complaint summary' }].
            map((item) =>
            <TouchableOpacity key={item.key} style={s.exportOption} onPress={() => handleExport(item.key)}>
                <View>
                  <Text style={s.exportOptionTitle}>{item.title}</Text>
                  <Text style={s.exportOptionSub}>{item.sub}</Text>
                </View>
                <Text style={s.exportArrow}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast.visible &&
      <PopupToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })} />

      }
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: 16, paddingHorizontal: 16, marginBottom: 12, zIndex: 1 },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 42, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10 },
  backTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4, textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  statsBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  statItem: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 2, alignItems: 'center', backgroundColor: T.bg },
  statCount: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, color: T.textM, marginTop: 2, fontWeight: '600' },

  filtersContainer: { backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border, maxHeight: 62 },
  filtersContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  activeFilters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  activeFilterText: { fontSize: 11, fontWeight: '700', color: T.maroon, backgroundColor: T.maroon + '12', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },

  searchContainer: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: T.text },

  resultsInfo: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  resultsText: { fontSize: 12, color: T.textL, fontWeight: '600' },
  downloadBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.maroon, borderRadius: 8 },
  downloadBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  listContent: { paddingHorizontal: 12, paddingVertical: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  catIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catTxt: { fontSize: 14, fontWeight: '700', color: T.text },
  metaTxt: { fontSize: 11, color: T.textM, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusTxt: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  metaChip: { fontSize: 10, backgroundColor: T.bg, color: T.textM, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  workerStatusBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 10 },
  workerStatusText: { fontSize: 11, fontWeight: '600' },

  descriptionPreview: { fontSize: 12, color: T.textL, marginBottom: 10, lineHeight: 18 },

  viewDetailsBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: T.maroon + '15', borderWidth: 1, borderColor: T.maroon },
  viewDetailsTxt: { fontSize: 11, color: T.maroon, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTxt: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 4 },
  emptySubTxt: { fontSize: 12, color: T.textM },

  exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  exportSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 18 },
  exportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  exportTitle: { fontSize: 16, fontWeight: '900', color: T.text },
  exportClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  exportCloseTxt: { fontSize: 15, fontWeight: '900', color: T.textL },
  exportOption: { minHeight: 58, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exportOptionTitle: { fontSize: 14, fontWeight: '900', color: T.text },
  exportOptionSub: { fontSize: 11, color: T.textM, marginTop: 2, fontWeight: '600' },
  exportArrow: { fontSize: 22, color: T.maroon, fontWeight: '900' }
});
