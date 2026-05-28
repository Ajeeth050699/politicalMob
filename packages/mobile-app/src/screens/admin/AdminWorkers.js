import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar, TextInput,
  ScrollView, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { workerAPI } from '../../services/api';
import { T, TN_DISTRICTS } from '../../constants/theme';
import PopupToast from '../../components/PopupToast';
import CompactSelect from '../../components/CompactSelect';
import { exportRows } from '../../utils/exportData';
import { goBackOrHome } from '../../utils/navigation';

export default function AdminWorkers({ navigation }) {
  const [workers,       setWorkers]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterDistrict,setFilterDistrict]= useState('ALL');
  const [exportOpen,    setExportOpen]    = useState(false);
  const [selectedWorker,setSelectedWorker]= useState(null);
  const [toast,         setToast]         = useState({ visible:false, message:'', type:'error' });

  const showToast = (msg, type='error') => setToast({ visible:true, message:msg, type });
  const goBack = () => goBackOrHome(navigation, 'Dashboard');

  const load = async () => {
    try {
      const workersRes = await workerAPI.getAll({ 
        ...(filterDistrict !== 'ALL' && { district: filterDistrict })
      });
      setWorkers(workersRes.data || []);
    } catch (err) {
      console.error('Error loading workers:', err);
      showToast('Failed to load workers', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [filterDistrict]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Filter workers based on search
  const filtered = workers.filter(w => {
    const query = searchQuery.toLowerCase();
    return (
      w.name?.toLowerCase().includes(query) ||
      w.thokuthi?.toLowerCase().includes(query) ||
      w.district?.toLowerCase().includes(query) ||
      w.workCategory?.toLowerCase().includes(query) ||
      w.email?.toLowerCase().includes(query)
    );
  });

  const workerExportData = () => ({
    headers: ['Name', 'Email', 'Phone', 'Work Category', 'Thokuthi', 'District', 'Resolved', 'Pending', 'Status'],
    rows: filtered.map(w => [
      w.name,
      w.email,
      w.phone,
      w.workCategory || 'N/A',
      w.thokuthi || 'N/A',
      w.district || 'N/A',
      w.resolved || 0,
      w.pending || 0,
      w.status,
    ]),
  });

  const handleExport = async (format) => {
    try {
      await exportRows({
        format,
        title: 'Workers List',
        fileName: `workers_${filterDistrict === 'ALL' ? 'all_districts' : filterDistrict}`,
        ...workerExportData(),
      });
      setExportOpen(false);
      showToast(`${format.toUpperCase()} export ready`, 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to export', 'error');
    }
  };

  const renderWorkerCard = ({ item: w }) => {
    const total = (w.resolved || 0) + (w.pending || 0);
    const resolvedPct = total > 0 ? Math.round((w.resolved / total) * 100) : 0;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => setSelectedWorker(w)}
        activeOpacity={0.92}
      >
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(w.name || 'W')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.workerName}>{w.name}</Text>
            <Text style={s.categoryTag}>{w.workCategory || 'Worker'}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: w.status === 'active' ? '#dcfce7' : '#f3f4f6' }]}>
            <Text style={[s.statusText, { color: w.status === 'active' ? '#166534' : '#6b7280' }]}>
              {w.status === 'active' ? '✓ Active' : '○ Inactive'}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={s.locationInfo}>
          <Text style={s.infoChip}>🏠 {w.thokuthi || 'N/A'}</Text>
          <Text style={s.infoChip}>📍 {w.district || 'N/A'}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsContainer}>
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: T.green }]}>{w.resolved || 0}</Text>
            <Text style={s.statLabel}>Resolved</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: T.amber }]}>{w.pending || 0}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statNumber, { color: T.maroon }]}>{resolvedPct}%</Text>
            <Text style={s.statLabel}>Resolution</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressContainer}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${resolvedPct}%` }]} />
          </View>
          <Text style={s.progressText}>{resolvedPct}% complete</Text>
        </View>

        {/* Contact */}
        <View style={s.contactRow}>
          <Text style={s.contactText}>📧 {w.email || 'N/A'}</Text>
          <Text style={s.contactText}>📱 {w.phone || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color:T.textM, marginTop:10 }}>Loading workers...</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>👷 Workers Management</Text>
        <Text style={s.headerSub}>View and manage field workers</Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={s.quickStats}>
        <View style={s.statQuick}>
          <Text style={s.statQuickNumber}>{workers.length}</Text>
          <Text style={s.statQuickLabel}>Total Workers</Text>
        </View>
        <View style={s.statQuick}>
          <Text style={[s.statQuickNumber, { color: T.green }]}>{workers.filter(w => w.status === 'active').length}</Text>
          <Text style={s.statQuickLabel}>Active</Text>
        </View>
        <View style={s.statQuick}>
          <Text style={[s.statQuickNumber, { color: T.amber }]}>{workers.reduce((sum, w) => sum + (w.pending || 0), 0)}</Text>
          <Text style={s.statQuickLabel}>Total Pending</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={s.filtersContainer}>
        <CompactSelect
          label="District"
          value={filterDistrict}
          options={['ALL', ...TN_DISTRICTS]}
          onChange={setFilterDistrict}
        />
      </View>

      <View style={s.activeFilters}>
        <Text style={s.activeFilterText}>District: {filterDistrict === 'ALL' ? 'All' : filterDistrict}</Text>
      </View>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="🔍 Search by name, email, category, thokuthi..."
          placeholderTextColor={T.textM}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Action Bar */}
      <View style={s.actionBar}>
        <Text style={s.resultsText}>
          Showing {filtered.length} worker{filtered.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity style={s.downloadBtn} onPress={() => setExportOpen(true)}>
          <Text style={s.downloadBtnText}>Download</Text>
        </TouchableOpacity>
      </View>

      {/* Workers List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderWorkerCard}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>👤</Text>
            <Text style={s.emptyTxt}>No workers found</Text>
            <Text style={s.emptySubTxt}>Try adjusting your filters</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} />}
        contentContainerStyle={s.listContent}
        scrollEnabled={true}
      />

      {/* Worker Detail Modal */}
      {selectedWorker && (
        <Modal
          visible={!!selectedWorker}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedWorker(null)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modal}>
              {/* Modal Header */}
              <View style={s.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedWorker(null)}>
                  <Text style={s.modalCloseBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
                {/* Avatar */}
                <View style={s.modalAvatar}>
                  <Text style={s.modalAvatarText}>{(selectedWorker.name || 'W')[0].toUpperCase()}</Text>
                </View>

                {/* Name and Category */}
                <Text style={s.modalName}>{selectedWorker.name}</Text>
                <Text style={s.modalCategory}>{selectedWorker.workCategory || 'Worker'}</Text>

                {/* Status Badge */}
                <View style={[s.modalStatusBadge, { backgroundColor: selectedWorker.status === 'active' ? '#dcfce7' : '#f3f4f6' }]}>
                  <Text style={[s.modalStatusText, { color: selectedWorker.status === 'active' ? '#166534' : '#6b7280' }]}>
                    {selectedWorker.status === 'active' ? '✓ Active' : '○ Inactive'}
                  </Text>
                </View>

                {/* Contact Info */}
                <View style={s.modalSection}>
                  <Text style={s.modalSectionTitle}>📞 Contact Information</Text>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>Email:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.email || 'N/A'}</Text>
                  </View>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>Phone:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.phone || 'N/A'}</Text>
                  </View>
                </View>

                {/* Location Info */}
                <View style={s.modalSection}>
                  <Text style={s.modalSectionTitle}>📍 Location</Text>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>Thokuthi:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.thokuthi || 'N/A'}</Text>
                  </View>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>Ward No:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.wardNo || 'N/A'}</Text>
                  </View>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>District:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.district || 'N/A'}</Text>
                  </View>
                  <View style={s.modalRow}>
                    <Text style={s.modalRowLabel}>Pincode:</Text>
                    <Text style={s.modalRowValue}>{selectedWorker.pincode || 'N/A'}</Text>
                  </View>
                </View>

                {/* Performance */}
                <View style={s.modalSection}>
                  <Text style={s.modalSectionTitle}>📊 Performance</Text>
                  <View style={s.performanceGrid}>
                    <View style={s.performanceBox}>
                      <Text style={[s.performanceNumber, { color: T.green }]}>{selectedWorker.resolved || 0}</Text>
                      <Text style={s.performanceLabel}>Resolved</Text>
                    </View>
                    <View style={s.performanceBox}>
                      <Text style={[s.performanceNumber, { color: T.amber }]}>{selectedWorker.pending || 0}</Text>
                      <Text style={s.performanceLabel}>Pending</Text>
                    </View>
                    {selectedWorker.resolved && (
                      <View style={s.performanceBox}>
                        <Text style={[s.performanceNumber, { color: T.maroon }]}>
                          {selectedWorker.resolved + selectedWorker.pending > 0 ? Math.round((selectedWorker.resolved / (selectedWorker.resolved + selectedWorker.pending)) * 100) : 0}%
                        </Text>
                        <Text style={s.performanceLabel}>Resolution</Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={exportOpen} transparent animationType="fade" onRequestClose={() => setExportOpen(false)}>
        <View style={s.exportOverlay}>
          <View style={s.exportSheet}>
            <View style={s.exportHeader}>
              <Text style={s.exportTitle}>Download workers</Text>
              <TouchableOpacity onPress={() => setExportOpen(false)} style={s.exportClose}>
                <Text style={s.exportCloseTxt}>x</Text>
              </TouchableOpacity>
            </View>
            {[
              { key: 'csv', title: 'CSV file', sub: 'For simple data import' },
              { key: 'excel', title: 'Excel sheet', sub: 'Opens in Microsoft Excel' },
              { key: 'pdf', title: 'PDF report', sub: 'Printable worker summary' },
            ].map((item) => (
              <TouchableOpacity key={item.key} style={s.exportOption} onPress={() => handleExport(item.key)}>
                <View>
                  <Text style={s.exportOptionTitle}>{item.title}</Text>
                  <Text style={s.exportOptionSub}>{item.sub}</Text>
                </View>
                <Text style={s.exportArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

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

  header:     { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: 16, paddingHorizontal: 16 },
  backBtn:    { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 42, left: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backTxt:    { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerTitle:{ fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4, textAlign: 'center' },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  quickStats:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  statQuick:   { flex: 1, paddingVertical: 10, backgroundColor: T.bg, borderRadius: 10, alignItems: 'center' },
  statQuickNumber:{ fontSize: 16, fontWeight: '900', color: T.maroon },
  statQuickLabel: { fontSize: 9, color: T.textM, marginTop: 2, fontWeight: '600' },

  filtersContainer:{ backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row' },
  activeFilters:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  activeFilterText: { fontSize: 11, fontWeight: '700', color: T.maroon, backgroundColor: T.maroon + '12', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },

  searchContainer:{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  searchInput:   { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: T.text },

  actionBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border },
  resultsText:   { fontSize: 12, color: T.textL, fontWeight: '600' },
  downloadBtn:   { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.maroon, borderRadius: 8 },
  downloadBtnText:{ fontSize: 11, color: '#fff', fontWeight: '700' },

  listContent:{ paddingHorizontal: 10, paddingVertical: 10 },
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:         { width: 40, height: 40, borderRadius: 10, backgroundColor: T.maroon + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 18, fontWeight: '900', color: T.maroon },
  workerName:     { fontSize: 13, fontWeight: '700', color: T.text },
  categoryTag:    { fontSize: 10, color: T.textM, marginTop: 2, fontWeight: '600' },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText:     { fontSize: 10, fontWeight: '700' },

  locationInfo:   { flexDirection: 'row', gap: 6, marginBottom: 8 },
  infoChip:       { fontSize: 9, backgroundColor: T.bg, color: T.textM, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },

  statsContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox:        { flex: 1, backgroundColor: T.bg, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  statNumber:     { fontSize: 14, fontWeight: '900' },
  statLabel:      { fontSize: 8, color: T.textM, marginTop: 1, fontWeight: '600' },

  progressContainer:{ marginBottom: 8 },
  progressBar:    { height: 5, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: T.maroon, borderRadius: 3 },
  progressText:   { fontSize: 9, color: T.textM, marginTop: 4, fontWeight: '600' },

  contactRow:     { paddingTop: 8, borderTopWidth: 1, borderTopColor: T.border, gap: 6 },
  contactText:    { fontSize: 9, color: T.textL, fontWeight: '600' },

  empty:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTxt:  { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 4 },
  emptySubTxt:{ fontSize: 12, color: T.textM },

  // Modal Styles
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  modalCloseBtn:  { fontSize: 20, fontWeight: '700', color: T.textM, width: 30, height: 30, textAlign: 'center' },
  modalContent:   { gap: 12 },
  modalAvatar:    { width: 60, height: 60, borderRadius: 30, backgroundColor: T.maroon + '20', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  modalAvatarText:{ fontSize: 28, fontWeight: '900', color: T.maroon },
  modalName:      { fontSize: 16, fontWeight: '900', color: T.text, textAlign: 'center', marginBottom: 4 },
  modalCategory:  { fontSize: 12, color: T.textM, textAlign: 'center', fontWeight: '600', marginBottom: 12 },
  modalStatusBadge:{ alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  modalStatusText:{ fontSize: 11, fontWeight: '700' },
  modalSection:   { paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border },
  modalSectionTitle:{ fontSize: 13, fontWeight: '800', color: T.text, marginBottom: 8 },
  modalRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  modalRowLabel:  { fontSize: 11, color: T.textM, fontWeight: '600' },
  modalRowValue:  { fontSize: 11, color: T.text, fontWeight: '700' },
  performanceGrid:{ flexDirection: 'row', gap: 8, marginTop: 8 },
  performanceBox: { flex: 1, backgroundColor: T.bg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  performanceNumber:{ fontSize: 16, fontWeight: '900' },
  performanceLabel:{ fontSize: 10, color: T.textM, marginTop: 4, fontWeight: '600' },

  exportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  exportSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 18 },
  exportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  exportTitle: { fontSize: 16, fontWeight: '900', color: T.text },
  exportClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  exportCloseTxt: { fontSize: 15, fontWeight: '900', color: T.textL },
  exportOption: { minHeight: 58, borderRadius: 14, backgroundColor: T.bg, paddingHorizontal: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exportOptionTitle: { fontSize: 14, fontWeight: '900', color: T.text },
  exportOptionSub: { fontSize: 11, color: T.textM, marginTop: 2, fontWeight: '600' },
  exportArrow: { fontSize: 22, color: T.maroon, fontWeight: '900' },
});
