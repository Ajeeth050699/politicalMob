import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, StatusBar, Image, Modal,
  Dimensions, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintAPI } from '../../services/api';
import { T, STATUS_COLORS, PRIORITY_COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const CATEGORY_ICONS = {
  'Street Light Problem':'💡', 'Road Damage':'🛣️', 'Garbage Issue':'🗑️',
  'Water Supply Problem':'💧', 'Drainage Issue':'🚰', 'Public Safety Issue':'🚨', 'Others':'📝',
};
const STATUS_ICONS = { 'NEW':'🆕', 'IN PROGRESS':'⚙️', 'COMPLETED':'✅' };

// ── Full screen image viewer ────────────────────────────────────────
function ImageViewer({ visible, uri, onClose }) {
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
  const { t, i18n } = useTranslation();
  const { id } = route.params;
  const [complaint,    setComplaint]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [viewerUri,    setViewerUri]    = useState(null);
  const [viewerVisible,setViewerVisible]= useState(false);

  useEffect(() => {
    complaintAPI.getById(id)
      .then(({ data }) => setComplaint(data))
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={T.maroon} size="large" /><Text style={{ color:T.textM, marginTop:10 }}>Loading...</Text></View>
  );
  if (!complaint) return null;

  const sc       = STATUS_COLORS[complaint.status] || { bg:'#f3f4f6', color:'#6b7280' };
  const pc       = PRIORITY_COLORS[complaint.priority] || T.amber;
  const catIcon  = CATEGORY_ICONS[complaint.category] || '📝';
  const attachments = complaint.attachments || [];

  const rows = [
    { label:'Description',     value:complaint.description,                          icon:'📝' },
    { label:'Booth',           value:complaint.booth,                                icon:'🏠' },
    { label:'District',        value:complaint.district,                             icon:'📍' },
    { label:'Submitted By',    value:complaint.user?.name || 'Unknown',              icon:'👤' },
    { label:'Assigned Worker', value:complaint.assignedWorker?.name || 'Pending assignment', icon:'👷' },
    { label:'Date Submitted',  value:new Date(complaint.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), icon:'📅' },
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
                {i<2 && <View style={[s.timelineLine, isDone && { backgroundColor:T.green }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Details ── */}
        <View style={s.body}>
          {rows.map(({ label, value, icon }) => (
            <View key={label} style={s.row}>
              <View style={s.rowIcon}><Text style={{ fontSize:18 }}>{icon}</Text></View>
              <View style={{ flex:1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowValue}>{value}</Text>
              </View>
            </View>
          ))}

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
                <Text style={s.proofSub}>Worker has submitted proof of resolution</Text>
              </View>
              <TouchableOpacity onPress={() => { setViewerUri(complaint.proofPhoto); setViewerVisible(true); }}>
                <View style={s.proofBadge}><Text style={s.proofBadgeTxt}>View</Text></View>
              </TouchableOpacity>
            </View>
          )}

          {!complaint.assignedWorker && (
            <View style={s.infoCard}>
              <Text style={{ fontSize:20 }}>ℹ️</Text>
              <Text style={s.infoTxt}>Your complaint is pending worker assignment. A worker from your booth will be assigned shortly.</Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:T.bg },
  center: { flex:1, justifyContent:'center', alignItems:'center' },

  header:      { paddingTop:Platform.OS==='ios'?52:40, paddingBottom:28, alignItems:'center', paddingHorizontal:24 },
  backBtn:     { position:'absolute', top:Platform.OS==='ios'?52:40, left:20 },
  backTxt:     { color:'rgba(255,255,255,0.85)', fontSize:15, fontWeight:'600' },
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

  infoCard:   { backgroundColor:'#fef3c7', borderRadius:16, padding:16, flexDirection:'row', alignItems:'flex-start', gap:12, borderWidth:1, borderColor:'#d97706'+'40' },
  infoTxt:    { fontSize:13, color:'#92400e', flex:1, lineHeight:19 },
});