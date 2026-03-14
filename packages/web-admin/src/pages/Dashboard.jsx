import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── CONFIG ─────────────────────────────────────────────────────────
const API = "http://localhost:5003";

const getConfig = () => {
  const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
  return { headers: { Authorization: `Bearer ${u.token}` } };
};

// ── THEME ──────────────────────────────────────────────────────────
const T = {
  maroon: "#7B1C1C",
  maroonD: "#5A1010",
  maroonL: "#9B2C2C",
  gold: "#C9982A",
  goldL: "#E8B84B",
  goldP: "#FFF8E7",
  bg: "#F4F1ED",
  bgCard: "#FFFFFF",
  sidebar: "#140606",
  text: "#1A1A1A",
  textL: "#6B6B6B",
  textM: "#9B9B9B",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  border: "rgba(0,0,0,0.07)",
};

// ── MODAL WRAPPER ──────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(4px)",
      padding: 20,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }}
    >
      {/* Modal header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 10,
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: `1px solid ${T.border}`,
            background: T.bg,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: "20px 24px 24px" }}>{children}</div>
    </div>
  </div>
);

// ── FORM FIELD ─────────────────────────────────────────────────────
const Field = ({ label, icon, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "block",
        marginBottom: 7,
        fontFamily: "'Source Sans 3',sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color: T.textL,
      }}
    >
      {icon} {label}
    </label>
    {children}
  </div>
);

const inputSx = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  border: `1.5px solid ${T.border}`,
  background: T.bg,
  fontFamily: "'Source Sans 3',sans-serif",
  fontSize: 14,
  color: T.text,
  outline: "none",
  boxSizing: "border-box",
};

const selectSx = { ...inputSx, cursor: "pointer" };

const SubmitBtn = ({ loading, label }) => (
  <button
    type="submit"
    disabled={loading}
    style={{
      width: "100%",
      padding: "13px",
      borderRadius: 50,
      border: "none",
      background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
      color: "#fff",
      fontFamily: "'Source Sans 3',sans-serif",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      boxShadow: `0 4px 16px rgba(123,28,28,0.3)`,
      opacity: loading ? 0.7 : 1,
      marginTop: 8,
    }}
  >
    {loading ? "⏳ Saving..." : label}
  </button>
);

// ── SUCCESS TOAST ──────────────────────────────────────────────────
const Toast = ({ msg, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 2000,
        background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
        color: "#fff",
        padding: "14px 22px",
        borderRadius: 14,
        fontFamily: "'Source Sans 3',sans-serif",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        animation: "slideIn 0.3s ease",
      }}
    >
      ✅ {msg}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Data state
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pending: 0,
    completed: 0,
    activeWorkers: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [camps, setCamps] = useState([]);
  const [videos, setVideos] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState({});
  const [certCount, setCertCount] = useState(0);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDistrict, setFilterDistrict] = useState("ALL");
  const [searchWorker, setSearchWorker] = useState("");
  const [activeComplaint, setActiveComplaint] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // null | string

  const showToast = (msg) => {
    setToast(msg);
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  // ── FETCH ALL DATA ──────────────────────────────────────────────
  const fetchAll = async () => {
    const cfg = getConfig();
    try {
      const [
        sRes,
        wkRes,
        catRes,
        rcRes,
        dpRes,
        cmpRes,
        wRes,
        nRes,
        campRes,
        vRes,
        eRes,
        notifRes,
        analRes,
        certRes,
      ] = await Promise.allSettled([
        axios.get(`${API}/api/dashboard/stats`, cfg),
        axios.get(`${API}/api/dashboard/complaints/weekly`, cfg),
        axios.get(`${API}/api/dashboard/complaints/by-category`, cfg),
        axios.get(`${API}/api/dashboard/complaints/recent`, cfg),
        axios.get(`${API}/api/dashboard/districts/performance`, cfg),
        axios.get(`${API}/api/complaints`, cfg),
        axios.get(`${API}/api/workers`, cfg),
        axios.get(`${API}/api/news`, cfg),
        axios.get(`${API}/api/news/camps`, cfg),
        axios.get(`${API}/api/education/videos`, cfg),
        axios.get(`${API}/api/education/exams`, cfg),
        axios.get(`${API}/api/notifications`, cfg),
        axios.get(`${API}/api/analytics/stats`, cfg),
        axios.get(`${API}/api/education/certificates/count`, cfg),
      ]);
      if (sRes.status === "fulfilled") setStats(sRes.value.data);
      if (wkRes.status === "fulfilled") setWeeklyData(wkRes.value.data);
      if (catRes.status === "fulfilled") setCategoryData(catRes.value.data);
      if (rcRes.status === "fulfilled") setComplaints(rcRes.value.data);
      if (dpRes.status === "fulfilled") setDistrictData(dpRes.value.data);
      if (cmpRes.status === "fulfilled") setComplaints(cmpRes.value.data);
      if (wRes.status === "fulfilled") setWorkers(wRes.value.data);
      if (nRes.status === "fulfilled") setNewsItems(nRes.value.data);
      if (campRes.status === "fulfilled") setCamps(campRes.value.data);
      if (vRes.status === "fulfilled") setVideos(vRes.value.data);
      if (eRes.status === "fulfilled") setExams(eRes.value.data);
      if (notifRes.status === "fulfilled")
        setNotifications(notifRes.value.data);
      if (analRes.status === "fulfilled") setAnalyticsStats(analRes.value.data);
      if (certRes.status === "fulfilled")
        setCertCount(certRes.value.data.count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── COMPLAINT STATUS UPDATE ─────────────────────────────────────
  const updateComplaintStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/api/complaints/${id}/status`,
        { status },
        getConfig(),
      );
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
      setActiveComplaint(null);
      showToast("Status updated");
    } catch {
      showToast("Failed to update");
    }
  };

  // ── DELETE WORKER ───────────────────────────────────────────────
  const deleteWorker = async (id) => {
    if (!window.confirm("Remove this worker?")) return;
    try {
      await axios.delete(`${API}/api/workers/${id}`, getConfig());
      setWorkers((prev) => prev.filter((w) => w.id !== id));
      showToast("Worker removed");
    } catch {
      showToast("Failed");
    }
  };

  // ── DELETE NEWS ─────────────────────────────────────────────────
  const deleteNews = async (id) => {
    if (!window.confirm("Delete this news?")) return;
    try {
      await axios.delete(`${API}/api/news/${id}`, getConfig());
      setNewsItems((prev) => prev.filter((n) => n.id !== id));
      showToast("News deleted");
    } catch {
      showToast("Failed");
    }
  };

  // ── HELPERS ─────────────────────────────────────────────────────
  const ss = (status) =>
    ({
      NEW: { bg: T.amber + "22", color: T.amber },
      "IN PROGRESS": { bg: T.blue + "22", color: T.blue },
      COMPLETED: { bg: T.green + "22", color: T.green },
    })[status] || { bg: T.bg, color: T.textL };

  const pc = (p) =>
    ({ high: T.red, medium: T.amber, low: T.green })[p] || T.textM;

  const filteredComplaints = complaints.filter(
    (c) =>
      (filterStatus === "ALL" || c.status === filterStatus) &&
      (filterDistrict === "ALL" || c.district === filterDistrict),
  );

  const filteredWorkers = workers.filter(
    (w) =>
      (w.name || "").toLowerCase().includes(searchWorker.toLowerCase()) ||
      (w.booth || "").toLowerCase().includes(searchWorker.toLowerCase()) ||
      (w.district || "").toLowerCase().includes(searchWorker.toLowerCase()),
  );

  // ══════════════════════════════════════════════════════════════
  // ADD WORKER MODAL
  // ══════════════════════════════════════════════════════════════
  const AddWorkerModal = () => {
    const [f, setF] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      booth: "",
      district: "Chennai",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(`${API}/api/workers`, f, getConfig());
        setWorkers((prev) => [...prev, data]);
        setModal(null);
        showToast("Worker added successfully");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="👷 Add New Worker" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Full Name" icon="👤">
              <input
                style={inputSx}
                required
                value={f.name}
                onChange={set("name")}
                placeholder="Worker name"
              />
            </Field>
            <Field label="Email" icon="✉️">
              <input
                style={inputSx}
                required
                type="email"
                value={f.email}
                onChange={set("email")}
                placeholder="Email address"
              />
            </Field>
            <Field label="Phone" icon="📱">
              <input
                style={inputSx}
                required
                value={f.phone}
                onChange={set("phone")}
                placeholder="Phone number"
              />
            </Field>
            <Field label="Password" icon="🔒">
              <input
                style={inputSx}
                required
                type="password"
                value={f.password}
                onChange={set("password")}
                placeholder="Min 6 characters"
              />
            </Field>
            <Field label="Booth Number" icon="🏠">
              <input
                style={inputSx}
                required
                value={f.booth}
                onChange={set("booth")}
                placeholder="e.g. Booth 12"
              />
            </Field>
            <Field label="District" icon="📍">
              <select
                style={selectSx}
                value={f.district}
                onChange={set("district")}
              >
                {[
                  "Chennai",
                  "Coimbatore",
                  "Madurai",
                  "Salem",
                  "Trichy",
                  "Tirunelveli",
                  "Vellore",
                  "Erode",
                  "Thanjavur",
                  "Dindigul",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          <SubmitBtn loading={loading} label="✅ Create Worker Account" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ADD COMPLAINT MODAL (admin can file on behalf)
  // ══════════════════════════════════════════════════════════════
  const AddComplaintModal = () => {
    const [f, setF] = useState({
      category: "Street Light Problem",
      description: "",
      booth: "",
      district: "Chennai",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/complaints`,
          f,
          getConfig(),
        );
        setComplaints((prev) => [data, ...prev]);
        setModal(null);
        showToast("Complaint filed successfully");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="📝 File a Complaint" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <Field label="Category" icon="🏷️">
            <select
              style={selectSx}
              value={f.category}
              onChange={set("category")}
            >
              {[
                "Street Light Problem",
                "Road Damage",
                "Garbage Issue",
                "Water Supply Problem",
                "Drainage Issue",
                "Public Safety Issue",
                "Others",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" icon="📝">
            <textarea
              style={{ ...inputSx, minHeight: 90, resize: "vertical" }}
              required
              value={f.description}
              onChange={set("description")}
              placeholder="Describe the issue..."
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Booth" icon="🏠">
              <input
                style={inputSx}
                required
                value={f.booth}
                onChange={set("booth")}
                placeholder="Booth number"
              />
            </Field>
            <Field label="District" icon="📍">
              <select
                style={selectSx}
                value={f.district}
                onChange={set("district")}
              >
                {[
                  "Chennai",
                  "Coimbatore",
                  "Madurai",
                  "Salem",
                  "Trichy",
                  "Tirunelveli",
                  "Vellore",
                  "Erode",
                  "Thanjavur",
                  "Dindigul",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
          <SubmitBtn loading={loading} label="🚀 Submit Complaint" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ADD NEWS MODAL
  // ══════════════════════════════════════════════════════════════
  const AddNewsModal = () => {
    const [f, setF] = useState({
      title: "",
      description: "",
      level: "State",
      district: "",
      booth: "",
      status: "published",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(`${API}/api/news`, f, getConfig());
        setNewsItems((prev) => [data, ...prev]);
        setModal(null);
        showToast("News published");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="📰 Publish News" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <Field label="Title" icon="📌">
            <input
              style={inputSx}
              required
              value={f.title}
              onChange={set("title")}
              placeholder="News headline"
            />
          </Field>
          <Field label="Description" icon="📝">
            <textarea
              style={{ ...inputSx, minHeight: 90, resize: "vertical" }}
              required
              value={f.description}
              onChange={set("description")}
              placeholder="Full news content..."
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Level" icon="🏛️">
              <select style={selectSx} value={f.level} onChange={set("level")}>
                {["State", "District", "Booth"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" icon="✅">
              <select
                style={selectSx}
                value={f.status}
                onChange={set("status")}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
            {f.level !== "State" && (
              <Field label="District" icon="📍">
                <select
                  style={selectSx}
                  value={f.district}
                  onChange={set("district")}
                >
                  {[
                    "",
                    "Chennai",
                    "Coimbatore",
                    "Madurai",
                    "Salem",
                    "Trichy",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d || "-- Select --"}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {f.level === "Booth" && (
              <Field label="Booth" icon="🏠">
                <input
                  style={inputSx}
                  value={f.booth}
                  onChange={set("booth")}
                  placeholder="Booth number"
                />
              </Field>
            )}
          </div>
          <SubmitBtn loading={loading} label="📢 Publish News" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ADD CAMP MODAL
  // ══════════════════════════════════════════════════════════════
  const AddCampModal = () => {
    const [f, setF] = useState({
      name: "",
      type: "medical",
      location: "",
      district: "Chennai",
      date: "",
      slots: 100,
      status: "upcoming",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/news/camps`,
          f,
          getConfig(),
        );
        setCamps((prev) => [...prev, data]);
        setModal(null);
        showToast("Camp created");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="🏕️ Create Welfare Camp" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <Field label="Camp Name" icon="🏕️">
            <input
              style={inputSx}
              required
              value={f.name}
              onChange={set("name")}
              placeholder="e.g. Free Medical Camp"
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Type" icon="🏷️">
              <select style={selectSx} value={f.type} onChange={set("type")}>
                {["medical", "blood", "women", "employment", "education"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Status" icon="📊">
              <select
                style={selectSx}
                value={f.status}
                onChange={set("status")}
              >
                {["upcoming", "active", "completed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Location" icon="📍">
              <input
                style={inputSx}
                required
                value={f.location}
                onChange={set("location")}
                placeholder="Venue address"
              />
            </Field>
            <Field label="District" icon="🏙️">
              <select
                style={selectSx}
                value={f.district}
                onChange={set("district")}
              >
                {[
                  "Chennai",
                  "Coimbatore",
                  "Madurai",
                  "Salem",
                  "Trichy",
                  "Tirunelveli",
                  "Vellore",
                  "Erode",
                  "Thanjavur",
                  "Dindigul",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Date" icon="📅">
              <input
                style={inputSx}
                required
                type="date"
                value={f.date}
                onChange={set("date")}
              />
            </Field>
            <Field label="Total Slots" icon="👥">
              <input
                style={inputSx}
                required
                type="number"
                value={f.slots}
                onChange={set("slots")}
                min={1}
              />
            </Field>
          </div>
          <SubmitBtn loading={loading} label="🏕️ Create Camp" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // UPLOAD VIDEO MODAL
  // ══════════════════════════════════════════════════════════════
  const UploadVideoModal = () => {
    const [f, setF] = useState({
      title: "",
      category: "Educational",
      videoUrl: "",
      status: "published",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/education/videos`,
          f,
          getConfig(),
        );
        setVideos((prev) => [data, ...prev]);
        setModal(null);
        showToast("Video uploaded");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="🎥 Upload Video" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <Field label="Video Title" icon="📌">
            <input
              style={inputSx}
              required
              value={f.title}
              onChange={set("title")}
              placeholder="e.g. Voter ID Application Guide"
            />
          </Field>
          <Field label="YouTube / Video URL" icon="🔗">
            <input
              style={inputSx}
              required
              value={f.videoUrl}
              onChange={set("videoUrl")}
              placeholder="https://youtube.com/watch?v=..."
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Category" icon="🏷️">
              <select
                style={selectSx}
                value={f.category}
                onChange={set("category")}
              >
                {[
                  "Educational",
                  "General Knowledge",
                  "Competitive Exam",
                  "Women Skill",
                  "Career Guidance",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" icon="✅">
              <select
                style={selectSx}
                value={f.status}
                onChange={set("status")}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
          </div>
          <SubmitBtn loading={loading} label="📤 Upload Video" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // CREATE EXAM MODAL
  // ══════════════════════════════════════════════════════════════
  const CreateExamModal = () => {
    const [f, setF] = useState({
      title: "",
      category: "",
      duration: "30 mins",
      totalMarks: 10,
      questions: [],
    });
    const [q, setQ] = useState({
      question: "",
      options: ["", "", "", ""],
      answer: 0,
    });
    const [loading, setLoading] = useState(false);
    const setF2 = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const setOpt = (i) => (e) =>
      setQ((p) => {
        const o = [...p.options];
        o[i] = e.target.value;
        return { ...p, options: o };
      });
    const addQ = () => {
      if (!q.question || q.options.some((o) => !o)) {
        alert("Fill all question fields");
        return;
      }
      setF((p) => ({ ...p, questions: [...p.questions, { ...q }] }));
      setQ({ question: "", options: ["", "", "", ""], answer: 0 });
    };
    const submit = async (e) => {
      e.preventDefault();
      if (f.questions.length === 0) {
        alert("Add at least 1 question");
        return;
      }
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/education/exams`,
          f,
          getConfig(),
        );
        setExams((prev) => [
          ...prev,
          {
            id: data._id,
            title: data.title,
            category: data.category,
            questions: data.questions.length,
            duration: data.duration,
            taken: 0,
          },
        ]);
        setModal(null);
        showToast("Exam created");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="📝 Create Exam" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Exam Title" icon="📌">
              <input
                style={inputSx}
                required
                value={f.title}
                onChange={setF2("title")}
                placeholder="e.g. Voter Awareness Quiz"
              />
            </Field>
            <Field label="Category" icon="🏷️">
              <input
                style={inputSx}
                value={f.category}
                onChange={setF2("category")}
                placeholder="e.g. Civics"
              />
            </Field>
            <Field label="Duration" icon="⏱">
              <input
                style={inputSx}
                value={f.duration}
                onChange={setF2("duration")}
                placeholder="30 mins"
              />
            </Field>
            <Field label="Total Marks" icon="🎯">
              <input
                style={inputSx}
                type="number"
                value={f.totalMarks}
                onChange={setF2("totalMarks")}
                min={1}
              />
            </Field>
          </div>

          {/* Questions list */}
          {f.questions.length > 0 && (
            <div
              style={{
                background: T.bg,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.textM,
                  marginBottom: 8,
                }}
              >
                {f.questions.length} QUESTION(S) ADDED
              </p>
              {f.questions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: T.textL,
                    padding: "4px 0",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {i + 1}. {q.question}
                </div>
              ))}
            </div>
          )}

          {/* Add question */}
          <div
            style={{
              background: `${T.maroon}08`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
              border: `1px dashed ${T.maroon}40`,
            }}
          >
            <p
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: T.maroon,
                marginBottom: 12,
              }}
            >
              ➕ Add Question
            </p>
            <Field label="Question" icon="❓">
              <input
                style={inputSx}
                value={q.question}
                onChange={(e) =>
                  setQ((p) => ({ ...p, question: e.target.value }))
                }
                placeholder="Enter question"
              />
            </Field>
            {q.options.map((opt, i) => (
              <Field
                key={i}
                label={`Option ${["A", "B", "C", "D"][i]}`}
                icon={["A", "B", "C", "D"][i]}
              >
                <input
                  style={inputSx}
                  value={opt}
                  onChange={setOpt(i)}
                  placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                />
              </Field>
            ))}
            <Field label="Correct Answer" icon="✅">
              <select
                style={selectSx}
                value={q.answer}
                onChange={(e) =>
                  setQ((p) => ({ ...p, answer: parseInt(e.target.value) }))
                }
              >
                {[
                  "A (index 0)",
                  "B (index 1)",
                  "C (index 2)",
                  "D (index 3)",
                ].map((l, i) => (
                  <option key={i} value={i}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              onClick={addQ}
              style={{
                padding: "9px 20px",
                borderRadius: 50,
                border: `1.5px solid ${T.maroon}`,
                background: "transparent",
                color: T.maroon,
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add This Question
            </button>
          </div>
          <SubmitBtn loading={loading} label="📝 Create Exam" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // SEND NOTIFICATION MODAL
  // ══════════════════════════════════════════════════════════════
  const SendNotifModal = () => {
    const [f, setF] = useState({
      msg: "",
      type: "announcement",
      targetRole: "all",
    });
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await axios.post(
          `${API}/api/notifications`,
          f,
          getConfig(),
        );
        setNotifications((prev) => [
          {
            id: data._id,
            msg: data.msg,
            type: data.type,
            time: data.createdAt,
          },
          ...prev,
        ]);
        setModal(null);
        showToast("Announcement sent to all users");
      } catch (err) {
        alert(err?.response?.data?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    return (
      <Modal title="📣 Send Announcement" onClose={() => setModal(null)}>
        <form onSubmit={submit}>
          <Field label="Message" icon="💬">
            <textarea
              style={{ ...inputSx, minHeight: 100, resize: "vertical" }}
              required
              value={f.msg}
              onChange={set("msg")}
              placeholder="Write your announcement..."
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Type" icon="🏷️">
              <select style={selectSx} value={f.type} onChange={set("type")}>
                {["announcement", "complaint", "news", "camp", "worker"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Target Audience" icon="👥">
              <select
                style={selectSx}
                value={f.targetRole}
                onChange={set("targetRole")}
              >
                <option value="all">All Users</option>
                <option value="public">Citizens Only</option>
                <option value="worker">Workers Only</option>
              </select>
            </Field>
          </div>
          <SubmitBtn loading={loading} label="📣 Send Announcement" />
        </form>
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ISSUE CERTIFICATES MODAL
  // ══════════════════════════════════════════════════════════════
  const IssueCertModal = () => (
    <Modal title="🏆 Certificate Summary" onClose={() => setModal(null)}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            margin: "0 auto 20px",
            background: `linear-gradient(135deg,${T.gold},${T.goldL})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          🎓
        </div>
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 42,
            color: T.maroon,
          }}
        >
          {certCount}
        </p>
        <p
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 16,
            color: T.textL,
            marginTop: 6,
          }}
        >
          Certificates issued to date
        </p>
        <p
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 13,
            color: T.textM,
            marginTop: 10,
            lineHeight: 1.7,
          }}
        >
          Certificates are auto-issued when a user scores 60% or above in any
          exam.
          <br />
          No manual action needed — the system handles it automatically.
        </p>
        <div
          style={{
            marginTop: 24,
            background: T.bg,
            borderRadius: 14,
            padding: 16,
            border: `1px solid ${T.border}`,
          }}
        >
          <p
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 13,
              color: T.textL,
            }}
          >
            📊 Total exams: <strong>{exams.length}</strong> &nbsp;·&nbsp; 🎓
            Certificates: <strong>{certCount}</strong>
          </p>
        </div>
      </div>
    </Modal>
  );

  // ── MODAL REGISTRY ──────────────────────────────────────────────
  const modals = {
    addWorker: <AddWorkerModal />,
    addComplaint: <AddComplaintModal />,
    addNews: <AddNewsModal />,
    addCamp: <AddCampModal />,
    uploadVideo: <UploadVideoModal />,
    createExam: <CreateExamModal />,
    sendNotif: <SendNotifModal />,
    issueCert: <IssueCertModal />,
  };

  // ── NAV ITEMS ───────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "complaints", label: "Complaints", icon: "📝" },
    { id: "workers", label: "Workers", icon: "👥" },
    { id: "news", label: "News & Camps", icon: "📰" },
    { id: "education", label: "Education", icon: "📚" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
  ];

  // ── SIDEBAR ─────────────────────────────────────────────────────
  const Sidebar = () => (
    <div
      style={{
        width: sideOpen ? 236 : 68,
        minHeight: "100vh",
        background: T.sidebar,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: sideOpen ? "22px 18px 18px" : "22px 10px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            flexShrink: 0,
            background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          🏛️
        </div>
        {sideOpen && (
          <div>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 15,
                color: "#fff",
              }}
            >
              People Connect
            </div>
            <div
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                marginTop: 1,
              }}
            >
              ADMIN PANEL
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              title={!sideOpen ? item.label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: sideOpen ? "10px 12px" : "10px",
                borderRadius: 10,
                border: "none",
                background: active
                  ? `linear-gradient(135deg,${T.maroon},${T.maroonL})`
                  : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                marginBottom: 2,
                transition: "all 0.2s",
                justifyContent: sideOpen ? "flex-start" : "center",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {sideOpen && (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout + collapse */}
      <div
        style={{
          padding: "8px 8px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: sideOpen ? "10px 12px" : "10px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 14,
            cursor: "pointer",
            justifyContent: sideOpen ? "flex-start" : "center",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span style={{ fontSize: 17 }}>🚪</span>
          {sideOpen && <span>Logout</span>}
        </button>
        <button
          onClick={() => setSideOpen((o) => !o)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 10,
            border: "none",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: 14,
            marginTop: 4,
          }}
        >
          {sideOpen ? "◀" : "▶"}
        </button>
      </div>
    </div>
  );

  // ── TOPBAR ──────────────────────────────────────────────────────
  const Topbar = () => (
    <div
      style={{
        height: 62,
        background: "#fff",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 20,
            color: T.text,
          }}
        >
          {NAV.find((n) => n.id === page)?.icon}{" "}
          {NAV.find((n) => n.id === page)?.label}
        </div>
        <div
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 11,
            color: T.textM,
          }}
        >
          People Connect · Tamil Nadu Government Portal
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setModal("sendNotif")}
          style={{
            padding: "8px 16px",
            borderRadius: 50,
            border: `1.5px solid ${T.maroon}`,
            background: "transparent",
            color: T.maroon,
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📣 Announce
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              background: T.bg,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: `linear-gradient(135deg,${T.maroon},${T.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "#fff",
              }}
            >
              👤
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                }}
              >
                Admin
              </div>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 10,
                  color: T.textM,
                }}
              >
                Super Admin
              </div>
            </div>
          </button>
          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                zIndex: 100,
                width: 160,
                padding: 6,
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "10px 12px",
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  color: T.red,
                  borderRadius: 8,
                  fontFamily: "'Source Sans 3',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── STAT CARD ────────────────────────────────────────────────────
  const StatCard = ({ label, value, icon, accent, sub, delta }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "22px 22px",
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            color: T.textM,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 30,
            color: T.text,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 11,
              color: T.textM,
              marginTop: 3,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );

  // ── ACTION BUTTON ────────────────────────────────────────────────
  const ActionBtn = ({ label, onClick, gold }) => (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: 50,
        border: "none",
        cursor: "pointer",
        background: gold
          ? `linear-gradient(135deg,${T.gold},${T.goldL})`
          : `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
        color: gold ? T.maroonD : "#fff",
        fontFamily: "'Source Sans 3',sans-serif",
        fontWeight: 600,
        fontSize: 13,
        boxShadow: gold
          ? `0 4px 14px rgba(201,152,42,0.3)`
          : `0 4px 14px rgba(123,28,28,0.3)`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: DASHBOARD
  // ══════════════════════════════════════════════════════════════
  const PageDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
        }}
      >
        <StatCard
          label="Total Complaints"
          value={stats.totalComplaints}
          icon="📋"
          accent={T.maroon}
          sub="All time"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="⏳"
          accent={T.amber}
          sub="Needs action"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon="✅"
          accent={T.green}
          sub="Resolved"
        />
        <StatCard
          label="Active Workers"
          value={stats.activeWorkers}
          icon="👥"
          accent={T.blue}
          sub="On field"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Weekly bar chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: T.text,
                }}
              >
                Weekly Activity
              </div>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  color: T.textM,
                  marginTop: 2,
                }}
              >
                Submitted vs Resolved
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {[
                ["Submitted", T.maroon],
                ["Resolved", T.green],
              ].map(([l, c]) => (
                <div
                  key={l}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: c,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textL,
                    }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4}>
              <XAxis
                dataKey="day"
                tick={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  fill: T.textM,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="complaints" fill={T.maroon} radius={[6, 6, 0, 0]} />
              <Bar dataKey="resolved" fill={T.green} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
              marginBottom: 4,
            }}
          >
            By Category
          </div>
          <div
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 12,
              color: T.textM,
              marginBottom: 12,
            }}
          >
            Distribution
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                dataKey="value"
                paddingAngle={3}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${T.border}`,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 10px",
              marginTop: 8,
            }}
          >
            {categoryData.map((d) => (
              <div
                key={d.name}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 10,
                    color: T.textL,
                  }}
                >
                  {d.name} {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        {/* Recent complaints */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                color: T.text,
              }}
            >
              Recent Complaints
            </div>
            <button
              onClick={() => setPage("complaints")}
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 13,
                color: T.maroon,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              View all →
            </button>
          </div>
          {complaints.slice(0, 5).map((c) => {
            const s = ss(c.status);
            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: pc(c.priority),
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.category}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 11,
                      color: T.textM,
                    }}
                  >
                    {c.booth} · {c.time}
                  </div>
                </div>
                <span
                  style={{
                    background: s.bg,
                    color: s.color,
                    padding: "3px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* District performance */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
              marginBottom: 16,
            }}
          >
            District Performance
          </div>
          {districtData.map((d) => {
            const pct =
              d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
            return (
              <div key={d.district} style={{ marginBottom: 13 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: T.text,
                      fontWeight: 600,
                    }}
                  >
                    {d.district}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textM,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: T.bg,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background:
                        pct > 90 ? T.green : pct > 70 ? T.gold : T.maroon,
                      borderRadius: 4,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: COMPLAINTS
  // ══════════════════════════════════════════════════════════════
  const PageComplaints = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <ActionBtn
          label="+ File Complaint"
          onClick={() => setModal("addComplaint")}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "NEW", "IN PROGRESS", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "7px 14px",
                borderRadius: 50,
                border: `1.5px solid ${filterStatus === s ? T.maroon : T.border}`,
                background: filterStatus === s ? T.maroon : "transparent",
                color: filterStatus === s ? "#fff" : T.textL,
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          style={{ ...selectSx, width: "auto" }}
        >
          <option value="ALL">All Districts</option>
          {["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 13,
            color: T.textM,
          }}
        >
          {filteredComplaints.length} results
        </span>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr",
            padding: "11px 22px",
            background: T.bg,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          {[
            "ID",
            "Category",
            "User",
            "Booth",
            "District",
            "Priority",
            "Status",
          ].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: T.textM,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {filteredComplaints.map((c) => {
          const s = ss(c.status);
          const isOpen = activeComplaint === c.id;
          return (
            <div key={c.id}>
              <div
                onClick={() => setActiveComplaint(isOpen ? null : c.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr",
                  padding: "13px 22px",
                  borderBottom: `1px solid ${T.border}`,
                  cursor: "pointer",
                  background: isOpen ? T.goldP : "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isOpen) e.currentTarget.style.background = T.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: T.textM,
                  }}
                >
                  {String(c.id).slice(-6)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: pc(c.priority),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {c.category}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.text,
                  }}
                >
                  {c.user}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: T.textL,
                  }}
                >
                  {c.booth}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: T.textL,
                  }}
                >
                  {c.district}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: pc(c.priority),
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {c.priority}
                </span>
                <span
                  style={{
                    background: s.bg,
                    color: s.color,
                    padding: "3px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    display: "inline-block",
                  }}
                >
                  {c.status}
                </span>
              </div>
              {isOpen && (
                <div
                  style={{
                    padding: "14px 22px",
                    background: T.goldP,
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: T.textL,
                    }}
                  >
                    Update status:
                  </span>
                  {["NEW", "IN PROGRESS", "COMPLETED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateComplaintStatus(c.id, st)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 50,
                        border: `1.5px solid ${c.status === st ? T.maroon : T.border}`,
                        background: c.status === st ? T.maroon : "#fff",
                        color: c.status === st ? "#fff" : T.textL,
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textM,
                    }}
                  >
                    Reported {c.time}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {filteredComplaints.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 15,
              color: T.textM,
            }}
          >
            No complaints found
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: WORKERS
  // ══════════════════════════════════════════════════════════════
  const PageWorkers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="🔍  Search workers, booth, district..."
          value={searchWorker}
          onChange={(e) => setSearchWorker(e.target.value)}
          style={{ ...inputSx, flex: 1, minWidth: 220, width: "auto" }}
        />
        <ActionBtn label="+ Add Worker" onClick={() => setModal("addWorker")} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 16,
        }}
      >
        {filteredWorkers.map((w) => {
          const total = (w.resolved || 0) + (w.pending || 0);
          const pct = total > 0 ? Math.round((w.resolved / total) * 100) : 0;
          return (
            <div
              key={w.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: "22px",
                border: `1px solid ${T.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-3px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg,${T.maroon},${T.gold})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "#fff",
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 700,
                    }}
                  >
                    {(w.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.text,
                      }}
                    >
                      {w.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        color: T.textM,
                      }}
                    >
                      {w.booth} · {w.district}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    background: w.status === "active" ? "#dcfce7" : "#f3f4f6",
                    color: w.status === "active" ? "#166534" : "#6b7280",
                    padding: "3px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Source Sans 3',sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {w.status}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {[
                  ["Resolved", w.resolved || 0, T.green],
                  ["Pending", w.pending || 0, T.amber],
                  ["Rating", `${w.rating || 4.5}★`, T.gold],
                ].map(([l, v, c]) => (
                  <div
                    key={l}
                    style={{
                      textAlign: "center",
                      padding: "10px 6px",
                      background: T.bg,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 700,
                        fontSize: 18,
                        color: c,
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 11,
                        color: T.textM,
                        marginTop: 2,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textL,
                    }}
                  >
                    Resolution rate
                  </span>
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: T.maroon,
                    }}
                  >
                    {pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: T.bg,
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: `linear-gradient(90deg,${T.maroon},${T.gold})`,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => deleteWorker(w.id)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${T.red}30`,
                    background: `${T.red}08`,
                    color: T.red,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          );
        })}
        {/* Add worker card */}
        <div
          onClick={() => setModal("addWorker")}
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: "22px",
            border: `2px dashed ${T.border}`,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.maroon;
            e.currentTarget.style.background = T.goldP;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.background = "#fff";
          }}
        >
          <span style={{ fontSize: 36, marginBottom: 10 }}>➕</span>
          <span
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 14,
              color: T.textL,
              fontWeight: 600,
            }}
          >
            Add New Worker
          </span>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: NEWS & CAMPS
  // ══════════════════════════════════════════════════════════════
  const PageNews = () => {
    const [tab, setTab] = useState("news");
    const campIcons = {
      medical: "🏥",
      blood: "🩸",
      women: "👩",
      employment: "💼",
      education: "📚",
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "#fff",
              borderRadius: 14,
              padding: 5,
              border: `1px solid ${T.border}`,
            }}
          >
            {["news", "camps"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "8px 22px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    tab === t
                      ? `linear-gradient(135deg,${T.maroon},${T.maroonL})`
                      : "transparent",
                  color: tab === t ? "#fff" : T.textL,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {t === "news" ? "📰 News" : "🏕️ Camps"}
              </button>
            ))}
          </div>
          <ActionBtn
            label={tab === "news" ? "+ Add News" : "+ Add Camp"}
            onClick={() => setModal(tab === "news" ? "addNews" : "addCamp")}
          />
        </div>

        {tab === "news" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {newsItems.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px 20px",
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateX(4px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateX(0)")
                }
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background:
                      n.level === "State"
                        ? `${T.maroon}18`
                        : n.level === "District"
                          ? `${T.gold}18`
                          : `${T.green}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {n.level === "State"
                    ? "🏛️"
                    : n.level === "District"
                      ? "🏙️"
                      : "📍"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textM,
                      marginTop: 3,
                    }}
                  >
                    {n.level} · {n.date}
                  </div>
                </div>
                <span
                  style={{
                    background:
                      n.status === "published" ? "#dcfce7" : "#fef3c7",
                    color: n.status === "published" ? "#166534" : "#92400e",
                    padding: "3px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Source Sans 3',sans-serif",
                  }}
                >
                  {n.status}
                </span>
                <button
                  onClick={() => deleteNews(n.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.red}30`,
                    background: `${T.red}08`,
                    color: T.red,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "'Source Sans 3',sans-serif",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {newsItems.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: T.textM,
                  fontFamily: "'Source Sans 3',sans-serif",
                }}
              >
                No news yet. Click "Add News" to publish.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 16,
            }}
          >
            {camps.map((c) => (
              <div
                key={c.id || c.name}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "22px",
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-3px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div style={{ fontSize: 38, marginBottom: 12 }}>
                  {campIcons[c.type] || "🏕️"}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: T.maroon,
                    marginBottom: 6,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.textL,
                    marginBottom: 4,
                  }}
                >
                  📍 {c.location}
                </div>
                <div
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.textL,
                    marginBottom: 14,
                  }}
                >
                  📅 {c.date} · {c.slots} slots
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setModal("sendNotif")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: "none",
                      background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
                      color: "#fff",
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    📣 Notify
                  </button>
                </div>
              </div>
            ))}
            <div
              onClick={() => setModal("addCamp")}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "22px",
                border: `2px dashed ${T.border}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.maroon;
                e.currentTarget.style.background = T.goldP;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = "#fff";
              }}
            >
              <span style={{ fontSize: 34, marginBottom: 8 }}>➕</span>
              <span
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 13,
                  color: T.textL,
                  fontWeight: 600,
                }}
              >
                Add New Camp
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // PAGE: EDUCATION
  // ══════════════════════════════════════════════════════════════
  const PageEducation = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Videos */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "22px 24px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
            }}
          >
            🎥 Videos
          </div>
          <ActionBtn label="+ Upload" onClick={() => setModal("uploadVideo")} />
        </div>
        {videos.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px 0",
              color: T.textM,
              fontFamily: "'Source Sans 3',sans-serif",
            }}
          >
            No videos yet
          </div>
        )}
        {videos.map((v) => (
          <div
            key={v.id}
            style={{
              padding: "12px 0",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${T.maroon}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              🎬
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {v.title}
              </div>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 11,
                  color: T.textM,
                  marginTop: 2,
                }}
              >
                {v.category} · {(v.views || 0).toLocaleString()} views
              </div>
            </div>
            <span
              style={{
                background: v.status === "published" ? "#dcfce7" : "#fef3c7",
                color: v.status === "published" ? "#166534" : "#92400e",
                padding: "2px 9px",
                borderRadius: 50,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'Source Sans 3',sans-serif",
              }}
            >
              {v.status}
            </span>
          </div>
        ))}
      </div>

      {/* Exams + cert */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                color: T.text,
              }}
            >
              📝 Online Exams
            </div>
            <ActionBtn
              label="+ Create"
              onClick={() => setModal("createExam")}
              gold
            />
          </div>
          {exams.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: T.textM,
                fontFamily: "'Source Sans 3',sans-serif",
              }}
            >
              No exams yet
            </div>
          )}
          {exams.map((e) => (
            <div
              key={e.id}
              style={{
                padding: "12px 14px",
                marginBottom: 10,
                borderRadius: 12,
                background: T.bg,
                border: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text,
                  }}
                >
                  {e.title}
                </div>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: T.maroon,
                  }}
                >
                  {e.taken}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 11,
                  color: T.textM,
                  marginTop: 4,
                }}
              >
                {e.questions} questions · {e.duration} · {e.taken} taken
              </div>
            </div>
          ))}
        </div>

        {/* Certificates */}
        <div
          style={{
            background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
            borderRadius: 16,
            padding: "22px 24px",
            color: "#fff",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              marginBottom: 6,
            }}
          >
            🏆 Certificates Issued
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 900,
              fontSize: 46,
              color: T.goldL,
            }}
          >
            {certCount}
          </div>
          <div
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              marginTop: 4,
            }}
          >
            Auto-issued when score ≥ 60%
          </div>
          <button
            onClick={() => setModal("issueCert")}
            style={{
              marginTop: 16,
              padding: "9px 20px",
              borderRadius: 50,
              border: "none",
              background: `linear-gradient(135deg,${T.gold},${T.goldL})`,
              color: T.maroonD,
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View Summary →
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: ANALYTICS
  // ══════════════════════════════════════════════════════════════
  const PageAnalytics = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 16,
        }}
      >
        <StatCard
          label="Avg Resolution Time"
          value={analyticsStats.avgResolutionTime || "—"}
          icon="⚡"
          accent={T.blue}
          sub="Per complaint"
        />
        <StatCard
          label="Citizen Satisfaction"
          value={analyticsStats.citizenSatisfaction || "—"}
          icon="😊"
          accent={T.green}
          sub="Feedback based"
        />
        <StatCard
          label="Worker Efficiency"
          value={analyticsStats.workerEfficiency || "—"}
          icon="🎯"
          accent={T.gold}
          sub="Avg across booths"
        />
        <StatCard
          label="Repeat Complaints"
          value={analyticsStats.repeatComplaints || 0}
          icon="🔄"
          accent={T.amber}
          sub="Same location/type"
        />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "22px 24px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 17,
            color: T.text,
            marginBottom: 4,
          }}
        >
          Complaint Trend — This Week
        </div>
        <div
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            color: T.textM,
            marginBottom: 20,
          }}
        >
          Submitted vs Resolved
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData}>
            <XAxis
              dataKey="day"
              tick={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
                fill: T.textM,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="complaints"
              stroke={T.maroon}
              strokeWidth={3}
              dot={{ fill: T.maroon, r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke={T.green}
              strokeWidth={3}
              dot={{ fill: T.green, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "22px 24px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 17,
            color: T.text,
            marginBottom: 16,
          }}
        >
          District-wise Breakdown
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
            padding: "9px 14px",
            background: T.bg,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          {["District", "Total", "Resolved", "Pending", "Performance"].map(
            (h) => (
              <span
                key={h}
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.textM,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {h}
              </span>
            ),
          )}
        </div>
        {districtData.map((d) => {
          const pct =
            d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0;
          return (
            <div
              key={d.district}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
                padding: "12px 14px",
                borderBottom: `1px solid ${T.border}`,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.text,
                }}
              >
                {d.district}
              </span>
              <span
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  color: T.text,
                }}
              >
                {d.total}
              </span>
              <span
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  color: T.green,
                  fontWeight: 600,
                }}
              >
                {d.resolved}
              </span>
              <span
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  color: T.amber,
                  fontWeight: 600,
                }}
              >
                {d.pending}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: T.bg,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background:
                        pct > 90 ? T.green : pct > 70 ? T.gold : T.maroon,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.textL,
                    minWidth: 36,
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // PAGE: NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  const PageNotifications = () => {
    const typeStyle = (t) =>
      ({
        complaint: "#fef3c7",
        worker: "#dbeafe",
        camp: "#dcfce7",
        news: "#f3e8ff",
        announcement: "#fee2e2",
      })[t] || "#f3f4f6";
    const typeIcon = (t) =>
      ({
        complaint: "📋",
        worker: "👤",
        camp: "🏕️",
        news: "📰",
        announcement: "📢",
      })[t] || "🔔";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 14,
              color: T.textL,
            }}
          >
            {notifications.length} activity logs
          </div>
          <ActionBtn
            label="📣 Send Announcement"
            onClick={() => setModal("sendNotif")}
            gold
          />
        </div>
        {notifications.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: T.textM,
              fontFamily: "'Source Sans 3',sans-serif",
            }}
          >
            No notifications yet
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "16px 20px",
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateX(4px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateX(0)")
            }
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: typeStyle(n.type),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {typeIcon(n.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  color: T.text,
                }}
              >
                {n.msg}
              </div>
              <div
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  color: T.textM,
                  marginTop: 3,
                }}
              >
                {new Date(n.time).toLocaleString("en-IN")}
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: T.green,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────────
  const pages = {
    dashboard: <PageDashboard />,
    complaints: <PageComplaints />,
    workers: <PageWorkers />,
    news: <PageNews />,
    education: <PageEducation />,
    analytics: <PageAnalytics />,
    notifications: <PageNotifications />,
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Source Sans 3',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(123,28,28,0.2);border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(123,28,28,0.4);}
        select option{background:#fff;color:#1A1A1A;}
        input:focus,textarea:focus,select:focus{border-color:rgba(123,28,28,0.5) !important;box-shadow:0 0 0 3px rgba(123,28,28,0.08);}
        @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar />
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {pages[page]}
        </div>
      </div>

      {/* Active modal */}
      {modal && modals[modal]}

      {/* Toast */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
