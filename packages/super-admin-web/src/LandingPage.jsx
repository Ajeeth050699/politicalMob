import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  maroon:"#7B1C1C", dark:"#5A1010", light:"#9B2C2C",
  gold:"#C9982A", goldL:"#E8B84B", goldP:"#FFF8E7",
  bg:"#F4F1ED", text:"#1A1A1A", muted:"#6B6B6B", border:"rgba(0,0,0,0.08)",
};

const FEATURES = [
  { icon:"📝", title:"File Complaints",    desc:"Submit civic issues with photo & video proof to your booth worker instantly." },
  { icon:"📊", title:"Live Tracking",      desc:"Track complaint status from submission to resolution in real time." },
  { icon:"🏕️", title:"Welfare Camps",      desc:"Discover government welfare camps and social programs near you." },
  { icon:"📚", title:"Education Hub",      desc:"Access educational videos and earn certified government credentials." },
  { icon:"🚨", title:"Emergency Contacts", desc:"One-tap access to all Tamil Nadu emergency and social service numbers." },
  { icon:"📰", title:"Local News",         desc:"Booth, district and state-level government updates in one place." },
];

const STATS = [
  { value:2400000, label:"Citizens Served",   suffix:"M+", divisor:1000000 },
  { value:38,      label:"Districts Covered", suffix:"",   divisor:1 },
  { value:12000,   label:"Issues Resolved",   suffix:"K+", divisor:1000 },
  { value:98,      label:"Satisfaction",      suffix:"%",  divisor:1 },
];

function useCountUp(target, started) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [started, target]);
  return val;
}

