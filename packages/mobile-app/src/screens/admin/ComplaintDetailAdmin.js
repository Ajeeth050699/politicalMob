import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Image, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { complaintAPI, workerAPI } from '../../services/api';
import { T } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

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

// ── Full screen image viewer ────────────────────────────────────────
function ImageViewer({ visible, uri, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.95)', alignItems:'center', justifyContent:'center' }}>
        <TouchableOpacity style={{ position:'absolute', top:50, right:20, zIndex:10 }} onPress={onClose}>
          <View style={{ width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color:'#fff', fontSize:18, fontWeight:'700' }}>×</Text>
          </View>
        </TouchableOpacity>
        {uri && <Image source={{ uri }} style={{ width:width-32, height:height*0.7, resizeMode:'contain', borderRadius:12 }} />}
      </View>
    </Modal>
  );
}

export default function ComplaintDetailAdmin({ route, navigation }) {
  const { id } = route.params;
  const [complaint,     setComplaint]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [viewerUri,     setViewerUri]     = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [workers,       setWorkers]       = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assigning,     setAssigning]     = useState(false);
  const [assignError,   setAssignError]   = useState('');

  useEffect(() => {
    complaintAPI.getById(id)
      .then(async ({ data }) => {
        setComplaint(data);
        setSelectedWorkerId(data.assignedWorkerId ? String(data.assignedWorkerId) : '');
        const workersRes = await workerAPI.getAll({
          ...(data.district && { district: data.district }),
        });
        setWorkers((workersRes.data || []).filter((w) => w.status === 'active'));
      })
      .catch(() => {
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [id, navigation]);

  const handleAssignWorker = async () => {
    if (!selectedWorkerId || assigning || complaint.status === 'COMPLETED') return;
    setAssigning(true);
    setAssignError('');
    try {
      const { data } = await complaintAPI.updateStatus(id, {
        assignedWorker: selectedWorkerId,
        status: complaint.status === 'NEW' ? 'ACCEPTED' : complaint.status,
      });
      setComplaint(data);
      setSelectedWorkerId(data.assignedWorkerId ? String(data.assignedWorkerId) : selectedWorkerId);
    } catch (err) {
      setAssignError(err?.response?.data?.message || 'Failed to assign worker.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color:T.textM, marginTop:10 }}>Loading complaint details...</Text>
    </View>
  );
  if (!complaint) return null;

  const sc = complaint?.status ? (STATUS_COLORS[complaint.status] || { bg:'#f3f4f6', color:'#6b7280', icon:'❔', label:'Unknown' }) : { bg:'#f3f4f6', color:'#6b7280', icon:'❔', label:'Unknown' };
  const catIcon = CATEGORY_ICONS[complaint.category] || '📝';
  const attachments = complaint.attachments || [];
  const isResolved = complaint.status === 'COMPLETED';
  const workerAccepted = !!complaint.assignedWorker;

  const validDate = complaint.time || complaint.createdAt;
  const dateString = validDate ? new Date(validDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : 'Not provided';

  const detailRows = [
    { label:'Category',       value:complaint.category,                                    icon:'🏷️' },
    { label:'Description',    value:complaint.description || 'No description provided',     icon:'📝' },
    { label:'Thokuthi',          value:complaint.thokuthi,                                        icon:'🏠' },
    { label:'Ward',           value:complaint.ward,                                         icon:'🗳️' },
    { label:'Ward Number',    value:complaint.wardNo || 'N/A',                             icon:'🔢' },
    { label:'District',       value:complaint.district,                                     icon:'📍' },
    { label:'Pincode',        value:complaint.pincode || 'Not provided',                    icon:'📮' },
    { label:'Address',        value:complaint.address || 'Not provided',                    icon:'📌' },
    { label:'Submitted By',   value:complaint.user || 'Unknown',                           icon:'👤' },
    { label:'Contact Phone',  value:complaint.userPhone || 'Not provided',                 icon:'📞' },
    { label:'Date Submitted', value:dateString, icon:'📅' },
  ];

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={s.catIconBox}>
            <Text style={{ fontSize:36 }}>{catIcon}</Text>
          </View>
          <Text style={s.catTitle}>{complaint.category}</Text>
          
          <View style={s.badgeRow}>
            <View style={[s.statusBadge, { backgroundColor:sc.bg }]}>
              <Text style={{ fontSize:14 }}>{sc.icon}</Text>
              <Text style={[s.statusTxt, { color:sc.color }]}>{sc.label}</Text>
            </View>
            <View style={[s.priorityBadge, { backgroundColor:'rgba(255,255,255,0.2)' }]}>
              <Text style={s.priorityTxt}>{(complaint.priority||'medium').toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Status Timeline ── */}
        <View style={s.timeline}>
          {['NEW','ACCEPTED','IN PROGRESS','COMPLETED'].map((step,i) => {
            const isActive = complaint.status === step;
            const isDone   = ['NEW','ACCEPTED','IN PROGRESS','COMPLETED'].indexOf(complaint.status) > i;
            return (
              <React.Fragment key={step}>
                <View style={s.timelineStep}>
                  <View style={[s.timelineDot, isActive && { backgroundColor:T.maroon, borderColor:T.maroon }, isDone && { backgroundColor:T.green, borderColor:T.green }]}>
                    <Text style={{ fontSize:10, color:(isActive||isDone)?'#fff':T.textM }}>{isDone?'✓':i+1}</Text>
                  </View>
                  <Text style={[s.timelineLabel, (isActive||isDone) && { color:T.text, fontWeight:'700' }]}>
                    {step==='IN PROGRESS'?'Progress':step.charAt(0)+step.slice(1).toLowerCase()}
                  </Text>
                </View>
                {i<2 && <View style={[s.timelineLine, isDone && { backgroundColor:T.green }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Worker Assignment Card ── */}
        <View style={s.workerCard}>
          <View style={s.workerHeader}>
            <Text style={s.workerTitle}>👷 Worker Assignment</Text>
            <View style={[s.workerBadge, { backgroundColor: workerAccepted ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[s.workerBadgeText, { color: workerAccepted ? '#166534' : '#991b1b' }]}>
                {workerAccepted ? '✓ Accepted' : '⏳ Not Accepted'}
              </Text>
            </View>
          </View>
          
          <View style={s.workerInfo}>
            {workerAccepted ? (
              <>
                <Text style={s.workerName}>{complaint.assignedWorker}</Text>
                <Text style={s.workerDetail}>Status: {complaint.status}</Text>
                {complaint.acceptedAt && (
                  <Text style={s.workerDetail}>
                    Accepted on: {new Date(complaint.acceptedAt).toLocaleDateString('en-IN')}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={s.noWorkerText}>No worker has accepted this complaint yet</Text>
                <Text style={s.noWorkerSubText}>System is searching for available workers...</Text>
              </>
            )}
          </View>

          {!isResolved && (
            <View style={s.assignBox}>
              <Text style={s.assignLabel}>Assign active worker</Text>
              <View style={s.assignPickerWrap}>
                <Picker
                  selectedValue={selectedWorkerId}
                  onValueChange={setSelectedWorkerId}
                  style={s.assignPicker}
                >
                  <Picker.Item label="Select worker" value="" />
                  {workers.map((w) => (
                    <Picker.Item
                      key={w.id}
                      label={`${w.name} - ${w.thokuthi || w.district || 'Field worker'}`}
                      value={String(w.id)}
                    />
                  ))}
                </Picker>
              </View>
              {!!assignError && <Text style={s.assignError}>{assignError}</Text>}
              <TouchableOpacity
                style={[s.assignBtn, (!selectedWorkerId || assigning) && s.assignBtnDisabled]}
                onPress={handleAssignWorker}
                disabled={!selectedWorkerId || assigning}
                activeOpacity={0.85}
              >
                <Text style={s.assignBtnText}>{assigning ? 'Assigning...' : 'Assign Task'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isResolved && (
            <View style={s.resolvedBanner}>
              <Text style={s.resolvedText}>✅ This complaint has been resolved</Text>
            </View>
          )}
        </View>

        {/* ── Details Section ── */}
        <View style={s.body}>
          <Text style={s.sectionTitle}>📋 Complaint Details</Text>
          
          {detailRows.map(({ label, value, icon, onPress }) => {
            const RowView = onPress ? TouchableOpacity : View;
            return (
              <RowView key={label} style={s.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
                <View style={s.rowIcon}><Text style={{ fontSize:18 }}>{icon}</Text></View>
                <View style={{ flex:1 }}>
                  <Text style={s.rowLabel}>{label}</Text>
                  <Text style={[s.rowValue, onPress && { color: T.maroon, fontWeight: '700' }]}>{value}</Text>
                </View>
              </RowView>
            );
          })}

          {/* ── ATTACHMENTS SECTION ── */}
          {attachments.length > 0 && (
            <View style={s.attachSection}>
              <View style={s.attachHeader}>
                <Text style={s.attachTitle}>📎 Proof Attachments ({attachments.length})</Text>
              </View>

              <View style={s.attachGrid}>
                {attachments.map((att, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.attachCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setViewerUri(att.url);
                      setViewerVisible(true);
                    }}
                  >
                    {att.type === 'image' ? (
                      <>
                        <Image source={{ uri:att.url }} style={s.attachImg} resizeMode="cover" />
                        <View style={s.attachOverlay}>
                          <Text style={{ fontSize:16 }}>🔍</Text>
                        </View>
                      </>
                    ) : (
                      <View style={[s.attachImg, s.videoPlaceholder]}>
                        <Text style={{ fontSize:32 }}>🎥</Text>
                      </View>
                    )}
                    <View style={[s.attachTypeBadge, { backgroundColor:att.type==='video'?T.blue:T.green }]}>
                      <Text style={s.attachTypeTxt}>{att.type==='video'?'VIDEO':'PHOTO'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {attachments.length === 0 && (
            <View style={s.noAttachments}>
              <Text style={s.noAttachmentsText}>📭 No attachments provided</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer 
        visible={viewerVisible}
        uri={viewerUri}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:     { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 16 },
  backBtn:    { marginBottom: 12 },
  backTxt:    { fontSize: 14, color: '#fff', fontWeight: '700' },
  catIconBox: { width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  catTitle:   { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 14 },
  badgeRow:   { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  statusBadge:{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  statusTxt:  { fontSize: 11, fontWeight: '700', marginTop: 2 },
  priorityBadge:{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  priorityTxt:{ fontSize: 11, fontWeight: '700', color: '#fff' },

  timeline:      { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 20, justifyContent: 'space-around', alignItems: 'center' },
  timelineStep:  { alignItems: 'center' },
  timelineDot:   { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: T.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  timelineLabel: { fontSize: 10, color: T.textM, fontWeight: '600' },
  timelineLine:  { flex: 1, height: 2, backgroundColor: T.border, marginHorizontal: 8 },

  workerCard:   { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  workerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  workerTitle:  { fontSize: 14, fontWeight: '700', color: T.text },
  workerBadge:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  workerBadgeText:{ fontSize: 11, fontWeight: '700' },
  workerInfo:   { gap: 8 },
  workerName:   { fontSize: 15, fontWeight: '700', color: T.maroon },
  workerDetail: { fontSize: 12, color: T.textL },
  noWorkerText: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  noWorkerSubText:{ fontSize: 12, color: T.textM, marginTop: 4 },
  assignBox:    { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: T.border },
  assignLabel:  { fontSize: 12, fontWeight: '700', color: T.textL, marginBottom: 8 },
  assignPickerWrap:{ borderWidth: 1, borderColor: T.border, borderRadius: 10, backgroundColor: T.bg, overflow: 'hidden', marginBottom: 10 },
  assignPicker: { height: 44 },
  assignError:  { fontSize: 12, color: T.red, marginBottom: 8, fontWeight: '600' },
  assignBtn:    { backgroundColor: T.maroon, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  assignBtnDisabled:{ opacity: 0.55 },
  assignBtnText:{ color: '#fff', fontSize: 13, fontWeight: '800' },
  resolvedBanner:{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#dcfce7', borderRadius: 8 },
  resolvedText: { fontSize: 12, fontWeight: '700', color: '#166534' },

  body:          { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: T.text, marginBottom: 8 },
  row:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  rowIcon:       { width: 36, height: 36, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowLabel:      { fontSize: 11, color: T.textM, fontWeight: '600', marginBottom: 3 },
  rowValue:      { fontSize: 13, color: T.text, fontWeight: '600', lineHeight: 18 },

  attachSection:  { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: T.border },
  attachHeader:   { marginBottom: 12 },
  attachTitle:    { fontSize: 14, fontWeight: '800', color: T.text },
  attachGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  attachCard:     { width: '48%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  attachImg:      { width: '100%', height: 120, backgroundColor: T.bg },
  attachOverlay:  { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  videoPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  attachTypeBadge:{ position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  attachTypeTxt:  { fontSize: 8, fontWeight: '700', color: '#fff' },

  noAttachments:  { marginTop: 16, paddingHorizontal: 12, paddingVertical: 20, backgroundColor: T.bg, borderRadius: 12, alignItems: 'center' },
  noAttachmentsText:{ fontSize: 13, color: T.textM, fontWeight: '600' },
});
