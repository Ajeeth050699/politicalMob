import { useState, useEffect } from "react";
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

// ── THEME ──────────────────────────────────────────────────────────────────
const T = {
  maroon: "#7B1C1C",
  maroonD: "#5A1010",
  maroonL: "#9B2C2C",
  gold: "#C9982A",
  goldL: "#E8B84B",
  goldP: "#FFF8E7",
  bg: "#F4F1ED",
  bgCard: "#FFFFFF",
  sidebar: "#1C0A0A",
  text: "#1A1A1A",
  textL: "#6B6B6B",
  textM: "#9B9B9B",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  border: "rgba(0,0,0,0.07)",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [workerModal, setWorkerModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDistrict, setFilterDistrict] = useState("ALL");
  const [searchWorker, setSearchWorker] = useState("");
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pending: 0,
    completed: 0,
    activeWorkers: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [workerList, setWorkerList] = useState(workers);
  const [complaintList, setComplaintList] = useState(complaints);
  const [newsBadge, setNewsBadge] = useState(false);
  const [notifCount, setNotifCount] = useState(3);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [camps, setCamps] = useState([]);
  const [videos, setVideos] = useState([]);
  const [exams, setExams] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState({});

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const NAVITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'complaints', label: 'Complaints', icon: '📝' },
    { id: 'workers', label: 'Workers', icon: '👥' },
    { id: 'news', label: 'News & Camps', icon: '📰' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      try {
        const { data: statsData } = await axios.get("http://localhost:5001/api/dashboard/stats", config);
        setStats(statsData);

        const { data: weeklyData } = await axios.get("http://localhost:5001/api/dashboard/complaints/weekly", config);
        setWeeklyData(weeklyData);

        const { data: categoryData } = await axios.get("http://localhost:5001/api/dashboard/complaints/by-category", config);
        setCategoryData(categoryData);

        const { data: recentComplaintsData } = await axios.get("http://localhost:5001/api/dashboard/complaints/recent", config);
        setComplaints(recentComplaintsData);
        setComplaintList(recentComplaintsData);


        const { data: districtPerformanceData } = await axios.get("http://localhost:5001/api/dashboard/districts/performance", config);
        setDistrictData(districtPerformanceData);

        const { data: complaintsData } = await axios.get("http://localhost:5001/api/complaints", config);
        setComplaints(complaintsData);
        setComplaintList(complaintsData);

        const { data: workersData } = await axios.get("http://localhost:5001/api/workers", config);
        setWorkers(workersData);
        setWorkerList(workersData);

        const { data: newsData } = await axios.get("http://localhost:5001/api/news", config);
        setNewsItems(newsData);

        const { data: campsData } = await axios.get("http://localhost:5001/api/news/camps", config);
        setCamps(campsData);

        const { data: videosData } = await axios.get("http://localhost:5001/api/education/videos", config);
        setVideos(videosData);

        const { data: examsData } = await axios.get("http://localhost:5001/api/education/exams", config);
        setExams(examsData);

        const { data: notificationsData } = await axios.get("http://localhost:5001/api/notifications", config);
        setNotifications(notificationsData);

        const { data: analyticsStatsData } = await axios.get("http://localhost:5001/api/analytics/stats", config);
        setAnalyticsStats(analyticsStatsData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchData();
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;

  // filtered complaints
  const filteredComplaints = complaintList.filter(
    (c) =>
      (filterStatus === "ALL" || c.status === filterStatus) &&
      (filterDistrict === "ALL" || c.district === filterDistrict),
  );

  const filteredWorkers = workerList.filter(
    (w) =>
      w.name.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.booth.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.district.toLowerCase().includes(searchWorker.toLowerCase()),
  );

  const removeWorker = (id) =>
    setWorkerList((w) => w.filter((x) => x.id !== id));
  const updateComplaintStatus = (id, status) => {
    setComplaintList((list) =>
      list.map((c) => (c.id === id ? { ...c, status } : c)),
    );
    setActiveComplaint(null);
  };

  const statusStyle = (status) => {
    switch (status) {
      case "NEW":
        return { bg: T.amber + "20", color: T.amber };
      case "IN PROGRESS":
        return { bg: T.blue + "20", color: T.blue };
      case "COMPLETED":
        return { bg: T.green + "20", color: T.green };
      default:
        return { bg: T.bg, color: T.textL };
    }
  };

  const priorityColor = (priority) => {
    switch (priority) {
      case "high":
        return T.red;
      case "medium":
        return T.amber;
      case "low":
        return T.green;
      default:
        return T.textM;
    }
  };

  const workerStatusStyle = (status) => {
    if (status === "active") return { bg: "#dcfce7", color: "#166534" };
    return { bg: "#f3f4f6", color: "#6b7280" };
  };

  // ── SIDEBAR ──
  const Sidebar = () => (
    <div
      style={{
        width: sideOpen ? 230 : 64,
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
          padding: sideOpen ? "24px 20px 20px" : "24px 10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🏛️
        </div>
        {sideOpen && (
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: "white",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            People Connect
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAVITEMS.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                if (item.id === "notifications") setNotifCount(0);
              }}
              title={!sideOpen ? item.label : ""}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: sideOpen ? "11px 14px" : "11px",
                borderRadius: 10,
                border: "none",
                background: active
                  ? `linear-gradient(135deg,${T.maroon},${T.maroonL})`
                  : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.55)",
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                marginBottom: 2,
                transition: "all 0.2s",
                textAlign: "left",
                justifyContent: sideOpen ? "flex-start" : "center",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sideOpen && (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
                  {item.label}
                </span>
              )}
              {item.id === "notifications" && notifCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: sideOpen ? 14 : 8,
                    background: T.red,
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {notifCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: sideOpen ? "11px 14px" : "11px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.55)",
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
            textAlign: "left",
            justifyContent: sideOpen ? "flex-start" : "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>🚪</span>
          {sideOpen && (
            <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={() => setSideOpen((o) => !o)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            border: "none",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 16,
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: sideOpen ? "flex-end" : "center",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
          }
        >
          {sideOpen ? "◀" : "▶"}
        </button>
      </div>
    </div>
  );

  // ── TOPBAR ──
  const Topbar = () => (
    <div
      style={{
        height: 64,
        background: T.bgCard,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 22,
            color: T.text,
          }}
        >
          {NAVITEMS.find((n) => n.id === page)?.label}
        </h1>
        <p
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            color: T.textM,
          }}
        >
          People Connect · Tamil Nadu Admin Panel
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setNotifModal(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg,
            cursor: "pointer",
            fontSize: 18,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.goldP)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.bg)}
        >
          🔔
          {notifCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: T.red,
                color: "white",
                fontSize: 9,
                fontWeight: 700,
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {notifCount}
            </span>
          )}
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              background: T.bg,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg,${T.maroon},${T.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "white",
              }}
            >
              👤
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  lineHeight: 1.2,
                }}
              >
                Santhosh
              </p>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 11,
                  color: T.textM,
                }}
              >
                Super Admin
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: 'white',
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 100,
                width: 160,
                padding: 6,
              }}
            >
              <button
                onClick={() => {
                  setPage('edit-profile');
                  setUserMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '10px 12px',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: T.red,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StatCard = ({ label, value, sub, icon, accent, delta }) => (
    <div
      style={{
        background: T.bgCard,
        borderRadius: 16,
        padding: "22px 24px",
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${accent}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 13, color: T.textM }}>{label}</p>
        <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: T.text, lineHeight: 1.2 }}>{value}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: delta > 0 ? T.green : T.red, fontWeight: 600 }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
          <span style={{ fontFamily: "'Source Sans 3',sans-serif", fontSize: 11, color: T.textM }}>{sub}</span>
        </div>
      </div>
    </div>
  );

  // ── PAGE: DASHBOARD ──
  const PageDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stat cards */}
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
          sub="This month"
          icon="📋"
          accent={T.maroon}
          delta={12}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          sub="Awaiting action"
          icon="⏳"
          accent={T.amber}
          delta={-8}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          sub="87.2% rate"
          icon="✅"
          accent={T.green}
          delta={5}
        />
        <StatCard
          label="Active Workers"
          value={stats.activeWorkers}
          sub="Across 38 districts"
          icon="👥"
          accent={T.blue}
          delta={2}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Weekly bar chart */}
        <div
          style={{
            background: T.bgCard,
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
              marginBottom: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: T.text,
                }}
              >
                Weekly Complaint Activity
              </p>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  color: T.textM,
                  marginTop: 2,
                }}
              >
                Submitted vs Resolved
              </p>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
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
            background: T.bgCard,
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
              marginBottom: 4,
            }}
          >
            By Category
          </p>
          <p
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 12,
              color: T.textM,
              marginBottom: 12,
            }}
          >
            Complaint distribution
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
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
              gap: "4px 12px",
              marginTop: 8,
            }}
          >
            {categoryData.map((d) => (
              <div
                key={d.name}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 11,
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

      {/* Recent complaints + district performance */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        {/* Recent complaints */}
        <div
          style={{
            background: T.bgCard,
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
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                color: T.text,
              }}
            >
              Recent Complaints
            </p>
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
          {complaints.slice(0, 4).map((c) => {
            const ss = statusStyle(c.status);
            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: priorityColor(c.priority),
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
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
                    {c.category}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textM,
                    }}
                  >
                    {c.id} · {c.booth} · {c.time}
                  </p>
                </div>
                <span
                  style={{
                    background: ss.bg,
                    color: ss.color,
                    padding: "4px 10px",
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
            background: T.bgCard,
            borderRadius: 16,
            padding: "22px 24px",
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 700,
              fontSize: 17,
              color: T.text,
              marginBottom: 18,
            }}
          >
            District Performance
          </p>
          {districtData.map((d, i) => {
            const pct = Math.round((d.resolved / d.total) * 100);
            return (
              <div key={d.district} style={{ marginBottom: 14 }}>
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
                        pct > 90 ? T.green : pct > 80 ? T.gold : T.maroon,
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

  // ── PAGE: COMPLAINTS ──
  const PageComplaints = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filters */}
      <div
        style={{
          background: T.bgCard,
          borderRadius: 16,
          padding: "18px 24px",
          border: `1px solid ${T.border}`,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: T.textL,
          }}
        >
          Filter by:
        </span>
        {/* Status */}
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
                color: filterStatus === s ? "white" : T.textL,
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: T.border }} />
        {/* District */}
        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          style={{
            padding: "7px 14px",
            borderRadius: 50,
            border: `1.5px solid ${T.border}`,
            background: T.bg,
            color: T.textL,
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            cursor: "pointer",
            outline: "none",
          }}
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
          {filteredComplaints.length} complaints
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: T.bgCard,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1.5fr 1.2fr 1fr 1fr 1.5fr",
            gap: 0,
            padding: "12px 24px",
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
        {filteredComplaints.map((c, i) => {
          const ss = statusStyle(c.status);
          const isOpen = activeComplaint === c.id;
          return (
            <div key={c.id}>
              <div
                onClick={() => setActiveComplaint(isOpen ? null : c.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1.5fr 1.2fr 1fr 1fr 1.5fr",
                  gap: 0,
                  padding: "14px 24px",
                  borderBottom: `1px solid ${T.border}`,
                  cursor: "pointer",
                  background: isOpen ? T.goldP : "transparent",
                  transition: "background 0.2s",
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
                    fontSize: 13,
                    color: T.textM,
                  }}
                >
                  {c.id}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: priorityColor(c.priority),
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
                    fontSize: 13,
                    color: T.textL,
                  }}
                >
                  {c.booth}
                </span>
                <span
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.textL,
                  }}
                >
                  {c.district}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: priorityColor(c.priority),
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textL,
                      textTransform: "capitalize",
                    }}
                  >
                    {c.priority}
                  </span>
                </span>
                <span
                  style={{
                    background: ss.bg,
                    color: ss.color,
                    padding: "4px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  {c.status}
                </span>
              </div>
              {/* Expandable row */}
              {isOpen && (
                <div
                  style={{
                    padding: "16px 24px",
                    background: T.goldP,
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
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
                  {["NEW", "IN PROGRESS", "COMPLETED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateComplaintStatus(c.id, s)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 50,
                        border: `1.5px solid ${c.status === s ? T.maroon : T.border}`,
                        background: c.status === s ? T.maroon : "white",
                        color: c.status === s ? "white" : T.textL,
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {s}
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
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 15,
                color: T.textM,
              }}
            >
              No complaints found for this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── PAGE: WORKERS ──
  const PageWorkers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search workers, booth, district..."
          value={searchWorker}
          onChange={(e) => setSearchWorker(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "11px 16px",
            borderRadius: 50,
            border: `1.5px solid ${T.border}`,
            background: T.bgCard,
            color: T.text,
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 14,
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        />
        <button
          onClick={() => setWorkerModal(true)}
          style={{
            padding: "11px 24px",
            borderRadius: 50,
            border: "none",
            background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
            color: "white",
            fontFamily: "'Source Sans 3',sans-serif",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(123,28,28,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          + Add Worker
        </button>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 16,
        }}
      >
        {filteredWorkers.map((w) => {
          const ws = workerStatusStyle(w.status);
          const pct = Math.round((w.resolved / (w.resolved + w.pending)) * 100);
          return (
            <div
              key={w.id}
              style={{
                background: T.bgCard,
                borderRadius: 16,
                padding: "22px 22px",
                border: `1px solid ${T.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-4px)")
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
                      fontSize: 20,
                      color: "white",
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 700,
                    }}
                  >
                    {w.name[0]}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.text,
                      }}
                    >
                      {w.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        color: T.textM,
                      }}
                    >
                      {w.booth} · {w.district}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    background: ws.bg,
                    color: ws.color,
                    padding: "4px 10px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {w.status}
                </span>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  ["Resolved", w.resolved, T.green],
                  ["Pending", w.pending, T.amber],
                  ["Rating", `${w.rating}★`, T.gold],
                ].map(([l, v, c]) => (
                  <div
                    key={l}
                    style={{
                      textAlign: "center",
                      padding: "10px 8px",
                      background: T.bg,
                      borderRadius: 10,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 700,
                        fontSize: 18,
                        color: c,
                      }}
                    >
                      {v}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 11,
                        color: T.textM,
                        marginTop: 2,
                      }}
                    >
                      {l}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
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

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.textL,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.blue;
                    e.currentTarget.style.color = T.blue;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.textL;
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => removeWorker(w.id)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.textL,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = T.red;
                    e.currentTarget.style.color = T.red;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.textL;
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── PAGE: NEWS & CAMPS ──
  const PageNews = ({ newsItems, camps }) => {
    const [tab, setTab] = useState("news");
    const campIcons = {
      medical: "🏥",
      blood: "🩸",
      women: "👩",
      employment: "💼",
      education: "📚",
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            background: T.bgCard,
            borderRadius: 16,
            padding: 6,
            border: `1px solid ${T.border}`,
            width: "fit-content",
          }}
        >
          {["news", "camps"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "9px 24px",
                borderRadius: 12,
                border: "none",
                background:
                  tab === t
                    ? `linear-gradient(135deg,${T.maroon},${T.maroonL})`
                    : "transparent",
                color: tab === t ? "white" : T.textL,
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.25s",
                textTransform: "capitalize",
              }}
            >
              {t === "news" ? "📰 News" : "🏕️ Special Camps"}
            </button>
          ))}
        </div>

        {tab === "news" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {newsItems.map((n) => (
              <div
                key={n.id}
                style={{
                  background: T.bgCard,
                  borderRadius: 14,
                  padding: "18px 22px",
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
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
                    width: 44,
                    height: 44,
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
                    fontSize: 22,
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
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: T.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      color: T.textM,
                      marginTop: 3,
                    }}
                  >
                    {n.level} · {n.date}
                  </p>
                </div>
                <span
                  style={{
                    background:
                      n.status === "published" ? "#dcfce7" : "#fef3c7",
                    color: n.status === "published" ? "#166534" : "#92400e",
                    padding: "4px 12px",
                    borderRadius: 50,
                    fontSize: 11,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.status}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: "transparent",
                      color: T.textL,
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid ${T.red}20`,
                      background: `${T.red}08`,
                      color: T.red,
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <button
              style={{
                padding: "14px",
                borderRadius: 14,
                border: `2px dashed ${T.border}`,
                background: "transparent",
                color: T.textL,
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.maroon;
                e.currentTarget.style.color = T.maroon;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textL;
              }}
            >
              + Add News Post
            </button>
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
                key={c.name}
                style={{
                  background: T.bgCard,
                  borderRadius: 16,
                  padding: "22px",
                  border: `1px solid ${T.border}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div style={{ fontSize: 40, marginBottom: 14 }}>
                  {campIcons[c.type]}
                </div>
                <p
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 17,
                    color: T.maroon,
                    marginBottom: 6,
                  }}
                >
                  {c.name}
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.textL,
                    marginBottom: 4,
                  }}
                >
                  📍 {c.location}
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: T.textL,
                    marginBottom: 14,
                  }}
                >
                  📅 {c.date} · {c.slots} slots
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: T.bg,
                      color: T.text,
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: "none",
                      
                      background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
                      color: "white",
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Notify Users
                  </button>
                </div>
              </div>
            ))}
            <div
              style={{
                background: T.bgCard,
                borderRadius: 16,
                padding: "22px",
                border: `2px dashed ${T.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.maroon;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <span style={{ fontSize: 32, marginBottom: 10 }}>➕</span>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14,
                  color: T.textL,
                }}
              >
                Add New Camp
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── PAGE: EDUCATION ──
  const PageEducation = ({ videos, exams }) => {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Videos */}
        <div
          style={{
            background: T.bgCard,
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
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                color: T.text,
              }}
            >
              🎥 Videos
            </p>
            <button
              style={{
                padding: "7px 16px",
                borderRadius: 50,
                border: "none",
                background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
                color: "white",
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Upload
            </button>
          </div>
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
                <p
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
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 11,
                    color: T.textM,
                    marginTop: 2,
                  }}
                >
                  {v.category} · {v.views.toLocaleString()} views
                </p>
              </div>
              <span
                style={{
                  background: v.status === "published" ? "#dcfce7" : "#fef3c7",
                  color: v.status === "published" ? "#166534" : "#92400e",
                  padding: "3px 9px",
                  borderRadius: 50,
                  fontSize: 10,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontWeight: 600,
                }}
              >
                {v.status}
              </span>
            </div>
          ))}
        </div>

        {/* Exams + Certs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: T.bgCard,
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
              <p
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: T.text,
                }}
              >
                📝 Online Exams
              </p>
              <button
                style={{
                  padding: "7px 16px",
                  borderRadius: 50,
                  border: "none",
                  background: `linear-gradient(135deg,${T.gold},${T.goldL})`,
                  color: T.maroonD,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Create
              </button>
            </div>
            {exams.map((e) => (
              <div
                key={e.id}
                style={{
                  padding: "12px 16px",
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
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.text,
                    }}
                  >
                    {e.title}
                  </p>
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
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 11,
                    color: T.textM,
                    marginTop: 4,
                  }}
                >
                  {e.questions} questions · {e.duration} · {e.taken} taken
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
              borderRadius: 16,
              padding: "22px 24px",
              color: "white",
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 17,
                marginBottom: 6,
              }}
            >
              🏆 Certificates Issued
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 42,
                color: T.goldL,
              }}
            >
              1,204
            </p>
            <p
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
              }}
            >
              Total certificates auto-issued this month
            </p>
            <button
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
              Issue Batch →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── PAGE: NOTIFICATIONS ──
  const PageNotifications = ({ notifications }) => {
    const typeStyle = (t) =>
      ({
        complaint: "#fef3c7",
        worker: "#dbeafe",
        camp: "#dcfce7",
        news: "#f3e8ff",
      })[t] || "#f3f4f6";
    const typeIcon = (t) =>
      ({ complaint: "📋", worker: "👤", camp: "🏕️", news: "📰" })[t] || "🔔";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Source Sans 3',sans-serif",
              fontSize: 14,
              color: T.textL,
            }}
          >
            {notifications.length} recent activity logs
          </p>
          <button
            onClick={() => setNotifModal(true)}
            style={{
              padding: "11px 24px",
              borderRadius: 50,
              border: "none",
              background: `linear-gradient(135deg,${T.gold},${T.goldL})`,
              color: T.maroonD,
              fontFamily: "'Source Sans 3',sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: `0 4px 16px rgba(201,152,42,0.3)`,
            }}
          >
            📣 Send Announcement
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: T.bgCard,
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
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 14,
                    color: T.text,
                  }}
                >
                  {n.msg}
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: T.textM,
                    marginTop: 3,
                  }}
                >
                  {n.time}
                </p>
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
      </div>
    );
  };

  // ── PAGE: ANALYTICS ──
  const PageAnalytics = ({ analyticsStats, weeklyData, districtData }) => (
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
          value={analyticsStats.avgResolutionTime}
          sub="Per complaint"
          icon="⚡"
          accent={T.blue}
        />
        <StatCard
          label="Citizen Satisfaction"
          value={analyticsStats.citizenSatisfaction}
          sub="Based on feedback"
          icon="😊"
          accent={T.green}
        />
        <StatCard
          label="Worker Efficiency"
          value={analyticsStats.workerEfficiency}
          sub="Avg across booths"
          icon="🎯"
          accent={T.gold}
        />
        <StatCard
          label="Repeat Complaints"
          value={analyticsStats.repeatComplaints}
          sub="Same location/type"
          icon="🔄"
          accent={T.amber}
        />
      </div>

      {/* Line chart */}
      <div
        style={{
          background: T.bgCard,
          borderRadius: 16,
          padding: "22px 24px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 17,
            color: T.text,
            marginBottom: 4,
          }}
        >
          Complaint Trend — This Week
        </p>
        <p
          style={{
            fontFamily: "'Source Sans 3',sans-serif",
            fontSize: 12,
            color: T.textM,
            marginBottom: 20,
          }}
        >
          Daily submitted vs resolved
        </p>
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

      {/* District table */}
      <div
        style={{
          background: T.bgCard,
          borderRadius: 16,
          padding: "22px 24px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 700,
            fontSize: 17,
            color: T.text,
            marginBottom: 18,
          }}
        >
          District-wise Breakdown
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
            gap: 0,
            padding: "10px 16px",
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
          const pct = Math.round((d.resolved / d.total) * 100);
          return (
            <div
              key={d.district}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr",
                gap: 0,
                padding: "13px 16px",
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
                        pct > 90 ? T.green : pct > 80 ? T.gold : T.maroon,
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

  const PageEditProfile = () => {
    const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem("userInfo")));
    const [name, setName] = useState(userInfo?.name || '');
    const [email, setEmail] = useState(userInfo?.email || '');

    const handleProfileUpdate = async (e) => {
      e.preventDefault();
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      try {
        const { data } = await axios.put('http://localhost:5001/api/auth/profile', { name, email }, config);
        localStorage.setItem('userInfo', JSON.stringify(data));
        alert('Profile updated successfully!');
      } catch (error) {
        console.error('Failed to update profile', error);
        alert('Failed to update profile.');
      }
    };

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', background: T.bgCard, padding: 24, borderRadius: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 22, color: T.text, marginBottom: 24 }}>Edit Profile</h2>
        <form onSubmit={handleProfileUpdate}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: T.textL }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: T.textL }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "11px 24px",
              borderRadius: 50,
              border: "none",
              background: `linear-gradient(135deg,${T.maroon},${T.maroonL})`,
              color: "white",
              fontFamily: "'Source Sans 3',sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    );
  };

  const pages = {
    dashboard: <PageDashboard />,
    complaints: <PageComplaints />,
    workers: <PageWorkers />,
    news: <PageNews newsItems={newsItems} camps={camps} />,
    education: <PageEducation videos={videos} exams={exams} />,
    notifications: <PageNotifications notifications={notifications} />,
    analytics: <PageAnalytics analyticsStats={analyticsStats} weeklyData={weeklyData} districtData={districtData} />,
    'edit-profile': <PageEditProfile />,
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(123,28,28,0.25);border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(123,28,28,0.45);}
        select option{background:#fff;color:#1A1A1A;}
        @media(max-width:900px){
          .dash-sidebar{display:none !important;}
          .dash-main{padding:16px !important;}
        }
      `}</style>

      {/* Sidebar */}
      <div className="dash-sidebar">
        <Sidebar />
      </div>

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar />
        <div
          className="dash-main"
          style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}
        >
          {pages[page]}
        </div>
      </div>

      {/* Modals */}
      {workerModal && <AddWorkerModal onClose={() => setWorkerModal(false)} />}
      {notifModal && <NotifModal onClose={() => setNotifModal(false)} />}
    </div>
  );
}
