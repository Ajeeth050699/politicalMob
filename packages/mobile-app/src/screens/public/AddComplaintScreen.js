import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  Linking,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { complaintAPI } from "../../services/api";
import { T, COMPLAINT_CATEGORIES, TN_DISTRICTS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import PopupToast from "../../components/PopupToast";

const CATEGORY_ICONS = {
  "Street Light Problem": "💡",
  "Road Damage": "🛣️",
  "Garbage Issue": "🗑️",
  "Water Supply Problem": "💧",
  "Drainage Issue": "🚰",
  "Public Safety Issue": "🚨",
  Others: "📝",
};

// ── Permission denied popup ─────────────────────────────────────────
function PermissionModal({ visible, type, onClose }) {
  const info = {
    camera: {
      icon: "📷",
      title: "Camera Permission Required",
      msg: "To capture photos and videos as proof, please allow camera access in your device settings.",
    },
    gallery: {
      icon: "🖼️",
      title: "Gallery Permission Required",
      msg: "To attach photos and videos from your device, please allow photo library access in settings.",
    },
    document: {
      icon: "📄",
      title: "File Access Required",
      msg: "To attach documents as proof, please allow file access in your device settings.",
    },
  }[type] || {
    icon: "📎",
    title: "Permission Required",
    msg: "Please allow access in your device settings.",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={pm.overlay}>
        <View style={pm.card}>
          <View style={pm.iconCircle}>
            <Text style={{ fontSize: 40 }}>{info.icon}</Text>
          </View>
          <Text style={pm.title}>{info.title}</Text>
          <Text style={pm.msg}>{info.msg}</Text>
          <View style={pm.btnRow}>
            <TouchableOpacity style={pm.cancelBtn} onPress={onClose}>
              <Text style={pm.cancelTxt}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pm.settingsBtn}
              onPress={() => {
                onClose();
                Linking.openSettings();
              }}
            >
              <LinearGradient
                colors={[T.maroon, T.maroonL]}
                style={pm.settingsGrad}
              >
                <Text style={pm.settingsTxt}>Open Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Bottom sheet attachment picker ──────────────────────────────────
function AttachPickerSheet({
  visible,
  onClose,
  onCamera,
  onGallery,
  onDocument,
}) {
  const OPTIONS = [
    {
      icon: "📷",
      label: "Take Photo / Video",
      sub: "Open camera to capture",
      fn: onCamera,
    },
    {
      icon: "🖼️",
      label: "Choose from Gallery",
      sub: "Pick from your photos",
      fn: onGallery,
    },
    {
      icon: "📄",
      label: "Attach Document",
      sub: "PDF, Word or other files",
      fn: onDocument,
    },
  ];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={ap.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={ap.sheet}>
          <View style={ap.handle} />
          <Text style={ap.title}>📎 Add Proof Attachment</Text>
          <Text style={ap.sub}>Attach evidence of the issue (max 5 files)</Text>
          {OPTIONS.map(({ icon, label, sub, fn }) => (
            <TouchableOpacity
              key={label}
              style={ap.option}
              onPress={() => {
                onClose();
                setTimeout(fn, 300);
              }}
              activeOpacity={0.85}
            >
              <View style={ap.optIconBox}>
                <Text style={{ fontSize: 26 }}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ap.optLabel}>{label}</Text>
                <Text style={ap.optSub}>{sub}</Text>
              </View>
              <Text style={{ fontSize: 20, color: T.textM }}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={ap.cancelBtn} onPress={onClose}>
            <Text style={ap.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function AddComplaintScreen({ navigation }) {
  const { userInfo } = useAuth();
  const [form, setForm] = useState({
    category: "",
    description: "",
    booth: userInfo?.booth || "",
    district: userInfo?.district || "Chennai",
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [permType, setPermType] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const showToast = (msg, type = "error") =>
    setToast({ visible: true, message: msg, type });
  const hideToast = () => setToast((t) => ({ ...t, visible: false }));
  const showPermModal = (type) => setPermType(type);
  const hidePermModal = () => setPermType("");

  const addFiles = (items) => {
    setAttachments((prev) => {
      const combined = [...prev, ...items];
      if (combined.length > 5) {
        showToast("Maximum 5 attachments allowed.", "warning");
        return combined.slice(0, 5);
      }
      return combined;
    });
  };

  // ── Camera ───────────────────────────────────────────────────────
  const handleCamera = async () => {
    // Check current permission status first
    const current = await ImagePicker.getCameraPermissionsAsync();

    if (current.status === "granted") {
      // Already granted — open camera directly
      launchCamera();
      return;
    }

    if (current.status === "denied" && !current.canAskAgain) {
      // Permanently denied — must go to Settings
      showPermModal("camera");
      return;
    }

    // First time or can ask again — system dialog will appear automatically
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === "granted") {
      launchCamera();
    } else if (status === "denied") {
      showPermModal("camera");
    }
    // If 'undetermined' user dismissed — do nothing
  };

  const launchCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      videoMaxDuration: 30,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      addFiles([
        {
          uri: a.uri,
          type: a.type === "video" ? "video" : "image",
          filename: a.fileName || "capture",
        },
      ]);
    }
  };

  // ── Gallery ──────────────────────────────────────────────────────
  const handleGallery = async () => {
    // Check current permission status
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (current.status === "granted") {
      launchGallery();
      return;
    }

    if (current.status === "denied" && !current.canAskAgain) {
      showPermModal("gallery");
      return;
    }

    // System dialog will appear
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "granted") {
      launchGallery();
    } else if (status === "denied") {
      showPermModal("gallery");
    }
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled) {
      addFiles(
        result.assets.map((a) => ({
          uri: a.uri,
          type: a.type === "video" ? "video" : "image",
          filename: a.fileName || "file",
        })),
      );
    }
  };

  // ── Document ─────────────────────────────────────────────────────
  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "video/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        addFiles(
          result.assets.map((a) => ({
            uri: a.uri,
            type: "document",
            filename: a.name,
          })),
        );
      }
    } catch {
      showPermModal("document");
    }
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.category) {
      showToast("Please select an issue category.");
      return;
    }
    if (form.description.trim().length < 10) {
      showToast("Please describe the issue (min 10 chars).");
      return;
    }
    if (!form.booth.trim()) {
      showToast("Please enter your booth number.");
      return;
    }
    setLoading(true);
    try {
      await complaintAPI.create({
        ...form,
        attachments: attachments.map((a) => ({
          url: a.uri,
          type: a.type,
          filename: a.filename,
        })),
      });
      showToast(
        `Complaint submitted${attachments.length > 0 ? ` with ${attachments.length} file(s)` : ""}! ✅`,
        "success",
      );
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      showToast(
        e?.response?.data?.message || "Failed to submit. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (t) =>
    t === "video" ? "#3b82f6" : t === "document" ? T.gold : T.green;
  const typeLabel = (t) =>
    t === "video" ? "VID" : t === "document" ? "DOC" : "IMG";
  const typeIcon = (t) =>
    t === "video" ? "🎥" : t === "document" ? "📄" : "🖼️";

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <PopupToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.headerIcon}>
          <Text style={{ fontSize: 28 }}>📋</Text>
        </View>
        <Text style={s.headerTitle}>Report an Issue</Text>
        <Text style={s.headerSub}>Photos, videos & documents as proof</Text>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category */}
        <View style={s.section}>
          <View style={s.sHead}>
            <Text style={s.sIcon}>🏷️</Text>
            <Text style={s.sTitle}>Issue Category *</Text>
          </View>
          <View style={s.catGrid}>
            {COMPLAINT_CATEGORIES.map((cat) => {
              const active = form.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, active && s.catActive]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>
                    {CATEGORY_ICONS[cat]}
                  </Text>
                  <Text
                    style={[
                      s.catTxt,
                      active && { color: "#fff", fontWeight: "700" },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={s.section}>
          <View style={s.sHead}>
            <Text style={s.sIcon}>📝</Text>
            <Text style={s.sTitle}>Description *</Text>
          </View>
          <TextInput
            style={s.textarea}
            placeholder="Describe the issue in detail..."
            placeholderTextColor={T.textM}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{form.description.length} characters</Text>
        </View>

        {/* Location */}
        <View style={s.section}>
          <View style={s.sHead}>
            <Text style={s.sIcon}>📍</Text>
            <Text style={s.sTitle}>Location *</Text>
          </View>
          <View style={s.inputRow}>
            <Text style={s.iIcon}>🏠</Text>
            <TextInput
              style={s.input}
              placeholder="Booth number (e.g. Booth 12)"
              placeholderTextColor={T.textM}
              value={form.booth}
              onChangeText={(v) => setForm((f) => ({ ...f, booth: v }))}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
          >
            {TN_DISTRICTS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.distChip, form.district === d && s.distActive]}
                onPress={() => setForm((f) => ({ ...f, district: d }))}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.distTxt,
                    form.district === d && { color: "#fff", fontWeight: "700" },
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Attachments */}
        <View style={s.section}>
          <View style={s.sHead}>
            <Text style={s.sIcon}>📎</Text>
            <Text style={s.sTitle}>Proof Attachments</Text>
            <View
              style={[
                s.countBadge,
                { backgroundColor: attachments.length >= 5 ? T.red : T.maroon },
              ]}
            >
              <Text style={s.countBadgeTxt}>{attachments.length}/5</Text>
            </View>
          </View>
          <Text style={s.attachHint}>
            Optional · Add photos, videos or documents as evidence · Max 5
          </Text>

          {attachments.length < 5 && (
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[T.maroon, T.maroonL]}
                style={s.addBtnGrad}
              >
                <Text style={{ fontSize: 22 }}>📎</Text>
                <View>
                  <Text style={s.addBtnTxt}>Add Attachment</Text>
                  <Text style={s.addBtnSub}>Photo · Video · Document</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {attachments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 14 }}
            >
              {attachments.map((att, i) => (
                <View key={i} style={s.previewWrap}>
                  {att.type === "image" ? (
                    <Image source={{ uri: att.uri }} style={s.previewImg} />
                  ) : (
                    <View
                      style={[
                        s.previewImg,
                        {
                          backgroundColor:
                            att.type === "document" ? "#fef3c7" : "#1e293b",
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 30 }}>{typeIcon(att.type)}</Text>
                      <Text
                        style={{
                          fontSize: 9,
                          color: att.type === "document" ? T.maroon : "#fff",
                          fontWeight: "700",
                          marginTop: 3,
                        }}
                      >
                        {att.filename
                          ?.split(".")
                          .pop()
                          ?.toUpperCase()
                          ?.slice(0, 4)}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() =>
                      setAttachments((p) => p.filter((_, j) => j !== i))
                    }
                  >
                    <Text style={s.removeTxt}>×</Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      s.typeBadge,
                      { backgroundColor: typeColor(att.type) },
                    ]}
                  >
                    <Text style={s.typeBadgeTxt}>{typeLabel(att.type)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {attachments.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 28, opacity: 0.25 }}>📎</Text>
              <Text style={{ fontSize: 12, color: T.textM, marginTop: 6 }}>
                No attachments added
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        {form.category && form.district && (
          <View style={s.summary}>
            <Text style={s.summaryTitle}>📋 Summary</Text>
            {[
              ["Category", `${CATEGORY_ICONS[form.category]} ${form.category}`],
              ["District", `📍 ${form.district}`],
              ...(form.booth ? [["Booth", `🏠 ${form.booth}`]] : []),
              ["Attachments", `📎 ${attachments.length} file(s)`],
            ].map(([l, v]) => (
              <View key={l} style={s.summaryRow}>
                <Text style={s.summaryL}>{l}</Text>
                <Text style={s.summaryV}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[T.maroon, T.maroonL]} style={s.submitGrad}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.submitTxt}>🚀 Submit Complaint</Text>
                <Text style={s.submitSub}>
                  {attachments.length > 0
                    ? `With ${attachments.length} attachment(s)`
                    : "No attachments"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      <AttachPickerSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCamera={handleCamera}
        onGallery={handleGallery}
        onDocument={handleDocument}
      />
      <PermissionModal
        visible={!!permType}
        type={permType}
        onClose={hidePermModal}
      />
    </View>
  );
}

const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text,
    textAlign: "center",
    marginBottom: 10,
  },
  msg: {
    fontSize: 14,
    color: T.textL,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "700", color: T.textL },
  settingsBtn: { flex: 1, borderRadius: 50, overflow: "hidden" },
  settingsGrad: { paddingVertical: 14, alignItems: "center" },
  settingsTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
const ap = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 4 },
  sub: { fontSize: 13, color: T.textM, marginBottom: 18 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  optIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: T.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  optLabel: { fontSize: 15, fontWeight: "700", color: T.text },
  optSub: { fontSize: 12, color: T.textM, marginTop: 2 },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
  },
  cancelTxt: { fontSize: 15, fontWeight: "700", color: T.textL },
});
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 40,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 52 : 40,
    left: 20,
  },
  backTxt: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "600" },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sIcon: { fontSize: 18 },
  sTitle: { fontSize: 15, fontWeight: "800", color: T.text, flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  countBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catChip: {
    width: "46%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.bg,
    padding: 12,
    alignItems: "center",
  },
  catActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  catTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: T.textL,
    textAlign: "center",
    marginTop: 2,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: T.text,
    backgroundColor: T.bg,
    height: 110,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: T.textM, textAlign: "right", marginTop: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 14,
    backgroundColor: T.bg,
    paddingHorizontal: 14,
  },
  iIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: T.text },
  distChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: T.border,
    marginRight: 8,
    backgroundColor: T.bg,
  },
  distActive: { backgroundColor: T.maroon, borderColor: T.maroon },
  distTxt: { fontSize: 13, color: T.textL, fontWeight: "600" },
  attachHint: { fontSize: 12, color: T.textM, marginBottom: 14 },
  addBtn: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: T.maroon,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addBtnTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
  addBtnSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  previewWrap: { marginRight: 12, position: "relative" },
  previewImg: { width: 90, height: 90, borderRadius: 14 },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.red,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  removeTxt: { color: "#fff", fontSize: 16, fontWeight: "900", lineHeight: 18 },
  typeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeTxt: { color: "#fff", fontSize: 9, fontWeight: "800" },
  summary: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C9982A",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: T.maroonD,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryL: { fontSize: 12, color: T.textM, fontWeight: "600" },
  summaryV: { fontSize: 13, color: T.text, fontWeight: "700" },
  submitBtn: {
    borderRadius: 50,
    overflow: "hidden",
    elevation: 6,
    shadowColor: T.maroon,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  submitGrad: { paddingVertical: 18, alignItems: "center" },
  submitTxt: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  submitSub: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 3 },
});
