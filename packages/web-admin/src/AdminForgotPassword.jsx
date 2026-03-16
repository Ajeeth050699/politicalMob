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
  const s = { error:{bg:"#FEE2E2",border:"#ef4444",color:"#dc2626",icon:"❌"}, success:{bg:"#DCFCE7",border:"#22c55e",color:"#16a34a",icon:"✅"}, warning:{bg:"#FEF3C7",border:"#f59e0b",color:"#d97706",icon:"⚠️"}, info:{bg:"#DBEAFE",border:"#3b82f6",color:"#2563eb",icon:"ℹ️"} }[type] || { bg:"#FEE2E2",border:"#ef4444",color:"#dc2626",icon:"❌" };
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:s.bg, borderLeft:`3.5px solid ${s.border}`, borderRadius:12, padding:"12px 16px", marginBottom:18, animation:"fadeIn 0.3s ease" }}>
      <span style={{ fontSize:16, marginTop:1 }}>{s.icon}</span>
      <span style={{ fontSize:13, fontWeight:600, color:s.color, lineHeight:1.5 }}>{msg}</span>
    </div>
  );
}

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [step,      setStep]      = useState(1); // 1=email, 2=otp, 3=new password
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState({ msg:"", type:"error" });

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem("userInfo")); if (u?.token) navigate("/dashboard", { replace:true }); } catch {}
  }, []);

  const showToast = (msg, type="error") => setToast({ msg, type });

  // Step 1 — send OTP to email/phone
  const handleSendOtp = async () => {
    if (!email.trim()) { showToast("Please enter your registered email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { showToast("Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email: email.trim() });
      const devOtp = res.data?.otp;
      const ph = res.data?.phone;
      if (ph) setPhone(ph);
      if (devOtp) showToast(`Dev OTP: ${devOtp} (sent to registered phone)`, "info");
      else        showToast("OTP sent to your registered phone number.", "success");
      setStep(2);
    } catch (err) {
      const s = err?.response?.status;
      if (s === 404) showToast("No account found with this email address.");
      else           showToast(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { showToast("Enter the full 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/verify-reset-otp`, { email, otp });
      showToast("OTP verified! Set your new password.", "success");
      setStep(3);
    } catch (err) {
      showToast(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  // Step 3 — reset password
  const handleResetPassword = async () => {
    if (newPw.length < 6)       { showToast("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw)     { showToast("Passwords do not match.");                 return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { email, otp, newPassword: newPw });
      showToast("Password reset successfully! Redirecting to login...", "success");
      setTimeout(() => navigate("/login", { replace:true }), 1500);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to reset password. Try again.");
    } finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"12px 14px 12px 40px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:14, color:C.text, fontFamily:"'Source Sans 3',sans-serif" };
  const labelStyle = { display:"block", fontSize:12, fontWeight:700, color:"#6B6B6B", marginBottom:7, textTransform:"uppercase", letterSpacing:0.7 };
  const btnStyle   = { width:"100%", padding:"13px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.maroon},${C.light})`, color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 18px rgba(123,28,28,0.28)`, opacity:loading?0.75:1 };

  const STEP_INFO = [
    { title:"Forgot Password",     sub:"Enter your email to receive an OTP"      },
    { title:"Verify OTP",          sub:"Enter the OTP sent to your phone"         },
    { title:"Set New Password",    sub:"Create a strong new password"             },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Source Sans 3',sans-serif" }}>
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

      <div style={{ width:"100%", maxWidth:420, animation:"fadeIn 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:`linear-gradient(135deg,${C.maroon},${C.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 14px", boxShadow:`0 6px 20px rgba(123,28,28,0.3)` }}>🏛️</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:C.text }}>People Connect</h1>
          <p style={{ fontSize:12, color:C.muted, marginTop:3 }}>Tamil Nadu Government Portal</p>
        </div>

        <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", boxShadow:"0 8px 40px rgba(0,0,0,0.08)", border:`1px solid ${C.border}` }}>
          {/* Step dots */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: step===i ? 24 : 8, height:8, borderRadius:4, background: step >= i ? C.maroon : C.border, transition:"all 0.3s ease" }} />
            ))}
          </div>

          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:C.text, marginBottom:4 }}>{STEP_INFO[step-1].title}</h2>
          <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{STEP_INFO[step-1].sub}</p>

          <InlineToast msg={toast.msg} type={toast.type} />

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>Registered Email</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>✉️</span>
                  <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" style={inputStyle} />
                </div>
              </div>
              <button onClick={handleSendOtp} disabled={loading} className="sbtn" style={btnStyle}>
                {loading ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.75s linear infinite" }} /> Sending OTP...</span> : "Send OTP →"}
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.6 }}>OTP sent to the phone number registered with <strong style={{ color:C.text }}>{email}</strong></p>
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>6-Digit OTP</label>
                <input className="inp" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
                  style={{ width:"100%", padding:"14px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:28, fontWeight:700, textAlign:"center", color:C.text, letterSpacing:10, fontFamily:"'Playfair Display',serif" }} />
              </div>
              <button onClick={handleVerifyOtp} disabled={loading} className="sbtn" style={{ ...btnStyle, marginBottom:10 }}>
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
              <button onClick={() => { setStep(1); setOtp(""); setToast({msg:"",type:"error"}); }} style={{ width:"100%", padding:"10px", background:"none", border:"none", color:C.muted, fontFamily:"'Source Sans 3',sans-serif", fontSize:13, cursor:"pointer" }}>
                ← Try different email
              </button>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔒</span>
                  <input className="inp" type={showPw?"text":"password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingRight:40 }} />
                  <button type="button" onClick={() => setShowPw(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:15 }}>{showPw?"🙈":"👁️"}</button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔒</span>
                  <input className="inp" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" style={inputStyle} />
                </div>
              </div>
              {/* Password strength */}
              {newPw && (
                <div>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background: newPw.length >= i*3 ? (newPw.length < 6 ? "#ef4444" : newPw.length < 9 ? C.gold : "#22c55e") : C.border }} />
                    ))}
                  </div>
                  <p style={{ fontSize:11, color:newPw.length < 6 ? "#ef4444" : newPw.length < 9 ? C.gold : "#22c55e", fontWeight:600 }}>
                    {newPw.length < 6 ? "Weak" : newPw.length < 9 ? "Medium" : "Strong"} password
                  </p>
                </div>
              )}
              <button onClick={handleResetPassword} disabled={loading} className="sbtn" style={{ ...btnStyle, marginTop:4 }}>
                {loading ? "Resetting..." : "✅ Reset Password"}
              </button>
            </div>
          )}

          <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:22 }}>
            Remember your password?{" "}
            <Link to="/login" style={{ color:C.maroon, fontWeight:700, textDecoration:"none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}