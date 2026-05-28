import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, StatusBar, Image, Modal,
  Dimensions, Linking, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { complaintAPI } from '../../services/api';
import { T, PRIORITY_COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { goBackOrHome } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

const CATEGORY_ICONS = {
  'Street Light Problem':'💡', 'Road Damage':'🛣️', 'Garbage Issue':'🗑️',
  'Water Supply Problem':'💧', 'Drainage Issue':'🚰', 'Public Safety Issue':'🚨', 'Others':'📝',
};
const STATUS_ICONS = { 'NEW':'🆕', 'ACCEPTED':'✅', 'IN PROGRESS':'⚙️', 'COMPLETED':'✅' };

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

export default function ComplaintDetail({ route, navigation }) {
  const { userInfo } = useAuth();
  const { id } = route.params;
  const [complaint,    setComplaint]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [viewerUri,    setViewerUri]    = useState(null);
  const [viewerVisible,setViewerVisible]= useState(false);
  
  // Modals state
  const [rejectModal, setRejectModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [reasonText, setReasonText]   = useState('');

  useEffect(() => {
    complaintAPI.getById(id)
      .then(({ data }) => setComplaint(data))
      .catch(() => goBackOrHome(navigation, userInfo?.role === 'worker' ? 'Complaints' : 'Home'))
      .finally(() => setLoading(false));
  }, [id, navigation, userInfo?.role]);

  const handleReject = async () => {
    if (!reasonText.trim()) return;
    setUploading(true);
    try {
      const { data } = await complaintAPI.reject(id, { reason: reasonText });
      setComplaint(data);
      setRejectModal(false);
      setReasonText('');
    } catch (_err) {
      // handle error if needed
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async () => {
    if (!reasonText.trim()) return;
    setUploading(true);
    try {
      const { data } = await complaintAPI.revoke(id, { reason: reasonText });
      setComplaint(data);
      setRevokeModal(false);
      setReasonText('');
    } catch (_err) {
      // handle error if needed
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={T.maroon} size="large" /><Text style={{ color:T.textM, marginTop:10 }}>Loading...</Text></View>
  );
  if (!complaint) return null;

  const pc       = PRIORITY_COLORS[complaint.priority] || T.amber;
  const catIcon  = CATEGORY_ICONS[complaint.category] || '📝';
  const attachments = complaint.attachments || [];
  const isAssignedWorker =
    userInfo?.role === 'worker' &&
    (complaint.assignedWorkerId === userInfo?._id || complaint.assignedWorker === userInfo?.name);

  const openMap = () => {
    if (complaint.location && complaint.location.lat && complaint.location.lng) {
      const { lat, lng } = complaint.location;
      const url = Platform.OS === 'ios' 
        ? `maps:${lat},${lng}?q=${lat},${lng}` 
        : `geo:${lat},${lng}?q=${lat},${lng}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    }
  };

  const uploadCompletionProof = async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPerm.status !== 'granted') return;

      const locationPerm = await Location.requestForegroundPermissionsAsync();
      if (locationPerm.status !== 'granted') return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(true);
      const payload = {
        photoUrl: asset.uri,
        proofLocation: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        },
      };
      const { data } = await complaintAPI.uploadProof(id, payload);
      setComplaint(data);
    } finally {
      setUploading(false);
    }
  };

  const rows = [
    { label:'Description',     value:complaint.description,                          icon:'📝' },
    { label:'Thokuthi',           value:complaint.thokuthi,                                icon:'🏠' },
    { label:'District',        value:complaint.district,                             icon:'📍' },
    { label:'Pincode',         value:complaint.pincode || 'Not provided',             icon:'📮' },
    { label:'Address',         value:complaint.address || 'Not provided',             icon:'📌' },
    { label:'GPS Location',    value:(complaint.location && complaint.location.lat && complaint.location.lng) ? `${Number(complaint.location.lat).toFixed(5)}, ${Number(complaint.location.lng).toFixed(5)}\n(Tap to view on map)` : 'Not provided', icon:'🧭', onPress: (complaint.location && complaint.location.lat && complaint.location.lng) ? openMap : null },
    { label:'Date Submitted',  value:new Date(complaint.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), icon:'📅' },
  ];

  const renderContactCard = (title, name, phone, photo, icon, role) => {
    if (!name) return null;
    return (
      <View style={s.contactCard}>
        <View style={s.contactHeader}>
          <Text style={s.contactTitle}>{title}</Text>
        </View>
        <View style={s.contactBody}>
          <View style={s.contactAvatar}>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
            ) : (
              <Text style={{ fontSize: 24 }}>{icon}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.contactName}>{name}</Text>
            <Text style={s.contactRole}>{role}</Text>
          </View>
          {!!phone && (
            <TouchableOpacity 
              style={s.callBtn} 
              onPress={() => Linking.openURL(`tel:${phone}`)}
            >
              <Text style={{ fontSize: 18 }}>📞</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
          <TouchableOpacity onPress={() => goBackOrHome(navigation, userInfo?.role === 'worker' ? 'Complaints' : 'Home')} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={s.catIconBox}>
            <Text style={{ fontSize:36 }}>{catIcon}</Text>
          </View>
          <Text style={s.catTitle}>{complaint.category}</Text>
          <View style={s.badgeRow}>
            <View style={[s.statusBadge, { backgroundColor:'rgba(255,255,255,0.2)' }]}>
              <Text style={{ fontSize:14 }}>{STATUS_ICONS[complaint.status]}</Text>
              <Text style={s.statusTxt}>{complaint.status}</Text>
            </View>
            <View style={[s.priorityBadge, { backgroundColor:pc+'30' }]}>
              <Text style={[s.priorityTxt, { color:pc }]}>{(complaint.priority||'medium').toUpperCase()} PRIORITY</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Status timeline ── */}
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
                    {step==='IN PROGRESS'?'In Progress':step==='ACCEPTED'?'Accepted':step.charAt(0)+step.slice(1).toLowerCase()}
                  </Text>
                </View>
                {i<3 && <View style={[s.timelineLine, isDone && { backgroundColor:T.green }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Details ── */}
        <View style={s.body}>
          {/* Contact Cards */}
          {(userInfo?.role === 'worker' || userInfo?.role === 'admin' || userInfo?.role === 'superadmin' || userInfo?.role === 'agent') &&
            renderContactCard('Citizen Details', complaint.user, complaint.userPhone, complaint.userProfilePhoto, '👤', 'Raised by Citizen')
          }
          {(userInfo?.role === 'public' || userInfo?.role === 'citizen' || userInfo?.role === 'admin' || userInfo?.role === 'superadmin' || userInfo?.role === 'agent') &&
            complaint.assignedWorker &&
            renderContactCard('Assigned Worker', complaint.assignedWorker, complaint.assignedWorkerPhone, complaint.assignedWorkerProfilePhoto, '👷', 'Handling this complaint')
          }

          {rows.map(({ label, value, icon, onPress }) => {
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
                <Text style={s.attachTitle}>📎 Proof Attachments</Text>
                <View style={[s.attachCount, { backgroundColor:T.maroon }]}>
                  <Text style={s.attachCountTxt}>{attachments.length}</Text>
                </View>
              </View>
              <Text style={s.attachSub}>Tap image to view full screen · Tap video link to open</Text>

              <View style={s.attachGrid}>
                {attachments.map((att, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.attachCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (att.type === 'image') {
                        setViewerUri(att.url);
                        setViewerVisible(true);
                      } else {
                        Linking.openURL(att.url).catch(() => {});
                      }
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
                        <Text style={s.videoTxt}>Video</Text>
                        <Text style={s.videoOpen}>Tap to Open</Text>
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

          {/* Proof photo by worker */}
          {complaint.proofPhoto && (
            <View style={s.proofCard}>
              <Text style={{ fontSize:24 }}>📸</Text>
              <View style={{ flex:1 }}>
                <Text style={s.proofTitle}>Resolution Proof Uploaded</Text>
                <Text style={s.proofSub}>
                  Worker has submitted proof of resolution
                  {complaint.proofLocation?.lat && complaint.proofLocation?.lng
                    ? ` at ${Number(complaint.proofLocation.lat).toFixed(5)}, ${Number(complaint.proofLocation.lng).toFixed(5)}`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setViewerUri(complaint.proofPhoto); setViewerVisible(true); }}>
                <View style={s.proofBadge}><Text style={s.proofBadgeTxt}>View</Text></View>
              </TouchableOpacity>
            </View>
          )}

          {complaint.proofVideo && (
            <View style={s.proofCard}>
              <Text style={{ fontSize:24 }}>🎥</Text>
              <View style={{ flex:1 }}>
                <Text style={s.proofTitle}>Resolution Video Uploaded</Text>
                <Text style={s.proofSub}>Worker has submitted video proof</Text>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL(complaint.proofVideo).catch(() => {})}>
                <View style={s.proofBadge}><Text style={s.proofBadgeTxt}>Open</Text></View>
              </TouchableOpacity>
            </View>
          )}

          {isAssignedWorker && complaint.status === 'IN PROGRESS' && (
            <TouchableOpacity
              style={[s.completeBtn, uploading && { opacity: 0.7 }]}
              onPress={uploadCompletionProof}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[T.maroon, T.maroonL]} style={s.completeBtnGrad}>
                <Text style={s.completeBtnTxt}>
                  {uploading ? 'Uploading proof...' : '📸 Upload Proof & Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Worker Reject Button */}
          {isAssignedWorker && (complaint.status === 'ACCEPTED' || complaint.status === 'IN PROGRESS') && (
            <TouchableOpacity
              style={[s.outlineBtn, uploading && { opacity: 0.7 }]}
              onPress={() => setRejectModal(true)}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <Text style={s.outlineBtnTxt}>❌ Reject Complaint</Text>
            </TouchableOpacity>
          )}

          {/* Citizen Revoke Button */}
          {(userInfo?.role === 'public' || userInfo?.role === 'citizen') && (complaint.status === 'NEW' || complaint.status === 'ACCEPTED') && (
            <TouchableOpacity
              style={[s.outlineBtn, uploading && { opacity: 0.7 }]}
              onPress={() => setRevokeModal(true)}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <Text style={s.outlineBtnTxt}>🗑️ Revoke Complaint</Text>
            </TouchableOpacity>
          )}

          {!complaint.assignedWorker && (
            <View style={s.infoCard}>
              <Text style={{ fontSize:20 }}>ℹ️</Text>
              <Text style={s.infoTxt}>Your complaint is pending worker assignment. A worker from your thokuthi will be assigned shortly.</Text>
            </View>
          )}
        </View>
      </ScrollView>

        {/* Full screen image viewer */}
      <ImageViewer
        visible={viewerVisible}
        uri={viewerUri}
        onClose={() => { setViewerVisible(false); setViewerUri(null); }}
      />

      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Reject Complaint</Text>
            <Text style={s.modalDesc}>Please provide a reason for rejecting this complaint. It will be reassigned.</Text>
            <View style={s.inputWrap}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>💬</Text>
              <TextInput
                style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: T.text }}
                placeholder="Enter rejection reason..."
                placeholderTextColor={T.textM}
                value={reasonText}
                onChangeText={setReasonText}
                multiline
              />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setRejectModal(false); setReasonText(''); }}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSubmitBtn, { backgroundColor: T.maroon }]} onPress={handleReject}>
                <Text style={s.modalSubmitTxt}>{uploading ? 'Wait...' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Revoke Modal */}
      <Modal visible={revokeModal} transparent animationType="slide" onRequestClose={() => setRevokeModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Revoke Complaint</Text>
            <Text style={s.modalDesc}>Are you sure you want to cancel this complaint?</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {["Resolved on its own", "Duplicate complaint", "Wrong location", "Other"].map(r => (
                <TouchableOpacity 
                  key={r} 
                  style={[s.reasonChip, reasonText === r && { backgroundColor: T.maroon, borderColor: T.maroon }]}
                  onPress={() => setReasonText(r)}
                >
                  <Text style={[s.reasonTxt, reasonText === r && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.inputWrap}>
              <TextInput
                style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: T.text }}
                placeholder="Optional explanation..."
                placeholderTextColor={T.textM}
                value={reasonText}
                onChangeText={setReasonText}
              />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setRevokeModal(false); setReasonText(''); }}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSubmitBtn, { backgroundColor: T.maroon }]} onPress={handleRevoke}>
                <Text style={s.modalSubmitTxt}>{uploading ? 'Wait...' : 'Revoke'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:T.bg },
  center: { flex:1, justifyContent:'center', alignItems:'center' },

  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 16, paddingHorizontal: 20, zIndex: 1 },
  backBtn:     { position:'absolute', top:Platform.OS==='ios'?52:40, left:16, padding:8, zIndex:10, elevation:10, width:44, height:44, justifyContent:'center', alignItems:'center' },
  backTxt:     { color:'rgba(255,255,255,0.85)', fontSize:24, fontWeight:'600', marginTop:-4 },
  catIconBox:  { width:80, height:80, borderRadius:40, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center', marginBottom:12, marginTop:8 },
  catTitle:    { fontSize:20, fontWeight:'900', color:'#fff', textAlign:'center', marginBottom:14 },
  badgeRow:    { flexDirection:'row', gap:10, flexWrap:'wrap', justifyContent:'center' },
  statusBadge: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, borderRadius:50 },
  statusTxt:   { color:'#fff', fontSize:13, fontWeight:'700' },
  priorityBadge:{ paddingHorizontal:14, paddingVertical:8, borderRadius:50 },
  priorityTxt: { fontSize:11, fontWeight:'800' },

  timeline:      { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#fff', paddingVertical:18, paddingHorizontal:20, borderBottomWidth:1, borderBottomColor:T.border },
  timelineStep:  { alignItems:'center', gap:6 },
  timelineDot:   { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:T.border, backgroundColor:T.bg, alignItems:'center', justifyContent:'center' },
  timelineLabel: { fontSize:10, color:T.textM, fontWeight:'600', textAlign:'center', maxWidth:70 },
  timelineLine:  { flex:1, height:2, backgroundColor:T.border, marginHorizontal:4, marginBottom:20 },

  body:       { padding:16 },
  row:        { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:10, flexDirection:'row', gap:14, alignItems:'flex-start', borderWidth:1, borderColor:T.border, elevation:2, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8 },
  rowIcon:    { width:40, height:40, borderRadius:12, backgroundColor:T.maroon+'10', alignItems:'center', justifyContent:'center', flexShrink:0 },
  rowLabel:   { fontSize:11, color:T.textM, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  rowValue:   { fontSize:15, color:T.text, fontWeight:'500', lineHeight:22 },

  // Contact Card
  contactCard: { backgroundColor:'#fff', borderRadius:16, marginBottom:10, borderWidth:1, borderColor:T.border, overflow:'hidden', elevation:2, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8 },
  contactHeader: { backgroundColor:T.maroon+'10', paddingHorizontal:16, paddingVertical:10, borderBottomWidth:1, borderBottomColor:T.border },
  contactTitle: { fontSize:12, fontWeight:'700', color:T.textM, textTransform:'uppercase', letterSpacing:0.5 },
  contactBody: { flexDirection:'row', alignItems:'center', padding:16, gap:14 },
  contactAvatar: { width:48, height:48, borderRadius:24, backgroundColor:T.bg, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:T.border },
  contactName: { fontSize:16, fontWeight:'700', color:T.text, marginBottom:2 },
  contactRole: { fontSize:13, color:T.textM },
  callBtn: { width:40, height:40, borderRadius:20, backgroundColor:'#dcfce7', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#16a34a40' },

  // Attachments
  attachSection: { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:10, borderWidth:1, borderColor:T.border, elevation:2, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8 },
  attachHeader:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:6 },
  attachTitle:   { fontSize:15, fontWeight:'800', color:T.text, flex:1 },
  attachCount:   { paddingHorizontal:10, paddingVertical:4, borderRadius:50 },
  attachCountTxt:{ color:'#fff', fontSize:12, fontWeight:'700' },
  attachSub:     { fontSize:12, color:T.textM, marginBottom:14 },
  attachGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10 },
  attachCard:    { width:(width-80)/3, borderRadius:14, overflow:'hidden', position:'relative', elevation:3, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:8 },
  attachImg:     { width:'100%', height:90, backgroundColor:T.bg },
  attachOverlay: { position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.2)', alignItems:'center', justifyContent:'center' },
  videoPlaceholder:{ backgroundColor:'#1e293b', alignItems:'center', justifyContent:'center' },
  videoTxt:      { color:'#fff', fontSize:12, fontWeight:'700', marginTop:4 },
  videoOpen:     { color:'rgba(255,255,255,0.6)', fontSize:10, marginTop:2 },
  attachTypeBadge:{ position:'absolute', bottom:5, left:5, paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  attachTypeTxt: { color:'#fff', fontSize:8, fontWeight:'800' },

  // Proof card
  proofCard:  { backgroundColor:'#dcfce7', borderRadius:16, padding:16, flexDirection:'row', alignItems:'center', gap:14, marginBottom:10, borderWidth:1, borderColor:'#16a34a40' },
  proofTitle: { fontSize:14, fontWeight:'700', color:'#15803d' },
  proofSub:   { fontSize:12, color:'#166534', marginTop:2 },
  proofBadge: { backgroundColor:'#16a34a', paddingHorizontal:10, paddingVertical:5, borderRadius:50 },
  proofBadgeTxt:{ color:'#fff', fontSize:11, fontWeight:'700' },
  completeBtn: { borderRadius:50, overflow:'hidden', marginBottom:10, elevation:4, shadowColor:T.maroon, shadowOpacity:0.35, shadowRadius:10 },
  completeBtnGrad: { paddingVertical:15, alignItems:'center' },
  completeBtnTxt: { color:'#fff', fontSize:15, fontWeight:'800' },
  outlineBtn: { borderRadius:50, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:T.maroon, marginBottom:10 },
  outlineBtnTxt: { color:T.maroon, fontSize:15, fontWeight:'800' },

  infoCard:   { backgroundColor:'#fef3c7', borderRadius:16, padding:16, flexDirection:'row', alignItems:'flex-start', gap:12, borderWidth:1, borderColor:'#d97706'+'40' },
  infoTxt:    { fontSize:13, color:'#92400e', flex:1, lineHeight:19 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 8 },
  modalDesc: { fontSize: 14, color: T.textM, marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 24, backgroundColor: T.bg },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: T.bg },
  modalCancelTxt: { fontSize: 15, fontWeight: '700', color: T.textM },
  modalSubmitBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  modalSubmitTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  reasonChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: T.border, marginRight: 8, backgroundColor: T.bg },
  reasonTxt: { fontSize: 13, color: T.textM, fontWeight: '600' },
});