function StatCard({ value, label, suffix, divisor }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, started);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold:0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const display = divisor > 1 ? (count / divisor).toFixed(1) : count;
  return (
    <div ref={ref} style={{ textAlign:"center", padding:"24px 16px", background:"rgba(255,255,255,0.12)", borderRadius:20, border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(8px)" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:36, color:C.goldL, lineHeight:1 }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginTop:6, fontWeight:600, letterSpacing:0.5 }}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ fontFamily:"'Source Sans 3',sans-serif", background:"#fff", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Sans+3:wght@400;600;700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .fadeUp { animation: fadeUp 0.65s ease forwards; }
        .d1 { animation-delay:0.1s; opacity:0; }
        .d2 { animation-delay:0.2s; opacity:0; }
        .d3 { animation-delay:0.3s; opacity:0; }
        .d4 { animation-delay:0.45s; opacity:0; }
        .d5 { animation-delay:0.6s; opacity:0; }
        .float { animation: float 5s ease-in-out infinite; }
        .feat:hover { transform:translateY(-6px) !important; box-shadow:0 24px 48px rgba(123,28,28,0.1) !important; }
        .feat { transition: all 0.3s ease !important; }
        .btn-gold:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(201,152,42,0.45) !important; }
        .btn-gold { transition: all 0.2s ease; }
        .btn-outline:hover { background:rgba(255,255,255,0.2) !important; }
        .btn-outline { transition: background 0.2s ease; }
        .step-card:hover { transform:translateY(-4px); }
        .step-card { transition: transform 0.25s ease; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100, height:66,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 clamp(20px,5vw,60px)",
        background: scrolled ? "rgba(90,16,16,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        transition:"all 0.35s ease",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => window.scrollTo(0,0)}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:"1px solid rgba(255,255,255,0.25)" }}>🏛️</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:"#fff", lineHeight:1 }}>People Connect</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", letterSpacing:1.2, textTransform:"uppercase" }}>Tamil Nadu</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-outline" onClick={() => navigate("/login")} style={{ padding:"8px 22px", borderRadius:50, border:"1.5px solid rgba(255,255,255,0.4)", background:"transparent", color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer" }}>Sign In</button>
          <button className="btn-gold" onClick={() => navigate("/register")} style={{ padding:"8px 22px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.gold},${C.goldL})`, color:C.dark, fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:`0 4px 16px rgba(201,152,42,0.35)` }}>Get Started</button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", background:`linear-gradient(145deg,${C.dark} 0%,${C.maroon} 55%,#AA3535 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px clamp(20px,5vw,60px) 60px", position:"relative", overflow:"hidden" }}>
        {/* Decorative blobs */}
        <div className="float" style={{ position:"absolute", top:"-8%", right:"-6%", width:420, height:420, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-5%", left:"-4%", width:320, height:320, borderRadius:"50%", background:`rgba(201,152,42,0.07)`, pointerEvents:"none" }} />
        {/* Dot grid */}
        <div style={{ position:"absolute", top:80, left:40, display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:14, opacity:0.08, pointerEvents:"none" }}>
          {Array.from({length:36}).map((_,i) => <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:"#fff" }} />)}
        </div>

        {/* Badge */}
        <div className="fadeUp d1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", borderRadius:50, padding:"8px 20px", marginBottom:28, border:"1px solid rgba(255,255,255,0.18)" }}>
          <span>🇮🇳</span>
          <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)", letterSpacing:0.8 }}>OFFICIAL GOVERNMENT OF TAMIL NADU PORTAL</span>
        </div>

        {/* Headline */}
        <h1 className="fadeUp d2" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(40px,7vw,80px)", color:"#fff", textAlign:"center", lineHeight:1.05, marginBottom:10, maxWidth:820 }}>
          People Connect
        </h1>
        <h2 className="fadeUp d3" style={{
          fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(16px,2.5vw,28px)",
          background:`linear-gradient(90deg, ${C.goldL}, #fff 50%, ${C.goldL})`,
          backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"shimmer 3.5s linear infinite",
          textAlign:"center", marginBottom:22,
        }}>Tamil Nadu Public Service Platform</h2>
        <p className="fadeUp d3" style={{ fontSize:"clamp(14px,1.6vw,17px)", color:"rgba(255,255,255,0.72)", textAlign:"center", maxWidth:580, lineHeight:1.75, marginBottom:44 }}>
          Empowering citizens across 38 districts to report civic issues, track resolutions, discover welfare programs and stay connected with local governance — all in one place.
        </p>

        {/* CTA */}
        <div className="fadeUp d4" style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:64 }}>
          <button className="btn-gold" onClick={() => navigate("/login")} style={{ padding:"15px 36px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.gold},${C.goldL})`, color:C.dark, fontFamily:"'Source Sans 3',sans-serif", fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:`0 6px 24px rgba(201,152,42,0.4)` }}>
            🏛️ Admin Dashboard →
          </button>
          <button className="btn-outline" onClick={() => navigate("/register")} style={{ padding:"15px 36px", borderRadius:50, border:"2px solid rgba(255,255,255,0.35)", background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:16, cursor:"pointer" }}>
            Create Account
          </button>
        </div>

        {/* Stats */}
        <div className="fadeUp d5" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, width:"100%", maxWidth:720 }}>
          {STATS.map((s,i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Scroll hint */}
        <div className="float" style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.35)", fontSize:22 }}>↓</div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background:C.bg, padding:"80px clamp(20px,5vw,60px)" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.maroon, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>What We Offer</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(26px,4vw,42px)", color:C.text, marginBottom:14 }}>Everything in One Place</h2>
          <p style={{ fontSize:15, color:C.muted, maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>A unified platform connecting citizens, workers and administrators across Tamil Nadu.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, maxWidth:1100, margin:"0 auto" }}>
          {FEATURES.map((f,i) => (
            <div key={i} className="feat" style={{ background:"#fff", borderRadius:20, padding:"28px 22px", border:`1px solid ${C.border}`, boxShadow:"0 2px 12px rgba(0,0,0,0.04)", cursor:"default" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${C.maroon}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:16, border:`1px solid ${C.maroon}18` }}>{f.icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:C.text, marginBottom:8 }}>{f.title}</h3>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:"#fff", padding:"80px clamp(20px,5vw,60px)" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.maroon, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Simple Process</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(26px,4vw,42px)", color:C.text }}>How It Works</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:28, maxWidth:860, margin:"0 auto" }}>
          {[
            { n:"01", icon:"📱", title:"Register",     desc:"Create your account with phone OTP verification in 2 minutes." },
            { n:"02", icon:"📝", title:"Report Issue",  desc:"Describe the issue, add photos or videos, and submit with booth details." },
            { n:"03", icon:"👷", title:"Get Assigned",  desc:"Your complaint is instantly assigned to your local booth worker." },
            { n:"04", icon:"✅", title:"Resolved",      desc:"Track progress and get confirmation when your issue is resolved." },
          ].map((s,i) => (
            <div key={i} className="step-card" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:60, color:`${C.maroon}10`, lineHeight:1, marginBottom:-10 }}>{s.n}</div>
              <div style={{ width:60, height:60, borderRadius:18, background:`linear-gradient(135deg,${C.maroon},${C.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto 14px", boxShadow:`0 6px 20px ${C.maroon}30` }}>{s.icon}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:C.text, marginBottom:8 }}>{s.title}</h3>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ background:`linear-gradient(135deg,${C.dark},${C.maroon},#AA3535)`, padding:"72px clamp(20px,5vw,60px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:200, height:200, borderRadius:"50%", background:`rgba(201,152,42,0.07)`, pointerEvents:"none" }} />
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"clamp(22px,4vw,38px)", color:"#fff", marginBottom:12, position:"relative" }}>
          Ready to Make Tamil Nadu Better?
        </h2>
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginBottom:36, position:"relative" }}>
          Join thousands of citizens making a difference, one complaint at a time.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", position:"relative" }}>
          <button className="btn-gold" onClick={() => navigate("/register")} style={{ padding:"14px 32px", borderRadius:50, border:"none", background:`linear-gradient(135deg,${C.gold},${C.goldL})`, color:C.dark, fontFamily:"'Source Sans 3',sans-serif", fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:`0 4px 20px rgba(201,152,42,0.4)` }}>
            Get Started Free →
          </button>
          <button className="btn-outline" onClick={() => navigate("/login")} style={{ padding:"14px 32px", borderRadius:50, border:"2px solid rgba(255,255,255,0.35)", background:"transparent", color:"#fff", fontFamily:"'Source Sans 3',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer" }}>
            Admin Login
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:C.dark, padding:"28px clamp(20px,5vw,60px)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>🏛️</span>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:"#fff" }}>People Connect</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Tamil Nadu Government Portal</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>© 2025 Government of Tamil Nadu. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}