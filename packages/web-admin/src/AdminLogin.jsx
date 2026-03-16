import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import { API_URL } from "./config";

const API = API_URL;
const C = {
  maroon:"#7B1C1C", dark:"#5A1010", light:"#9B2C2C",
  gold:"#C9982A", goldL:"#E8B84B",
  bg:"#F4F1ED", text:"#1A1A1A", muted:"#9B9B9B", border:"rgba(0,0,0,0.09)",
};

function InlineToast({ msg, type }) {
  if (!msg) return null;
  const styles = {
    error:   { bg:"#FEE2E2", border:"#ef4444", color:"#dc2626", icon:"❌" },
    success: { bg:"#DCFCE7", border:"#22c55e", color:"#16a34a", icon:"✅" },
    warning: { bg:"#FEF3C7", border:"#f59e0b", color:"#d97706", icon:"⚠️" },
  };
  const s = styles[type] || styles.error;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, background:s.bg, borderLeft:`3.5px solid ${s.border}`, borderRadius:12, padding:"12px 16px", marginBottom:20, animation:"fadeIn 0.3s ease" }}>
      <span style={{ fontSize:16 }}>{s.icon}</span>
      <span style={{ fontSize:13, fontWeight:600, color:s.color, flex:1 }}>{msg}</span>
    </div>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email:"", password:"" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState({ msg:"", type:"error" });

  // Auth guard — stay on dashboard if already logged in
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("userInfo"));
      if (u?.token) navigate("/dashboard", { replace:true });
    } catch {}
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const showToast = (msg, type="error") => setToast({ msg, type });
  const hideToast = () => setToast({ msg:"", type:"error" });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    hideToast();
    if (!form.email.trim())    { showToast("Please enter your email address.");       return; }
    if (!form.password.trim()) { showToast("Please enter your password.");             return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { showToast("Enter a valid email address."); return; }

    setLoading(true);
    const tid = setTimeout(() => { setLoading(false); showToast("Connection timed out. Is the server running?", "warning"); }, 10000);

    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email:form.email.trim(), password:form.password });
      clearTimeout(tid);
      if (!["admin","worker"].includes(data.role)) { showToast("Access denied. Admin credentials required."); setLoading(false); return; }
      localStorage.setItem("userInfo", JSON.stringify(data));
      showToast("Login successful!", "success");
      setTimeout(() => navigate("/dashboard", { replace:true }), 700);
    } catch (err) {
      clearTimeout(tid);
      const s = err?.response?.status;
      if      (s === 401)     showToast("Incorrect email or password.");
      else if (s === 404)     showToast("No account found with this email.");
      else if (!err?.response) showToast("Cannot reach server. Check your connection.", "warning");
      else                     showToast(err?.response?.data?.message || "Login failed.");
    } finally { clearTimeout(tid); setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"grid", gridTemplateColumns:"1fr 1fr", fontFamily:"'Source Sans 3',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .inp:focus { border-color:${C.maroon} !important; box-shadow:0 0 0 3px rgba(123,28,28,0.1); outline:none; }
        .inp { transition: border-color 0.2s, box-shadow 0.2s; }
        .sbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(123,28,28,0.38) !important; }
        .sbtn { transition: all 0.2s; }
        .lnk:hover { color:${C.maroon} !important; }
        @media(max-width:700px) { .grid2 { grid-template-columns:1fr !important; } .leftpan { display:none !important; } }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="leftpan" style={{ background:`linear-gradient(145deg,${C.dark},${C.maroon},#AA3535)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 44px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-60, left:-60, width:250, height:250, borderRadius:"50%", background:`rgba(201,152,42,0.07)` }} />
        <div style={{ position:"relative", width:"100%", maxWidth:340 }}>
          <div style={{ width:80, height:80, borderRadius:22, background:"rgba(255,255,255,0.14)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, marginBottom:24, border:"1.5px solid rgba(255,255,255,0.22)", boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>🏛️</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:30, color:"#fff", marginBottom:6, lineHeight:1.15 }}>People Connect</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:40, letterSpacing:0.5 }}>Tamil Nadu Government Admin Portal</p>
          {[
            { icon:"📊", label:"Real-time complaint analytics" },
            { icon:"👥", label:"Manage booth field workers"   },
            { icon:"📰", label:"Publish news & welfare camps" },
            { icon:"📈", label:"District performance reports" },
            { icon:"🔔", label:"Push announcements to citizens" },
          ].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background:"rgba(255,255,255,0.08)", borderRadius:12, marginBottom:8, border:"1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize:18 }}>{f.icon}</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.82)", fontWeight:600 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeIn 0.5s ease" }}>
          <Link to="/" style={{ fontSize:13, color:C.muted, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, marginBottom:32 }} className="lnk">
            ← Back to Home
          </Link>

          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", boxShadow:"0 8px 40px rgba(0,0,0,0.08)", border:`1px solid ${C.border}` }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:26, color:C.text, marginBottom:4 }}>Welcome Back</h2>
            <p style={{ fontSize:14, color:C.muted, marginBottom:28 }}>Sign in to your admin account</p>

            <InlineToast msg={toast.msg} type={toast.type} />

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6B6B6B", marginBottom:7, textTransform:"uppercase", letterSpacing:0.7 }}>Email</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>✉️</span>
                  <input className="inp" type="email" value={form.email} onChange={set("email")} placeholder="admin@peopleconnect.com" autoComplete="email"
                    style={{ width:"100%", padding:"12px 14px 12px 40px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:14, color:C.text, fontFamily:"'Source Sans 3',sans-serif" }} />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6B6B6B", marginBottom:7, textTransform:"uppercase", letterSpacing:0.7 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>🔒</span>
                  <input className="inp" type={showPw?"text":"password"} value={form.password} onChange={set("password")} placeholder="Enter your password" autoComplete="current-password"
                    style={{ width:"100%", padding:"12px 40px 12px 40px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:14, color:C.text, fontFamily:"'Source Sans 3',sans-serif" }} />
                  <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15, lineHeight:1 }}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ textAlign:"right", marginBottom:22 }}>
                <Link to="/forgot-password" style={{ fontSize:13, color:C.maroon, fontWeight:600, textDecoration:"none" }}>Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading} className="sbtn" style={{ width:"100%", padding:"13px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.maroon},${C.light})`, color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 18px rgba(123,28,28,0.28)`, opacity:loading?0.75:1 }}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.75s linear infinite" }} />
                      Signing in...
                    </span>
                  : "Sign In →"
                }
              </button>
            </form>

            <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:22 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color:C.maroon, fontWeight:700, textDecoration:"none" }}>Register here</Link>
            </p>
          </div>

          <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(123,28,28,0.06)", borderRadius:12, border:`1px solid rgba(123,28,28,0.12)` }}>
            <p style={{ fontSize:12, color:C.maroon, textAlign:"center", fontWeight:600 }}>
              🔒 Restricted to authorised Tamil Nadu government personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}