import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, StatusBar, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import PopupToast from '../../components/PopupToast';

const CATEGORY_ICONS = {
  'Street Light Problem':'💡', 'Road Damage':'🛣️', 'Garbage Issue':'🗑️',
  'Water Supply Problem':'💧', 'Drainage Issue':'🚰', 'Public Safety Issue':'🚨', 'Others':'📝',
};

const STATUS_META = {
  'NEW':         { color:'#f59e0b', bg:'#fef3c7', icon:'🆕', label:'New'         },
  'ACCEPTED':    { color:'#3b82f6', bg:'#dbeafe', icon:'✅', label:'Accepted'     },
  'IN PROGRESS': { color:'#8b5cf6', bg:'#ede9fe', icon:'⚙️', label:'In Progress'  },
  'COMPLETED':   { color:'#22c55e', bg:'#dcfce7', icon:'🎉', label:'Completed'    },
};

// ── Confirm Accept Modal ────────────────────────────────────────────
function AcceptModal({ visible, complaint, onConfirm, onCancel, loading }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={m.overlay}>
        <View style={m.card}>
          <Text style={{ fontSize:44, marginBottom:14 }}>🤝</Text>
          <Text style={m.title}>Accept Complaint?</Text>
          <Text style={m.desc}>
            Once you accept, this complaint will be locked to you.{'\n'}
            Other agents cannot work on it.
          </Text>
          {complaint && (
            <View style={m.info}>
              <Text style={m.infoTxt}>📋 {complaint.category}</Text>
              <Text style={m.infoTxt}>🏠 {complaint.booth} · 📍 {complaint.district}</Text>
              <Text style={m.infoTxt}>👤 {complaint.user}</Text>
            </View>
          )}
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={m.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.acceptBtn} onPress={onConfirm} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={[T.maroon, T.maroonL]} style={m.acceptGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={m.acceptTxt}>✅ Accept</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AssignedComplaints({ navigation }) {
  const { t }                 = useTranslation();
  const { userInfo }          = useAuth();
  const [complaints,  setComplaints]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [updating,    setUpdating]    = useState(null);
  const [filter,      setFilter]      = useState('ALL');
  const [acceptModal, setAcceptModal] = useState(null); // complaint object
  const [accepting,   setAccepting]   = useState(false);
  const [toast,       setToast]       = useState({ visible:false, message:'', type:'error' });

  const showToast = (msg, type='error') => setToast({ visible:true, message:msg, type });

  const load = async () => {
    try {
      const { data } = await complaintAPI.getAll();
      setComplaints(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ── Accept complaint ─────────────────────────────────────────────
  const handleAccept = async () => {
    if (!acceptModal) return;
    setAccepting(true);
    try {
      await complaintAPI.accept(acceptModal.id);
      setComplaints(prev => prev.map(c =>
        c.id === acceptModal.id
          ? { ...c, status:'ACCEPTED', assignedWorker:userInfo?.name, lockedToAgent:true }
          : c
      ));
      setAcceptModal(null);
      showToast('Complaint accepted! It is now locked to you.', 'success');
    } catch (err) {
      setAcceptModal(null);
      showToast(err?.response?.data?.message || 'Someone else accepted this complaint first.');
    } finally { setAccepting(false); }
  };

  // ── Update status ────────────────────────────────────────────────
  const handleUpdateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await complaintAPI.updateStatus(id, { status });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      showToast(`Status updated to ${status}`, 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update status.');
    } finally { setUpdating(null); }
  };

  const filtered = filter === 'ALL'
    ? complaints
    : complaints.filter(c => c.status === filter);

  const counts = {
    NEW:         complaints.filter(c => c.status === 'NEW').length,
    ACCEPTED:    complaints.filter(c => c.status === 'ACCEPTED').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN PROGRESS').length,
    COMPLETED:   complaints.filter(c => c.status === 'COMPLETED').length,
  };

  const renderItem = ({ item: c }) => {
    const sm         = STATUS_META[c.status] || STATUS_META['NEW'];
    const catIcon    = CATEGORY_ICONS[c.category] || '📝';
    const isUpdating = updating === c.id;
    const isMyComplaint = c.assignedWorkerId === userInfo?._id ||
                          c.assignedWorker === userInfo?.name;
    const isLocked  = c.lockedToAgent && !isMyComplaint;

    return (
      <TouchableOpacity
        style={[s.card, isLocked && s.cardLocked]}
        onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
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

        {/* Meta */}
        <View style={s.metaRow}>
          <Text style={s.metaChip}>📍 {c.district}</Text>
          {c.pincode && <Text style={s.metaChip}>📮 {c.pincode}</Text>}
          <Text style={s.metaChip}>📅 {new Date(c.time).toLocaleDateString('en-IN')}</Text>
          {c.fallbackUsed && <Text style={[s.metaChip, { backgroundColor:'#fef3c7', borderColor:'#f59e0b' }]}>🔄 Fallback</Text>}
          {c.escalatedToAdmin && <Text style={[s.metaChip, { backgroundColor:'#fee2e2', borderColor:T.red }]}>⚠️ Escalated</Text>}
        </View>

        {/* Locked by another agent */}
        {isLocked && (
          <View style={s.lockedBanner}>
            <Text style={s.lockedTxt}>🔒 Accepted by {c.assignedWorker} — view only</Text>
          </View>
        )}

        {/* Actions */}
        {!isLocked && (
          <View style={s.actions}>
            {/* NEW → show Accept button */}
            {c.status === 'NEW' && (
              <TouchableOpacity
                style={s.acceptBtn}
                onPress={() => setAcceptModal(c)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[T.maroon, T.maroonL]} style={s.acceptBtnGrad}>
                  <Text style={s.acceptBtnTxt}>🤝 Accept Complaint</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* ACCEPTED / IN PROGRESS → show progress buttons */}
            {(c.status === 'ACCEPTED' || c.status === 'IN PROGRESS') && isMyComplaint && (
              <View style={s.progressBtns}>
                {c.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={[s.progBtn, { borderColor:'#8b5cf6' }]}
                    onPress={() => handleUpdateStatus(c.id, 'IN PROGRESS')}
                    disabled={isUpdating}
                    activeOpacity={0.85}
                  >
                    {isUpdating
                      ? <ActivityIndicator color="#8b5cf6" size="small" />
                      : <Text style={[s.progBtnTxt, { color:'#8b5cf6' }]}>⚙️ Start Work</Text>
                    }
                  </TouchableOpacity>
                )}
                {c.status === 'IN PROGRESS' && (
                  <TouchableOpacity
                    style={[s.progBtn, { borderColor:T.green }]}
                    onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.progBtnTxt, { color:T.green }]}>📸 Upload Proof & Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* COMPLETED */}
            {c.status === 'COMPLETED' && (
              <View style={s.completedBanner}>
                <Text style={s.completedTxt}>🎉 Resolved · Tap to view proof</Text>
              </View>
            )}
          </View>
        )}
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
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t=>({...t,visible:false}))} />

      {/* Header */}
      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <Text style={s.headerTitle}>Complaints</Text>
        <Text style={s.headerSub}>Your booth area complaints</Text>
        <View style={s.statsRow}>
          {[
            { label:'New',      count:counts.NEW,         color:'#fca5a5' },
            { label:'Accepted', count:counts.ACCEPTED,    color:'#93c5fd' },
            { label:'Working',  count:counts.IN_PROGRESS, color:'#c4b5fd' },
            { label:'Done',     count:counts.COMPLETED,   color:'#86efac' },
          ].map(({ label, count, color }) => (
            <View key={label} style={s.statCard}>
              <Text style={[s.statNum, { color }]}>{count}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Filter */}
      <View style={s.filterRow}>
        {['ALL','NEW','ACCEPTED','IN PROGRESS','COMPLETED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.chip, filter===f && s.chipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, filter===f && { color:'#fff' }]}>
              {f==='ALL'?'All':f==='IN PROGRESS'?'Working':f.charAt(0)+f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={c => c.id?.toString()}
        contentContainerStyle={{ padding:16, paddingBottom:32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.maroon} colors={[T.maroon]} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize:52, marginBottom:14 }}>📋</Text>
            <Text style={s.emptyTitle}>No complaints found</Text>
            <Text style={s.emptySub}>
              {filter==='ALL' ? 'Complaints in your booth will appear here' : `No ${filter.toLowerCase()} complaints`}
            </Text>
          </View>
        }
      />

      {/* Accept confirm modal */}
      <AcceptModal
        visible={!!acceptModal}
        complaint={acceptModal}
        onConfirm={handleAccept}
        onCancel={() => setAcceptModal(null)}
        loading={accepting}
      />
    </View>
  );
}

const m = StyleSheet.create({
  overlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'center', alignItems:'center', padding:24 },
  card:      { backgroundColor:'#fff', borderRadius:24, padding:28, width:'100%', alignItems:'center', elevation:20, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:20 },
  title:     { fontSize:20, fontWeight:'800', color:T.text, marginBottom:10 },
  desc:      { fontSize:14, color:T.textL, textAlign:'center', lineHeight:21, marginBottom:16 },
  info:      { backgroundColor:T.bg, borderRadius:14, padding:14, width:'100%', marginBottom:20, gap:6 },
  infoTxt:   { fontSize:13, color:T.text, fontWeight:'600' },
  btnRow:    { flexDirection:'row', gap:12, width:'100%' },
  cancelBtn: { flex:1, paddingVertical:14, borderRadius:50, borderWidth:2, borderColor:T.border, alignItems:'center' },
  cancelTxt: { fontSize:14, fontWeight:'700', color:T.textL },
  acceptBtn: { flex:1, borderRadius:50, overflow:'hidden' },
  acceptGrad:{ paddingVertical:14, alignItems:'center' },
  acceptTxt: { fontSize:14, fontWeight:'800', color:'#fff' },
});

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:T.bg },
  center: { flex:1, justifyContent:'center', alignItems:'center' },

  header:      { paddingTop:Platform.OS==='ios'?52:40, paddingBottom:20, paddingHorizontal:20 },
  headerTitle: { fontSize:24, fontWeight:'900', color:'#fff' },
  headerSub:   { fontSize:13, color:'rgba(255,255,255,0.75)', marginTop:4, marginBottom:16 },
  statsRow:    { flexDirection:'row', gap:8 },
  statCard:    { flex:1, backgroundColor:'rgba(255,255,255,0.13)', borderRadius:12, padding:10, alignItems:'center' },
  statNum:     { fontSize:18, fontWeight:'900' },
  statLabel:   { fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2, fontWeight:'600' },

  filterRow:  { flexDirection:'row', paddingHorizontal:12, paddingVertical:10, gap:6, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:T.border },
  chip:       { paddingHorizontal:12, paddingVertical:6, borderRadius:50, borderWidth:1.5, borderColor:T.border, backgroundColor:T.bg },
  chipActive: { backgroundColor:T.maroon, borderColor:T.maroon },
  chipTxt:    { fontSize:11, fontWeight:'700', color:T.textL },

  card:        { backgroundColor:'#fff', borderRadius:18, padding:16, marginBottom:12, borderWidth:1, borderColor:T.border, elevation:3, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:10 },
  cardLocked:  { opacity:0.7, borderStyle:'dashed' },
  cardHeader:  { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  catIconBox:  { width:46, height:46, borderRadius:14, alignItems:'center', justifyContent:'center' },
  catTxt:      { fontSize:15, fontWeight:'700', color:T.text },
  metaTxt:     { fontSize:12, color:T.textM, marginTop:3 },
  statusBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:50 },
  statusTxt:   { fontSize:11, fontWeight:'700' },
  metaRow:     { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  metaChip:    { fontSize:11, color:T.textL, backgroundColor:T.bg, paddingHorizontal:10, paddingVertical:4, borderRadius:50, borderWidth:1, borderColor:T.border },

  lockedBanner:  { backgroundColor:'#f3f4f6', borderRadius:10, padding:10, marginBottom:4, alignItems:'center' },
  lockedTxt:     { fontSize:12, color:T.textM, fontWeight:'600' },

  actions: { marginTop:4 },

  acceptBtn:     { borderRadius:50, overflow:'hidden', elevation:3, shadowColor:T.maroon, shadowOpacity:0.3, shadowRadius:8 },
  acceptBtnGrad: { paddingVertical:13, alignItems:'center' },
  acceptBtnTxt:  { fontSize:14, fontWeight:'800', color:'#fff' },

  progressBtns:  { flexDirection:'row', gap:8 },
  progBtn:       { flex:1, paddingVertical:11, borderRadius:50, borderWidth:2, alignItems:'center', justifyContent:'center' },
  progBtnTxt:    { fontSize:13, fontWeight:'700' },

  completedBanner: { backgroundColor:'#dcfce7', borderRadius:10, padding:10, alignItems:'center', borderWidth:1, borderColor:'#22c55e40' },
  completedTxt:    { fontSize:12, color:'#15803d', fontWeight:'700' },

  empty:      { alignItems:'center', paddingVertical:60 },
  emptyTitle: { fontSize:20, fontWeight:'800', color:T.text, marginBottom:8 },
  emptySub:   { fontSize:14, color:T.textM, textAlign:'center' },
});