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

const TN_DISTRICTS = [
  "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri",
  "Dindigul","Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur",
  "Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris",
  "Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga",
  "Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli",
  "Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore",
  "Viluppuram","Virudhunagar",
];

function InlineToast({ msg, type }) {
  if (!msg) return null;
  const s = { error:{bg:"#FEE2E2",border:"#ef4444",color:"#dc2626",icon:"❌"}, success:{bg:"#DCFCE7",border:"#22c55e",color:"#16a34a",icon:"✅"}, warning:{bg:"#FEF3C7",border:"#f59e0b",color:"#d97706",icon:"⚠️"}, info:{bg:"#DBEAFE",border:"#3b82f6",color:"#2563eb",icon:"ℹ️"} }[type] || { bg:"#FEE2E2",border:"#ef4444",color:"#dc2626",icon:"❌" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, background:s.bg, borderLeft:`3.5px solid ${s.border}`, borderRadius:12, padding:"12px 16px", marginBottom:18, animation:"fadeIn 0.3s ease" }}>
      <span>{s.icon}</span><span style={{ fontSize:13, fontWeight:600, color:s.color }}>{msg}</span>
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
      {["Details","OTP","District"].map((label,i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : "none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:13, background: done ? C.maroon : active ? C.maroon : "transparent", color: (done||active) ? "#fff" : C.muted, border: (done||active) ? "none" : `2px solid ${C.border}`, transition:"all 0.3s" }}>
                {done ? "✓" : step}
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:active ? C.maroon : C.muted, whiteSpace:"nowrap" }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:2, background: done ? C.maroon : C.border, margin:"0 8px 18px", transition:"background 0.3s" }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminRegister() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"", district:"Chennai", booth:"" });
  const [otp,     setOtp]     = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState({ msg:"", type:"error" });

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem("userInfo")); if (u?.token) navigate("/dashboard", { replace:true }); } catch {}
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const showToast = (msg, type="error") => setToast({ msg, type });

  // ── Step 1 validation + send OTP ───────────────────────────────
  const handleStep1 = async () => {
    if (!form.name.trim())                       { showToast("Please enter your full name.");         return; }
    if (!/\S+@\S+\.\S+/.test(form.email))        { showToast("Enter a valid email address.");         return; }
    if (!/^\d{10}$/.test(form.phone))            { showToast("Enter a valid 10-digit phone number."); return; }
    if (form.password.length < 6)                { showToast("Password must be at least 6 chars.");   return; }
    if (form.password !== form.confirmPassword)  { showToast("Passwords do not match.");              return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/send-otp`, { phone: form.phone });
      const devOtp = res.data?.otp;
      if (devOtp) showToast(`Dev OTP: ${devOtp}`, "info");
      else        showToast(`OTP sent to ${form.phone}`, "success");
      setStep(2);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  // ── Step 2 verify OTP ───────────────────────────────────────────
  const handleStep2 = async () => {
    if (otp.length !== 6) { showToast("Enter the full 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/verify-otp`, { phone: form.phone, otp });
      showToast("OTP verified!", "success");
      setStep(3);
    } catch (err) {
      showToast(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Step 3 register ────────────────────────────────────────────
  const handleStep3 = async () => {
    if (!form.district) { showToast("Please select your district."); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, {
        name:form.name, email:form.email, phone:form.phone,
        password:form.password, district:form.district, booth:form.booth || "General",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      showToast("Account created! Redirecting...", "success");
      setTimeout(() => navigate("/dashboard", { replace:true }), 800);
    } catch (err) {
      showToast(err?.response?.data?.message || "Registration failed. Try again.");
    } finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"12px 14px 12px 40px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:14, color:C.text, fontFamily:"'Source Sans 3',sans-serif" };
  const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:"#6B6B6B", marginBottom:7, textTransform:"uppercase", letterSpacing:0.7 };

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
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{ background:`linear-gradient(145deg,${C.dark},${C.maroon},#AA3535)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 44px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", background:`rgba(201,152,42,0.07)` }} />
        <div style={{ position:"relative", width:"100%", maxWidth:320, textAlign:"center" }}>
          <div style={{ width:80, height:80, borderRadius:22, background:"rgba(255,255,255,0.14)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 24px", border:"1.5px solid rgba(255,255,255,0.22)", boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>🏛️</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:28, color:"#fff", marginBottom:8 }}>Join the Portal</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:40, lineHeight:1.7 }}>Create your Tamil Nadu Government admin account in 3 simple steps.</p>
          {[
            { n:"01", t:"Personal Details", d:"Name, email, phone & password" },
            { n:"02", t:"OTP Verification", d:"Verify your phone number securely" },
            { n:"03", t:"Select District",  d:"Choose your district & booth"   },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", gap:14, textAlign:"left", padding:"12px 14px", background: step === i+1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)", borderRadius:12, marginBottom:8, border:`1px solid ${step === i+1 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.09)"}`, transition:"all 0.3s" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color: step > i+1 ? C.goldL : step === i+1 ? "#fff" : "rgba(255,255,255,0.3)", minWidth:28 }}>
                {step > i+1 ? "✓" : s.n}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: step >= i+1 ? "#fff" : "rgba(255,255,255,0.4)" }}>{s.t}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px" }}>
        <div style={{ width:"100%", maxWidth:400, animation:"fadeIn 0.5s ease" }}>
          <Link to="/" style={{ fontSize:13, color:C.muted, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, marginBottom:28 }}>← Back to Home</Link>

          <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", boxShadow:"0 8px 40px rgba(0,0,0,0.08)", border:`1px solid ${C.border}` }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:C.text, marginBottom:4 }}>Create Account</h2>
            <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Step {step} of 3 — {["Personal Details","OTP Verification","District & Booth"][step-1]}</p>

            <StepIndicator current={step} />
            <InlineToast msg={toast.msg} type={toast.type} />

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>👤</span>
                    <input className="inp" value={form.name} onChange={set("name")} placeholder="Your full name" style={inputStyle} /></div>
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>✉️</span>
                    <input className="inp" type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" style={inputStyle} autoComplete="email" /></div>
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>📱</span>
                    <input className="inp" type="tel" value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number" style={inputStyle} maxLength={10} /></div>
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔒</span>
                    <input className="inp" type={showPw?"text":"password"} value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight:40 }} />
                    <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15 }}>{showPw?"🙈":"👁️"}</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔒</span>
                    <input className="inp" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" style={inputStyle} /></div>
                </div>
                <button onClick={handleStep1} disabled={loading} className="sbtn" style={{ marginTop:6, padding:"13px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.maroon},${C.light})`, color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 18px rgba(123,28,28,0.28)`, opacity:loading?0.75:1 }}>
                  {loading ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.75s linear infinite" }} /> Sending OTP...</span> : "Continue →"}
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <p style={{ fontSize:14, color:C.muted, marginBottom:20, lineHeight:1.6 }}>A 6-digit OTP has been sent to <strong style={{ color:C.text }}>+91 {form.phone}</strong></p>
                <div style={{ marginBottom:20 }}>
                  <label style={labelStyle}>Enter OTP</label>
                  <input className="inp" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit OTP" maxLength={6}
                    style={{ width:"100%", padding:"14px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:22, fontWeight:700, textAlign:"center", color:C.text, letterSpacing:6, fontFamily:"'Playfair Display',serif" }} />
                </div>
                <button onClick={handleStep2} disabled={loading} className="sbtn" style={{ width:"100%", padding:"13px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.maroon},${C.light})`, color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 18px rgba(123,28,28,0.28)`, opacity:loading?0.75:1, marginBottom:12 }}>
                  {loading ? "Verifying..." : "Verify OTP →"}
                </button>
                <button onClick={() => setStep(1)} style={{ width:"100%", padding:"10px", background:"none", border:"none", color:C.muted, fontFamily:"'Source Sans 3',sans-serif", fontSize:13, cursor:"pointer" }}>← Change phone number</button>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={labelStyle}>District</label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>📍</span>
                    <select className="inp" value={form.district} onChange={set("district")} style={{ ...inputStyle, appearance:"none", cursor:"pointer" }}>
                      {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Booth Number <span style={{ color:C.muted, fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label>
                  <div style={{ position:"relative" }}><span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🏠</span>
                    <input className="inp" value={form.booth} onChange={set("booth")} placeholder="e.g. Booth 12 or General" style={inputStyle} /></div>
                </div>
                <button onClick={handleStep3} disabled={loading} className="sbtn" style={{ marginTop:6, padding:"13px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.maroon},${C.light})`, color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 18px rgba(123,28,28,0.28)`, opacity:loading?0.75:1 }}>
                  {loading ? "Creating account..." : "✅ Create Account"}
                </button>
              </div>
            )}

            <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:22 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color:C.maroon, fontWeight:700, textDecoration:"none" }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}