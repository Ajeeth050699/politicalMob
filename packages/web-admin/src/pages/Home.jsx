import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../config";
const THEMES = {
  light: {
    bg: "#FFFFFF",
    bgAlt: "#F8F6F3",
    bgCard: "#FFFFFF",
    text: "#1A1A1A",
    textLight: "#6B6B6B",
    textMuted: "#9B9B9B",
    border: "rgba(0,0,0,0.07)",
    shadow: "rgba(0,0,0,0.08)",
    navBg: "rgba(255,255,255,0.97)",
    navBorder: "rgba(0,0,0,0.06)",
    footerBg: "#111",
    inputBg: "#F8F6F3",
    inputBorder: "rgba(0,0,0,0.12)",
    maroon: "#7B1C1C",
    maroonDark: "#5A1010",
    maroonLight: "#9B2C2C",
    gold: "#C9982A",
    goldLight: "#E8B84B",
    goldPale: "#FFF8E7",
  },
  dark: {
    bg: "#0F0F0F",
    bgAlt: "#1A1A1A",
    bgCard: "#1E1E1E",
    text: "#F0EDE8",
    textLight: "#A8A39C",
    textMuted: "#6B6663",
    border: "rgba(255,255,255,0.08)",
    shadow: "rgba(0,0,0,0.4)",
    navBg: "rgba(15,15,15,0.97)",
    navBorder: "rgba(255,255,255,0.07)",
    footerBg: "#080808",
    inputBg: "#252525",
    inputBorder: "rgba(255,255,255,0.1)",
    maroon: "#C0524A",
    maroonDark: "#9B3A34",
    maroonLight: "#D4716A",
    gold: "#D4A843",
    goldLight: "#ECC55A",
    goldPale: "#1F1A0F",
  },
};

const T = {
  en: {
    brand: "People Connect",
    tagline: "Tamil Nadu · Political Public Service Platform",
    nav: ["Services", "How It Works", "Emergency", "Education"],
    loginBtn: "Login",
    signupBtn: "Sign Up",
    reportBtn: "Report Issue",
    h1: ["Your Voice.", "Your Booth.", "Your Tamil Nadu."],
    heroDesc:
      "Connecting citizens directly with booth-level party workers to report, resolve, and track public issues — from street lights to drainage, all in one platform.",
    dlApp: "Download the App",
    adminDash: "Admin Dashboard →",
    liveTracker: "LIVE COMPLAINT TRACKER",
    live: "● Live",
    statLabels: [
      "Citizens Served",
      "Daily Complaints",
      "Active Booths",
      "Resolution Rate",
    ],
    svcTag: "What We Offer",
    svcTitle: "Empowering Public Service",
    svcDesc:
      "Six core modules designed to bridge the gap between citizens and their elected representatives.",
    services: [
      {
        icon: "🛣️",
        title: "Complaint Management",
        desc: "Submit civic issues — road damage, street lights, water supply — directly to your booth worker with real-time status tracking.",
      },
      {
        icon: "📰",
        title: "Local & State News",
        desc: "Stay informed with booth-level announcements, district updates, and Tamil Nadu development news in one place.",
      },
      {
        icon: "🎓",
        title: "Skill Development",
        desc: "Access educational videos, take online exams, and earn downloadable certificates for career and personal growth.",
      },
      {
        icon: "📢",
        title: "Special Camps",
        desc: "Get notified about medical camps, blood donation drives, women welfare events, and employment guidance sessions.",
      },
      {
        icon: "🛡️",
        title: "Emergency Contacts",
        desc: "One-tap access to Police, Ambulance, Fire Service, Women Helpline, Child Helpline and District Control Room.",
      },
      {
        icon: "👤",
        title: "Worker Dashboard",
        desc: "Booth-level party workers receive complaints, update resolution status, and post local announcements directly.",
      },
    ],
    howTag: "Simple Process",
    howTitle: "How It Works",
    steps: [
      {
        num: "01",
        title: "Submit Complaint",
        desc: "Select category, describe the issue, confirm your booth number.",
      },
      {
        num: "02",
        title: "Auto-Assigned",
        desc: "System instantly routes complaint to your booth-level party worker.",
      },
      {
        num: "03",
        title: "Worker Acts",
        desc: "Worker receives notification and begins resolving the issue on ground.",
      },
      {
        num: "04",
        title: "Track & Resolve",
        desc: "Follow status updates — NEW → IN PROGRESS → COMPLETED — in real time.",
      },
    ],
    emgTitle: "Emergency Contacts",
    emgDesc:
      "One tap to connect — available directly from your app's home screen, 24/7.",
    eduTag: "For Students & Women",
    eduTitle: "Skill Development & Education Hub",
    eduDesc:
      "Access educational videos, competitive exam preparation, women's skill development courses — all free, designed for Tamil Nadu citizens.",
    eduFeatures: [
      "Educational Videos & GK",
      "Competitive Exam Prep",
      "Women Skill Development",
      "Online Exams + Certificates",
    ],
    exploreCourses: "Explore Courses →",
    ctaTitle: "Ready to Make Your Voice Heard?",
    ctaDesc:
      "Join thousands of Tamil Nadu citizens already reporting issues and transforming their communities.",
    adminLogin: "Admin Login",
    learnMore: "Learn more",
    modalTitle: "Report a Complaint",
    modalSub:
      "Submit your civic issue — routed to your booth worker immediately.",
    fName: "Full Name",
    fPhone: "Phone Number",
    fBooth: "Booth Number",
    fCat: "Complaint Category",
    fDesc: "Describe Your Issue",
    fDescPh: "Please describe the problem in detail...",
    submitBtn: "Submit Complaint",
    cancelBtn: "Cancel",
    successTitle: "Complaint Submitted!",
    successMsg:
      "Your complaint has been registered and assigned to your booth worker. You'll receive SMS updates.",
    cats: [
      "Street Light Problem",
      "Road Damage",
      "Garbage Issue",
      "Water Supply Problem",
      "Drainage Issue",
      "Public Safety Issue",
      "Others",
    ],
    selectCat: "Select a category",
    required: "This field is required",
    complaints: [
      { cat: "Road Damage", booth: "Booth #47", time: "2h ago" },
      { cat: "Street Light", booth: "Booth #12", time: "5h ago" },
      { cat: "Water Supply", booth: "Booth #89", time: "1h ago" },
    ],
    statuses: ["COMPLETED", "IN PROGRESS", "NEW"],
    eduCounts: ["120+", "45+", "Free", "30+"],
    eduCards: [
      "Video Lessons",
      "Practice Exams",
      "Certificates",
      "Women Courses",
    ],
    copyright: "© 2025 People Connect · Tamil Nadu · Owner: Santhosh",
    footerLinks: ["Privacy Policy", "Terms of Use", "Contact Support"],
    footerCols: [
      {
        title: "Platform",
        links: ["Report Issue", "Track Complaint", "Local News", "Emergency"],
      },
      {
        title: "Resources",
        links: [
          "Education Hub",
          "Skill Videos",
          "Online Exams",
          "Certificates",
        ],
      },
      {
        title: "Admin",
        links: ["Admin Login", "Worker Portal", "Analytics", "Support"],
      },
    ],
    loginTitle: "Welcome Back",
    loginSub: "Sign in to your People Connect account",
    signupTitle: "Create Account",
    signupSub: "Join People Connect and make your voice heard",
    emailLabel: "Email Address",
    passLabel: "Password",
    confirmPass: "Confirm Password",
    nameLabel: "Full Name",
    phoneLabel: "Phone Number",
    forgotPass: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    orContinue: "or continue with",
    roleLabel: "Register as",
    roles: ["Citizen", "Party Worker", "Admin"],
    submitLogin: "Sign In",
    submitSignup: "Create Account",
    switchToSignup: "Sign Up",
    switchToLogin: "Sign In",
  },
  ta: {
    brand: "மக்கள் இணைப்பு",
    tagline: "தமிழ்நாடு · அரசியல் பொது சேவை தளம்",
    nav: ["சேவைகள்", "எப்படி செயல்படுகிறது", "அவசர நிலை", "கல்வி"],
    loginBtn: "உள்நுழைவு",
    signupBtn: "பதிவு செய்க",
    reportBtn: "புகார் அளிக்க",
    h1: ["உங்கள் குரல்.", "உங்கள் பூத்.", "உங்கள் தமிழ்நாடு."],
    heroDesc:
      "நகராட்சி சிக்கல்களை நேரடியாக பூத் அளவிலான கட்சி பணியாளர்களிடம் தெரிவிக்க, தீர்க்க மற்றும் கண்காணிக்க உதவும் தளம்.",
    dlApp: "பயன்பாட்டை பதிவிறக்கவும்",
    adminDash: "நிர்வாக டாஷ்போர்டு →",
    liveTracker: "நேரடி புகார் கண்காணிப்பு",
    live: "● நேரடி",
    statLabels: [
      "குடிமக்கள்",
      "தினசரி புகார்கள்",
      "செயலில் உள்ள பூத்கள்",
      "தீர்வு விகிதம்",
    ],
    svcTag: "நாங்கள் வழங்குவது",
    svcTitle: "பொது சேவையை மேம்படுத்துதல்",
    svcDesc:
      "குடிமக்களுக்கும் தேர்ந்தெடுக்கப்பட்ட பிரதிநிதிகளுக்கும் இடையிலான இடைவெளியை குறைக்க வடிவமைக்கப்பட்ட ஆறு தொகுதிகள்.",
    services: [
      {
        icon: "🛣️",
        title: "புகார் மேலாண்மை",
        desc: "சாலை சேதம், தெரு விளக்கு, குடிநீர் விநியோகம் போன்ற புகார்களை நேரடியாக பூத் பணியாளரிடம் சமர்ப்பிக்கவும்.",
      },
      {
        icon: "📰",
        title: "உள்ளூர் செய்திகள்",
        desc: "பூத் அளவிலான அறிவிப்புகள், மாவட்ட புதுப்பிப்புகள் மற்றும் தமிழ்நாடு வளர்ச்சி செய்திகளை பெறுங்கள்.",
      },
      {
        icon: "🎓",
        title: "திறன் மேம்பாடு",
        desc: "கல்வி வீடியோக்கள் பார்க்கவும், ஆன்லைன் தேர்வுகள் எழுதவும், சான்றிதழ்கள் பெறவும்.",
      },
      {
        icon: "📢",
        title: "சிறப்பு முகாம்கள்",
        desc: "மருத்துவ முகாம்கள், இரத்த தான முகாம்கள், மகளிர் நலன் நிகழ்வுகள் பற்றி அறிவிப்புகள் பெறுங்கள்.",
      },
      {
        icon: "🛡️",
        title: "அவசர தொடர்புகள்",
        desc: "காவல்துறை, ஆம்புலன்ஸ், தீயணைப்பு, மகளிர் உதவி எண் — ஒரே தட்டலில் தொடர்பு கொள்ளுங்கள்.",
      },
      {
        icon: "👤",
        title: "பணியாளர் டாஷ்போர்டு",
        desc: "பூத் பணியாளர்கள் புகார்களை ஏற்று, நிலை புதுப்பித்து, உள்ளூர் அறிவிப்புகள் வெளியிடலாம்.",
      },
    ],
    howTag: "எளிய செயல்முறை",
    howTitle: "எப்படி செயல்படுகிறது",
    steps: [
      {
        num: "01",
        title: "புகார் சமர்ப்பிக்கவும்",
        desc: "வகையை தேர்ந்தெடுத்து, சிக்கலை விவரித்து, உங்கள் பூத் எண்ணை உறுதிப்படுத்தவும்.",
      },
      {
        num: "02",
        title: "தானாக ஒதுக்கப்படும்",
        desc: "உங்கள் பூத் பணியாளரிடம் புகார் உடனடியாக அனுப்பப்படும்.",
      },
      {
        num: "03",
        title: "பணியாளர் செயல்படுவார்",
        desc: "பணியாளர் அறிவிப்பு பெற்று களத்தில் சிக்கலை தீர்க்க தொடங்குவார்.",
      },
      {
        num: "04",
        title: "கண்காணி & தீர்வு",
        desc: "புதிய → செயல்பாட்டில் → முடிந்தது — நிலை புதுப்பிப்புகளை நேரடியாக பாருங்கள்.",
      },
    ],
    emgTitle: "அவசர தொடர்புகள்",
    emgDesc:
      "ஒரே தட்டலில் தொடர்பு கொள்ளுங்கள் — உங்கள் பயன்பாட்டில் 24/7 கிடைக்கும்.",
    eduTag: "மாணவர்கள் & மகளிருக்காக",
    eduTitle: "திறன் மேம்பாடு & கல்வி மையம்",
    eduDesc:
      "கல்வி வீடியோக்கள், போட்டி தேர்வு தயாரிப்பு, மகளிர் திறன் மேம்பாடு — அனைத்தும் இலவசம்.",
    eduFeatures: [
      "கல்வி வீடியோக்கள் & பொது அறிவு",
      "போட்டி தேர்வு தயாரிப்பு",
      "மகளிர் திறன் மேம்பாடு",
      "ஆன்லைன் தேர்வுகள் + சான்றிதழ்கள்",
    ],
    exploreCourses: "பாடங்களை காண →",
    ctaTitle: "உங்கள் குரல் கேட்கப்பட தயாரா?",
    ctaDesc:
      "ஆயிரக்கணக்கான தமிழ்நாடு குடிமக்களுடன் சேர்ந்து உங்கள் சமுதாயத்தை மாற்றுங்கள்.",
    adminLogin: "நிர்வாக உள்நுழைவு",
    learnMore: "மேலும் அறிக",
    modalTitle: "புகார் அளிக்கவும்",
    modalSub: "உங்கள் நகராட்சி சிக்கலை சமர்ப்பிக்கவும்.",
    fName: "முழு பெயர்",
    fPhone: "தொலைபேசி எண்",
    fBooth: "பூத் எண்",
    fCat: "புகார் வகை",
    fDesc: "சிக்கலை விவரிக்கவும்",
    fDescPh: "சிக்கலை விரிவாக விவரிக்கவும்...",
    submitBtn: "புகார் சமர்ப்பிக்கவும்",
    cancelBtn: "ரத்து செய்",
    successTitle: "புகார் சமர்ப்பிக்கப்பட்டது!",
    successMsg:
      "உங்கள் புகார் பதிவு செய்யப்பட்டு பூத் பணியாளரிடம் ஒதுக்கப்பட்டது.",
    cats: [
      "தெரு விளக்கு சிக்கல்",
      "சாலை சேதம்",
      "குப்பை சிக்கல்",
      "குடிநீர் விநியோக சிக்கல்",
      "வடிகால் சிக்கல்",
      "பொது பாதுகாப்பு சிக்கல்",
      "மற்றவை",
    ],
    selectCat: "வகையை தேர்ந்தெடுக்கவும்",
    required: "இந்த தகவல் தேவை",
    complaints: [
      { cat: "சாலை சேதம்", booth: "பூத் #47", time: "2 மணி முன்பு" },
      { cat: "தெரு விளக்கு", booth: "பூத் #12", time: "5 மணி முன்பு" },
      { cat: "குடிநீர் விநியோகம்", booth: "பூத் #89", time: "1 மணி முன்பு" },
    ],
    statuses: ["முடிந்தது", "செயல்பாட்டில்", "புதிய"],
    eduCounts: ["120+", "45+", "இலவசம்", "30+"],
    eduCards: [
      "வீடியோ பாடங்கள்",
      "பயிற்சி தேர்வுகள்",
      "சான்றிதழ்கள்",
      "மகளிர் பாடங்கள்",
    ],
    copyright: "© 2025 மக்கள் இணைப்பு · தமிழ்நாடு · உரிமையாளர்: சந்தோஷ்",
    footerLinks: [
      "தனியுரிமை கொள்கை",
      "பயன்பாட்டு விதிமுறைகள்",
      "ஆதரவை தொடர்பு கொள்ள",
    ],
    footerCols: [
      {
        title: "தளம்",
        links: [
          "புகார் அளிக்க",
          "புகார் கண்காணி",
          "உள்ளூர் செய்திகள்",
          "அவசர நிலை",
        ],
      },
      {
        title: "ஆதாரங்கள்",
        links: [
          "கல்வி மையம்",
          "திறன் வீடியோக்கள்",
          "ஆன்லைன் தேர்வுகள்",
          "சான்றிதழ்கள்",
        ],
      },
      {
        title: "நிர்வாகம்",
        links: [
          "நிர்வாக உள்நுழைவு",
          "பணியாளர் போர்டல்",
          "பகுப்பாய்வு",
          "ஆதரவு",
        ],
      },
    ],
    loginTitle: "மீண்டும் வருக",
    loginSub: "உங்கள் மக்கள் இணைப்பு கணக்கில் உள்நுழையவும்",
    signupTitle: "கணக்கு உருவாக்கவும்",
    signupSub: "மக்கள் இணைப்பில் இணைந்து உங்கள் குரலை கேட்பிக்கவும்",
    emailLabel: "மின்னஞ்சல் முகவரி",
    passLabel: "கடவுச்சொல்",
    confirmPass: "கடவுச்சொல் உறுதிப்படுத்தல்",
    nameLabel: "முழு பெயர்",
    phoneLabel: "தொலைபேசி எண்",
    forgotPass: "கடவுச்சொல் மறந்தீர்களா?",
    noAccount: "கணக்கு இல்லையா?",
    hasAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    orContinue: "அல்லது தொடரவும்",
    roleLabel: "பதிவு செய்யும் வகை",
    roles: ["குடிமக்கள்", "கட்சி பணியாளர்", "நிர்வாகி"],
    submitLogin: "உள்நுழைவு",
    submitSignup: "கணக்கு உருவாக்கவும்",
    switchToSignup: "பதிவு செய்க",
    switchToLogin: "உள்நுழைவு",
  },
};

const useScrollY = () => {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
};

const useInView = () => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVis(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
  const [ref, vis] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ${delay}s, transform 0.65s ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const scrollY = useScrollY();
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup'
  const [authTab, setAuthTab] = useState("login");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    booth: "",
    category: "",
    desc: "",
  });
  const [errors, setErrors] = useState({});
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "public",
  });
  const [authErrors, setAuthErrors] = useState({});
  const [authSuccess, setAuthSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [activeC, setActiveC] = useState(null);

  const tx = T[lang];
  const C = dark ? THEMES.dark : THEMES.light;
  const navScrolled = scrollY > 60;
  const cColors = ["#22c55e", C.gold, "#ef4444"];

  const inp = (err, filled) => ({
    width: "100%",
    padding: "12px 15px",
    borderRadius: 10,
    border: `1.5px solid ${err ? "#ef4444" : filled ? C.gold : C.inputBorder}`,
    background: C.inputBg,
    color: C.text,
    fontFamily: "'Source Sans 3',sans-serif",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  });

  const validateComplaint = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.phone.trim()) e.phone = true;
    if (!form.booth.trim()) e.booth = true;
    if (!form.category) e.category = true;
    if (!form.desc.trim()) e.desc = true;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateAuth = () => {
    const e = {};
    if (authTab === "signup" && !authForm.name.trim()) e.name = true;
    if (!authForm.email.trim() || !authForm.email.includes("@")) e.email = true;
    if (!authForm.password || authForm.password.length < 6) e.password = true;
    if (authTab === "signup" && authForm.password !== authForm.confirmPassword)
      e.confirmPassword = true;
    if (authTab === "signup" && !authForm.phone.trim()) e.phone = true;
    setAuthErrors(e);
    return !Object.keys(e).length;
  };

  const handleComplaintSubmit = () => {
    if (validateComplaint()) {
      setSubmitted(true);
      setTimeout(() => {
        setModal(false);
        setSubmitted(false);
        setForm({ name: "", phone: "", booth: "", category: "", desc: "" });
      }, 3200);
    }
  };

  const handleAuthSubmit = async () => {
    if (!validateAuth()) {
      return;
    }

    const url = authTab === 'login'
      ? `${API_URL}/api/auth/login`
      : `${API_URL}/api/auth/register`;

    const payload = authTab === 'login'
      ? { email: authForm.email, password: authForm.password }
      : { name: authForm.name, email: authForm.email, password: authForm.password, phone: authForm.phone, role: authForm.role };

    try {
      setAuthErrors({}); // Clear previous errors
      const { data } = await axios.post(url, payload);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthModal(null);
        setAuthSuccess(false);
        setAuthForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "public",
        });
        navigate('/dashboard/overview');
      }, 1500);
    } catch (error) {
      const message = error.response?.data?.message || `An unknown error occurred during ${authTab}.`;
      setAuthErrors({ api: message });
    }
  };

  const openAuth = (type) => {
    setAuthTab(type);
    setAuthModal(type);
    setAuthErrors({});
    setAuthSuccess(false);
  };

  return (
    <div
      style={{
        fontFamily: "'Georgia',serif",
        background: C.bg,
        color: C.text,
        overflowX: "hidden",
        transition: "background 0.4s,color 0.4s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{width:100%;overflow-x:hidden;scroll-behavior:smooth;}
        input::placeholder,textarea::placeholder{color:#9B9B9B;}
        .hov-gold{transition:color 0.2s;}
        .hov-gold:hover{color:${C.goldLight}!important;}
        .card-hov{transition:all 0.35s;}
        .card-hov:hover{transform:translateY(-10px);box-shadow:0 22px 52px rgba(123,28,28,0.13)!important;}
        .step-hov{transition:transform 0.3s;}
        .step-hov:hover{transform:translateY(-6px);}
        .emg-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.07);border:1px solid rgba(201,152,42,0.25);border-radius:16px;padding:20px 10px;cursor:pointer;transition:all 0.3s;text-decoration:none;}
        .emg-btn:hover{background:rgba(201,152,42,0.15);border-color:rgba(201,152,42,0.6);transform:translateY(-4px);}
        .pri-btn{background:linear-gradient(135deg,#C9982A,#E8B84B);color:#5A1010;border-radius:50px;font-family:'Source Sans 3',sans-serif;font-weight:700;border:none;cursor:pointer;transition:all 0.3s;box-shadow:0 6px 24px rgba(201,152,42,0.35);letter-spacing:.3px;}
        .pri-btn:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(201,152,42,0.5);}
        .sec-btn{background:transparent;color:white;border-radius:50px;font-family:'Source Sans 3',sans-serif;font-weight:600;border:2px solid rgba(255,255,255,0.5);cursor:pointer;transition:all 0.3s;}
        .sec-btn:hover{background:rgba(255,255,255,0.1);border-color:white;transform:translateY(-2px);}
        .nav-login{background:transparent;border-radius:8px;font-family:'Source Sans 3',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;padding:8px 18px;}
        .nav-signup{border-radius:8px;font-family:'Source Sans 3',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.25s;padding:8px 20px;}
        .modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;}
        .social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;border-radius:10px;border:1.5px solid;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-weight:600;font-size:14px;transition:all 0.2s;}
        .social-btn:hover{transform:translateY(-1px);}
        .tab-btn{flex:1;padding:12px;border:none;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-weight:700;font-size:15px;transition:all 0.25s;border-radius:10px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes progress{from{width:0}to{width:100%}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.srv-grid{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:768px){
          .hbg{display:flex!important;}
          .desk-nav{display:none!important;}
          .hero-btns{flex-direction:column;align-items:center;}
          .hero-btns button,.hero-btns a{width:100%;max-width:300px;text-align:center;}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .srv-grid{grid-template-columns:1fr!important;}
          .step-grid{grid-template-columns:1fr 1fr!important;}
          .emg-grid{grid-template-columns:repeat(3,1fr)!important;}
          .edu-grid{grid-template-columns:1fr!important;}
          .foot-inner{flex-direction:column!important;gap:32px!important;}
          .auth-inner{grid-template-columns:1fr!important;}
        }
        @media(max-width:520px){
          .step-grid{grid-template-columns:1fr!important;}
          .emg-grid{grid-template-columns:repeat(2,1fr)!important;}
          .auth-form-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: "0 32px",
          background: navScrolled ? C.navBg : "transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          boxShadow: navScrolled ? `0 2px 30px ${C.shadow}` : "none",
          borderBottom: navScrolled ? `1px solid ${C.navBorder}` : "none",
          transition: "all 0.4s",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 68,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg,${C.maroon},${C.maroonLight})`,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🏛️
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 20,
                color: navScrolled ? C.maroon : "white",
                whiteSpace: "nowrap",
              }}
            >
              {tx.brand}
            </span>
          </div>

          {/* Desktop nav links */}
          <div
            className="desk-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {tx.nav.map((n, i) => (
              <a
                key={i}
                href={`#sec-${i}`}
                className="hov-gold"
                style={{
                  color: navScrolled ? C.textLight : "rgba(255,255,255,0.85)",
                  textDecoration: "none",
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 14.5,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {n}
              </a>
            ))}
          </div>

          {/* Desktop right controls */}
          <div
            className="desk-nav"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {/* Lang */}
            <button
              onClick={() => setLang((l) => (l === "en" ? "ta" : "en"))}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                border: `1.5px solid ${navScrolled ? C.maroon : "rgba(255,255,255,0.5)"}`,
                color: navScrolled ? C.maroon : "white",
                background: "transparent",
              }}
            >
              {lang === "en" ? "தமிழ்" : "EN"}
            </button>
            {/* Dark */}
            <button
              onClick={() => setDark((d) => !d)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: "50%",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {/* Login */}
            <button
              className="nav-login"
              onClick={() => openAuth("login")}
              style={{
                color: navScrolled ? C.maroon : "white",
                border: `1.5px solid ${navScrolled ? C.maroon : "rgba(255,255,255,0.5)"}`,
              }}
            >
              {tx.loginBtn}
            </button>

            {/* Sign Up */}
            <button
              className="nav-signup pri-btn"
              onClick={() => openAuth("signup")}
              style={{ fontSize: 14, padding: "9px 20px" }}
            >
              {tx.signupBtn}
            </button>
          </div>

          {/* Mobile right */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setDark((d) => !d)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 17,
                padding: "6px",
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setLang((l) => (l === "en" ? "ta" : "en"))}
              style={{
                padding: "5px 10px",
                borderRadius: 16,
                fontSize: 11,
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                border: `1.5px solid ${navScrolled ? C.maroon : "rgba(255,255,255,0.5)"}`,
                color: navScrolled ? C.maroon : "white",
                background: "transparent",
              }}
            >
              {lang === "en" ? "TA" : "EN"}
            </button>
            {/* Hamburger */}
            <button
              className="hbg"
              onClick={() => setMenu(!menu)}
              style={{
                display: "none",
                flexDirection: "column",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 2px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    width: 22,
                    height: 2,
                    background: navScrolled ? C.text : "white",
                    borderRadius: 2,
                  }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menu && (
          <div
            style={{ background: C.navBg, borderTop: `1px solid ${C.border}` }}
          >
            {tx.nav.map((n, i) => (
              <a
                key={i}
                href={`#sec-${i}`}
                onClick={() => setMenu(false)}
                style={{
                  display: "block",
                  padding: "14px 24px",
                  color: C.text,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 15,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {n}
              </a>
            ))}
            <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  openAuth("login");
                  setMenu(false);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.maroon}`,
                  background: "transparent",
                  color: C.maroon,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {tx.loginBtn}
              </button>
              <button
                onClick={() => {
                  openAuth("signup");
                  setMenu(false);
                }}
                className="pri-btn"
                style={{ flex: 1, padding: "12px", fontSize: 14 }}
              >
                {tx.signupBtn}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO — full bleed, no gaps ══════════ */}
      <section
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: `linear-gradient(160deg,${C.maroonDark} 0%,${C.maroon} 52%,#A03030 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Parallax orbs */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "55vw",
            maxWidth: 700,
            height: "55vw",
            maxHeight: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(201,152,42,0.13) 0%,transparent 70%)",
            transform: `translateY(${scrollY * 0.3}px)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "-10%",
            width: "60vw",
            maxWidth: 600,
            height: "60vw",
            maxHeight: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(201,152,42,0.07) 0%,transparent 70%)",
            transform: `translateY(${scrollY * -0.2}px)`,
            pointerEvents: "none",
          }}
        />
        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            transform: `translateY(${scrollY * 0.12}px)`,
            pointerEvents: "none",
          }}
        />
        {/* Decorative */}
        <div
          style={{
            position: "absolute",
            top: "16%",
            right: "6%",
            opacity: 0.1,
            fontSize: 140,
            transform: `translateY(${scrollY * 0.2}px)`,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          🏛️
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "18%",
            opacity: 0.08,
            fontSize: 80,
            transform: `translateY(${scrollY * -0.15}px)`,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          ⚖️
        </div>

        {/* Content — inner padded container */}
        <div
          style={{
            width: "100%",
            maxWidth: 1400,
            margin: "0 auto",
            padding: "110px 32px 72px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ maxWidth: 800, animation: "fadeUp 0.75s ease both" }}>
            <span
              style={{
                display: "inline-block",
                background: "rgba(201,152,42,0.15)",
                color: C.goldLight,
                padding: "6px 20px",
                borderRadius: 50,
                fontSize: 13,
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                border: "1px solid rgba(201,152,42,0.3)",
                marginBottom: 22,
              }}
            >
              {tx.tagline}
            </span>

            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: "clamp(40px,7.5vw,88px)",
                lineHeight: 1.04,
                color: "white",
                marginBottom: 26,
                letterSpacing: "-2px",
              }}
            >
              {tx.h1[0]}
              <br />
              <span style={{ color: C.goldLight }}>{tx.h1[1]}</span>
              <br />
              {tx.h1[2]}
            </h1>

            <p
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 300,
                fontSize: "clamp(15px,2.2vw,19px)",
                color: "rgba(255,255,255,0.78)",
                lineHeight: 1.78,
                maxWidth: 580,
                marginBottom: 42,
              }}
            >
              {tx.heroDesc}
            </p>

            <div
              className="hero-btns"
              style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
            >
              <button
                className="pri-btn"
                style={{ padding: "17px 44px", fontSize: 17 }}
                onClick={() => setModal(true)}
              >
                🏴 {tx.reportBtn}
              </button>
              <button
                className="sec-btn"
                style={{ padding: "17px 44px", fontSize: 17 }}
              >
                {tx.adminDash}
              </button>
            </div>

            {/* Live tracker card */}
            <div
              style={{
                marginTop: 52,
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: 20,
                padding: 22,
                maxWidth: 530,
                animation: "fadeUp 0.75s ease 0.25s both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 1.5,
                  }}
                >
                  {tx.liveTracker}
                </span>
                <span
                  style={{
                    background: "rgba(34,197,94,0.2)",
                    color: "#4ade80",
                    padding: "4px 12px",
                    borderRadius: 50,
                    fontSize: 12,
                  }}
                >
                  {tx.live}
                </span>
              </div>
              {tx.complaints.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setActiveC(activeC === i ? null : i)}
                  style={{
                    background:
                      activeC === i
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${activeC === i ? "rgba(201,152,42,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 11,
                    padding: "13px 17px",
                    marginBottom: 7,
                    cursor: "pointer",
                    transition: "all 0.25s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "white",
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {c.cat}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 12,
                          marginLeft: 10,
                        }}
                      >
                        {c.booth}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 11,
                        }}
                      >
                        {c.time}
                      </span>
                      <span
                        style={{
                          background: cColors[i],
                          color: "white",
                          padding: "3px 10px",
                          borderRadius: 50,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {tx.statuses[i]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero CTAs — login/signup prominent */}
          <div
            style={{
              marginTop: 52,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 14,
              }}
            >
              Already a member?
            </div>
            <button
              onClick={() => openAuth("login")}
              style={{
                padding: "10px 28px",
                borderRadius: 50,
                border: "1.5px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontFamily: "'Source Sans 3',sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.25s",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                e.currentTarget.style.borderColor = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              }}
            >
              {tx.loginBtn}
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="pri-btn"
              style={{ padding: "10px 28px", fontSize: 14 }}
            >
              {tx.signupBtn} →
            </button>
          </div>
        </div>

        {/* Wave */}
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: 0,
            right: 0,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            style={{ display: "block", width: "100%" }}
          >
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill={C.bg}
            />
          </svg>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section style={{ background: C.bg, padding: "60px 32px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="stat-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
            }}
          >
            {["10L+", "5K+", "234", "98%"].map((v, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "28px 16px",
                    background: i % 2 === 0 ? C.bgAlt : C.bgCard,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "clamp(28px,4vw,44px)",
                      fontWeight: 900,
                      color: C.maroon,
                      lineHeight: 1,
                    }}
                  >
                    {v}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: C.textMuted,
                      marginTop: 8,
                    }}
                  >
                    {tx.statLabels[i]}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SERVICES ══════════ */}
      <section id="sec-0" style={{ padding: "100px 32px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div
                style={{
                  width: 56,
                  height: 3,
                  background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                  borderRadius: 2,
                  margin: "0 auto 14px",
                }}
              />
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(26px,4.5vw,50px)",
                  fontWeight: 900,
                  color: C.maroon,
                  marginBottom: 12,
                }}
              >
                {tx.svcTitle}
              </h2>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 16,
                  color: C.textLight,
                  maxWidth: 500,
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                {tx.svcDesc}
              </p>
            </div>
          </Reveal>
          <div
            className="srv-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 24,
            }}
          >
            {tx.services.map((s, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div
                  className="card-hov"
                  style={{
                    background: C.bgCard,
                    borderRadius: 20,
                    padding: "32px 26px",
                    boxShadow: `0 4px 20px ${C.shadow}`,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      marginBottom: 16,
                      display: "inline-block",
                      background:
                        i % 2 === 0
                          ? "rgba(123,28,28,0.08)"
                          : "rgba(201,152,42,0.1)",
                      padding: "12px 14px",
                      borderRadius: 13,
                    }}
                  >
                    {s.icon}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 19,
                      fontWeight: 700,
                      color: C.maroon,
                      marginBottom: 10,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 14,
                      color: C.textLight,
                      lineHeight: 1.7,
                      marginBottom: 16,
                    }}
                  >
                    {s.desc}
                  </p>
                  <span
                    style={{
                      color: i % 2 === 0 ? C.maroon : C.gold,
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {tx.learnMore} →
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section
        id="sec-1"
        style={{ padding: "100px 32px", background: C.bgAlt }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 68 }}>
              <div
                style={{
                  width: 56,
                  height: 3,
                  background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                  borderRadius: 2,
                  margin: "0 auto 14px",
                }}
              />
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(26px,4.5vw,50px)",
                  fontWeight: 900,
                  color: C.maroon,
                }}
              >
                {tx.howTitle}
              </h2>
            </div>
          </Reveal>
          <div
            className="step-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
            }}
          >
            {tx.steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div
                  className="step-hov"
                  style={{
                    background: C.bgCard,
                    borderRadius: 16,
                    padding: "28px 20px",
                    textAlign: "center",
                    boxShadow: `0 2px 14px ${C.shadow}`,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      margin: "0 auto 16px",
                      background:
                        i % 2 === 0
                          ? `linear-gradient(135deg,${C.maroon},${C.maroonLight})`
                          : `linear-gradient(135deg,${C.gold},${C.goldLight})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 900,
                      fontSize: 19,
                      color: "white",
                      boxShadow: `0 8px 20px ${i % 2 === 0 ? "rgba(123,28,28,0.3)" : "rgba(201,152,42,0.3)"}`,
                    }}
                  >
                    {s.num}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: C.maroon,
                      marginBottom: 9,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: C.textLight,
                      lineHeight: 1.65,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ EMERGENCY ══════════ */}
      <section
        id="sec-2"
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          padding: "100px 32px",
          background: `linear-gradient(135deg,${C.maroonDark},${C.maroon},#8B2020)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "radial-gradient(circle at 2px 2px,white 2px,transparent 0)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 58 }}>
              <div
                style={{
                  width: 56,
                  height: 3,
                  background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                  borderRadius: 2,
                  margin: "0 auto 14px",
                }}
              />
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "clamp(26px,4.5vw,50px)",
                  fontWeight: 900,
                  color: "white",
                  marginBottom: 12,
                }}
              >
                {tx.emgTitle}
              </h2>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 16,
                  color: "rgba(255,255,255,0.6)",
                  maxWidth: 380,
                  margin: "0 auto",
                }}
              >
                {tx.emgDesc}
              </p>
            </div>
          </Reveal>
          <div
            className="emg-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              gap: 14,
            }}
          >
            {[
              ["🚔", "100"],
              ["🚑", "108"],
              ["🚒", "101"],
              ["👩", "181"],
              ["🧒", "1098"],
              ["🏛️", "1077"],
            ].map(([ic, num], i) => (
              <Reveal key={i} delay={i * 0.07}>
                <a href={`tel:${num}`} className="emg-btn">
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{ic}</div>
                  <div
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontWeight: 600,
                      fontSize: 11,
                      color: "white",
                      marginBottom: 5,
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    {
                      [
                        "Police",
                        "Ambulance",
                        "Fire",
                        "Women",
                        "Child",
                        "District",
                      ][i]
                    }
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 900,
                      fontSize: 20,
                      color: C.goldLight,
                    }}
                  >
                    {num}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ EDUCATION ══════════ */}
      <section id="sec-3" style={{ padding: "100px 32px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="edu-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 72,
              alignItems: "center",
            }}
          >
            <Reveal>
              <div>
                <div
                  style={{
                    width: 56,
                    height: 3,
                    background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
                    borderRadius: 2,
                    marginBottom: 14,
                  }}
                />
                <span
                  style={{
                    display: "inline-block",
                    background: dark
                      ? "rgba(201,152,42,0.15)"
                      : "rgba(123,28,28,0.07)",
                    color: C.maroon,
                    padding: "6px 18px",
                    borderRadius: 50,
                    fontSize: 12,
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    border: `1px solid ${dark ? "rgba(201,152,42,0.25)" : "rgba(123,28,28,0.15)"}`,
                    marginBottom: 18,
                  }}
                >
                  {tx.eduTag}
                </span>
                <h2
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "clamp(24px,3.5vw,42px)",
                    fontWeight: 900,
                    color: C.maroon,
                    marginBottom: 16,
                    lineHeight: 1.2,
                  }}
                >
                  {tx.eduTitle}
                </h2>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 15,
                    color: C.textLight,
                    lineHeight: 1.8,
                    marginBottom: 26,
                  }}
                >
                  {tx.eduDesc}
                </p>
                {tx.eduFeatures.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: "white",
                        fontWeight: 700,
                        background:
                          i % 2 === 0
                            ? `linear-gradient(135deg,${C.maroon},${C.maroonLight})`
                            : `linear-gradient(135deg,${C.gold},${C.goldLight})`,
                      }}
                    >
                      ✓
                    </div>
                    <span
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 14,
                        color: C.text,
                      }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
                <button
                  className="pri-btn"
                  style={{ marginTop: 28, padding: "14px 36px", fontSize: 15 }}
                >
                  {tx.exploreCourses}
                </button>
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {tx.eduCards.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      background:
                        i === 0 || i === 3
                          ? `linear-gradient(135deg,${C.maroon},${C.maroonLight})`
                          : `linear-gradient(135deg,${C.gold},${C.goldLight})`,
                      borderRadius: 20,
                      padding: "28px 20px",
                      transform:
                        i % 2 === 1 ? "translateY(18px)" : "translateY(0)",
                      boxShadow: `0 12px 34px ${i === 0 || i === 3 ? "rgba(123,28,28,0.22)" : "rgba(201,152,42,0.22)"}`,
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 10 }}>
                      {["🎥", "📝", "🏆", "👩‍💼"][i]}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontWeight: 900,
                        fontSize: 26,
                        color: i === 0 || i === 3 ? C.goldLight : C.maroonDark,
                      }}
                    >
                      {tx.eduCounts[i]}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        marginTop: 4,
                        color:
                          i === 0 || i === 3
                            ? "rgba(255,255,255,0.8)"
                            : C.maroonDark,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          padding: "80px 32px",
          background: C.goldPale,
          borderTop: `3px solid ${C.gold}`,
          borderBottom: `3px solid ${C.gold}`,
        }}
      >
        <Reveal>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🏴</div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "clamp(24px,4vw,42px)",
                fontWeight: 900,
                color: C.maroon,
                marginBottom: 14,
              }}
            >
              {tx.ctaTitle}
            </h2>
            <p
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 16,
                color: C.textLight,
                marginBottom: 32,
                lineHeight: 1.75,
              }}
            >
              {tx.ctaDesc}
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="pri-btn"
                style={{ padding: "16px 44px", fontSize: 16 }}
                onClick={() => openAuth("signup")}
              >
                {tx.signupBtn} →
              </button>
              <button
                onClick={() => openAuth("login")}
                style={{
                  background: C.bgCard,
                  color: C.maroon,
                  padding: "15px 44px",
                  borderRadius: 50,
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  border: `2px solid ${C.maroon}`,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.maroon;
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.bgCard;
                  e.currentTarget.style.color = C.maroon;
                }}
              >
                {tx.loginBtn}
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: C.footerBg, padding: "52px 32px 26px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className="foot-inner"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 40,
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 270 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    background: `linear-gradient(135deg,${C.maroon},${C.maroonLight})`,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                  }}
                >
                  🏛️
                </div>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "white",
                  }}
                >
                  {tx.brand}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Source Sans 3',sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.7,
                }}
              >
                Political Public Service & Complaint Management Platform for
                Tamil Nadu.
              </p>
            </div>
            {tx.footerCols.map((col, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: C.gold,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  {col.title}
                </div>
                {col.links.map((l, j) => (
                  <div key={j} style={{ marginBottom: 9 }}>
                    <a
                      href="#"
                      className="hov-gold"
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.38)",
                        textDecoration: "none",
                      }}
                    >
                      {l}
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 22,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Source Sans 3',sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.22)",
              }}
            >
              {tx.copyright}
            </span>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {tx.footerLinks.map((l, i) => (
                <a
                  key={i}
                  href="#"
                  className="hov-gold"
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.22)",
                    textDecoration: "none",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════ COMPLAINT MODAL ══════════ */}
      {modal && (
        <div
          className="modal-ov"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModal(false);
              setSubmitted(false);
            }
          }}
        >
          <div
            style={{
              background: C.bgCard,
              borderRadius: 24,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: `0 30px 80px rgba(0,0,0,0.45)`,
              border: `1px solid ${C.border}`,
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg,${C.maroon},${C.maroonLight})`,
                borderRadius: "24px 24px 0 0",
                padding: "26px 30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 900,
                      fontSize: 22,
                      color: "white",
                      marginBottom: 5,
                    }}
                  >
                    {tx.modalTitle}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {tx.modalSub}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModal(false);
                    setSubmitted(false);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "white",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ padding: "26px 30px" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <div style={{ fontSize: 58, marginBottom: 14 }}>✅</div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontWeight: 700,
                      fontSize: 22,
                      color: C.maroon,
                      marginBottom: 10,
                    }}
                  >
                    {tx.successTitle}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 14,
                      color: C.textLight,
                      lineHeight: 1.7,
                    }}
                  >
                    {tx.successMsg}
                  </p>
                  <div
                    style={{
                      marginTop: 22,
                      height: 4,
                      borderRadius: 2,
                      background: C.border,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: `linear-gradient(90deg,${C.maroon},${C.gold})`,
                        animation: "progress 3s linear forwards",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    className="auth-form-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    {[
                      ["name", tx.fName, "text"],
                      ["phone", tx.fPhone, "tel"],
                    ].map(([f, label, type]) => (
                      <div key={f}>
                        <label
                          style={{
                            fontFamily: "'Source Sans 3',sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.textLight,
                            display: "block",
                            marginBottom: 5,
                          }}
                        >
                          {label} *
                        </label>
                        <input
                          type={type}
                          value={form[f]}
                          placeholder={label}
                          onChange={(e) => {
                            setForm((v) => ({ ...v, [f]: e.target.value }));
                            if (errors[f])
                              setErrors((er) => ({ ...er, [f]: false }));
                          }}
                          style={inp(errors[f], form[f])}
                          onFocus={(e) => (e.target.style.borderColor = C.gold)}
                          onBlur={(e) =>
                            (e.target.style.borderColor = errors[f]
                              ? "#ef4444"
                              : form[f]
                                ? C.gold
                                : C.inputBorder)
                          }
                        />
                        {errors[f] && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: 11,
                              marginTop: 3,
                              display: "block",
                            }}
                          >
                            {tx.required}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className="auth-form-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textLight,
                          display: "block",
                          marginBottom: 5,
                        }}
                      >
                        {tx.fBooth} *
                      </label>
                      <input
                        type="text"
                        value={form.booth}
                        placeholder="e.g. 47"
                        onChange={(e) => {
                          setForm((v) => ({ ...v, booth: e.target.value }));
                          if (errors.booth)
                            setErrors((er) => ({ ...er, booth: false }));
                        }}
                        style={inp(errors.booth, form.booth)}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) =>
                          (e.target.style.borderColor = errors.booth
                            ? "#ef4444"
                            : form.booth
                              ? C.gold
                              : C.inputBorder)
                        }
                      />
                      {errors.booth && (
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: 11,
                            marginTop: 3,
                            display: "block",
                          }}
                        >
                          {tx.required}
                        </span>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textLight,
                          display: "block",
                          marginBottom: 5,
                        }}
                      >
                        {tx.fCat} *
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => {
                          setForm((v) => ({ ...v, category: e.target.value }));
                          if (errors.category)
                            setErrors((er) => ({ ...er, category: false }));
                        }}
                        style={{
                          ...inp(errors.category, form.category),
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">{tx.selectCat}</option>
                        {tx.cats.map((c, i) => (
                          <option key={i} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: 11,
                            marginTop: 3,
                            display: "block",
                          }}
                        >
                          {tx.required}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textLight,
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      {tx.fDesc} *
                    </label>
                    <textarea
                      rows={4}
                      value={form.desc}
                      placeholder={tx.fDescPh}
                      onChange={(e) => {
                        setForm((v) => ({ ...v, desc: e.target.value }));
                        if (errors.desc)
                          setErrors((er) => ({ ...er, desc: false }));
                      }}
                      style={{
                        ...inp(errors.desc, form.desc),
                        resize: "vertical",
                        minHeight: 90,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) =>
                        (e.target.style.borderColor = errors.desc
                          ? "#ef4444"
                          : form.desc
                            ? C.gold
                            : C.inputBorder)
                      }
                    />
                    {errors.desc && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 11,
                          marginTop: 3,
                          display: "block",
                        }}
                      >
                        {tx.required}
                      </span>
                    )}
                  </div>
                  {form.category && (
                    <div
                      style={{
                        background: dark
                          ? "rgba(201,152,42,0.1)"
                          : "rgba(201,152,42,0.08)",
                        borderRadius: 9,
                        padding: "9px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        border: `1px solid rgba(201,152,42,0.2)`,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🏷️</span>
                      <span
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 13,
                          color: C.gold,
                          fontWeight: 600,
                        }}
                      >
                        {form.category}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 11, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        setModal(false);
                        setErrors({});
                      }}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: 50,
                        border: `1.5px solid ${C.border}`,
                        background: "transparent",
                        color: C.textLight,
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {tx.cancelBtn}
                    </button>
                    <button
                      onClick={handleComplaintSubmit}
                      className="pri-btn"
                      style={{ flex: 2, padding: "12px", fontSize: 14 }}
                    >
                      {tx.submitBtn} →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ AUTH MODAL ══════════ */}
      {authModal && (
        <div
          className="modal-ov"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAuthModal(null);
              setAuthSuccess(false);
              setAuthErrors({});
            }
          }}
        >
          <div
            style={{
              background: C.bgCard,
              borderRadius: 26,
              width: "100%",
              maxWidth: 480,
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: `0 30px 80px rgba(0,0,0,0.5)`,
              border: `1px solid ${C.border}`,
              animation: "fadeUp 0.3s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg,${C.maroon},${C.maroonLight})`,
                borderRadius: "26px 26px 0 0",
                padding: "30px 32px 24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => {
                  setAuthModal(null);
                  setAuthSuccess(false);
                  setAuthErrors({});
                }}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "white",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    margin: "0 auto 14px",
                  }}
                >
                  🏛️
                </div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontWeight: 900,
                    fontSize: 24,
                    color: "white",
                    marginBottom: 6,
                  }}
                >
                  {authTab === "login" ? tx.loginTitle : tx.signupTitle}
                </h2>
                <p
                  style={{
                    fontFamily: "'Source Sans 3',sans-serif",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {authTab === "login" ? tx.loginSub : tx.signupSub}
                </p>
              </div>
            </div>

            <div style={{ padding: "24px 30px 30px" }}>
              {/* Tab switcher */}
              <div
                style={{
                  display: "flex",
                  background: C.bgAlt,
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 24,
                  gap: 4,
                }}
              >
                {["login", "signup"].map((tab) => (
                  <button
                    key={tab}
                    className="tab-btn"
                    onClick={() => {
                      setAuthTab(tab);
                      setAuthErrors({});
                      setAuthSuccess(false);
                    }}
                    style={{
                      background:
                        authTab === tab
                          ? `linear-gradient(135deg,${C.maroon},${C.maroonLight})`
                          : "transparent",
                      color: authTab === tab ? "white" : C.textLight,
                      boxShadow:
                        authTab === tab
                          ? `0 4px 16px rgba(123,28,28,0.25)`
                          : "none",
                    }}
                  >
                    {tab === "login" ? tx.loginBtn : tx.signupBtn}
                  </button>
                ))}
              </div>

              {authSuccess ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 56, marginBottom: 14 }}>
                    {authTab === "login" ? "👋" : "🎉"}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: C.maroon,
                      marginBottom: 10,
                    }}
                  >
                    {authTab === "login" ? "Welcome back!" : "Account created!"}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 14,
                      color: C.textLight,
                    }}
                  >
                    {authTab === "login"
                      ? "Redirecting you to your dashboard..."
                      : "Your account is ready. Welcome to People Connect!"}
                  </p>
                  <div
                    style={{
                      marginTop: 22,
                      height: 4,
                      borderRadius: 2,
                      background: C.border,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: `linear-gradient(90deg,${C.maroon},${C.gold})`,
                        animation: "progress 2.8s linear forwards",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {/* Signup extra fields */}
                  {authTab === "signup" && (
                    <div
                      className="auth-form-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontFamily: "'Source Sans 3',sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.textLight,
                            display: "block",
                            marginBottom: 5,
                          }}
                        >
                          {tx.nameLabel} *
                        </label>
                        <input
                          type="text"
                          value={authForm.name}
                          placeholder={tx.nameLabel}
                          onChange={(e) => {
                            setAuthForm((v) => ({
                              ...v,
                              name: e.target.value,
                            }));
                            if (authErrors.name)
                              setAuthErrors((er) => ({ ...er, name: false }));
                          }}
                          style={inp(authErrors.name, authForm.name)}
                          onFocus={(e) => (e.target.style.borderColor = C.gold)}
                          onBlur={(e) =>
                            (e.target.style.borderColor = authErrors.name
                              ? "#ef4444"
                              : authForm.name
                                ? C.gold
                                : C.inputBorder)
                          }
                        />
                        {authErrors.name && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: 11,
                              marginTop: 3,
                              display: "block",
                            }}
                          >
                            {tx.required}
                          </span>
                        )}
                      </div>
                      <div>
                        <label
                          style={{
                            fontFamily: "'Source Sans 3',sans-serif",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.textLight,
                            display: "block",
                            marginBottom: 5,
                          }}
                        >
                          {tx.phoneLabel} *
                        </label>
                        <input
                          type="tel"
                          value={authForm.phone}
                          placeholder={tx.phoneLabel}
                          onChange={(e) => {
                            setAuthForm((v) => ({
                              ...v,
                              phone: e.target.value,
                            }));
                            if (authErrors.phone)
                              setAuthErrors((er) => ({ ...er, phone: false }));
                          }}
                          style={inp(authErrors.phone, authForm.phone)}
                          onFocus={(e) => (e.target.style.borderColor = C.gold)}
                          onBlur={(e) =>
                            (e.target.style.borderColor = authErrors.phone
                              ? "#ef4444"
                              : authForm.phone
                                ? C.gold
                                : C.inputBorder)
                          }
                        />
                        {authErrors.phone && (
                          <span
                            style={{
                              color: "#ef4444",
                              fontSize: 11,
                              marginTop: 3,
                              display: "block",
                            }}
                          >
                            {tx.required}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textLight,
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      {tx.emailLabel} *
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      placeholder="you@example.com"
                      onChange={(e) => {
                        setAuthForm((v) => ({ ...v, email: e.target.value }));
                        if (authErrors.email)
                          setAuthErrors((er) => ({ ...er, email: false }));
                      }}
                      style={inp(authErrors.email, authForm.email)}
                      onFocus={(e) => (e.target.style.borderColor = C.gold)}
                      onBlur={(e) =>
                        (e.target.style.borderColor = authErrors.email
                          ? "#ef4444"
                          : authForm.email
                            ? C.gold
                            : C.inputBorder)
                      }
                    />
                    {authErrors.email && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 11,
                          marginTop: 3,
                          display: "block",
                        }}
                      >
                        Please enter a valid email
                      </span>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <label
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textLight,
                        }}
                      >
                        {tx.passLabel} *
                      </label>
                      {authTab === "login" && (
                        <span
                          style={{
                            fontFamily: "'Source Sans 3',sans-serif",
                            fontSize: 12,
                            color: C.gold,
                            cursor: "pointer",
                          }}
                        >
                          {tx.forgotPass}
                        </span>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPass ? "text" : "password"}
                        value={authForm.password}
                        placeholder="••••••••"
                        onChange={(e) => {
                          setAuthForm((v) => ({
                            ...v,
                            password: e.target.value,
                          }));
                          if (authErrors.password)
                            setAuthErrors((er) => ({ ...er, password: false }));
                        }}
                        style={{
                          ...inp(authErrors.password, authForm.password),
                          paddingRight: 44,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) =>
                          (e.target.style.borderColor = authErrors.password
                            ? "#ef4444"
                            : authForm.password
                              ? C.gold
                              : C.inputBorder)
                        }
                      />
                      <button
                        onClick={() => setShowPass((p) => !p)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 16,
                          color: C.textMuted,
                        }}
                      >
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {authErrors.password && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 11,
                          marginTop: 3,
                          display: "block",
                        }}
                      >
                        Min 6 characters required
                      </span>
                    )}
                  </div>

                  {/* Confirm password for signup */}
                  {authTab === "signup" && (
                    <div>
                      <label
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textLight,
                          display: "block",
                          marginBottom: 5,
                        }}
                      >
                        {tx.confirmPass} *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          value={authForm.confirmPassword}
                          placeholder="••••••••"
                          onChange={(e) => {
                            setAuthForm((v) => ({
                              ...v,
                              confirmPassword: e.target.value,
                            }));
                            if (authErrors.confirmPassword)
                              setAuthErrors((er) => ({
                                ...er,
                                confirmPassword: false,
                              }));
                          }}
                          style={{
                            ...inp(
                              authErrors.confirmPassword,
                              authForm.confirmPassword,
                            ),
                            paddingRight: 44,
                          }}
                          onFocus={(e) => (e.target.style.borderColor = C.gold)}
                          onBlur={(e) =>
                            (e.target.style.borderColor =
                              authErrors.confirmPassword
                                ? "#ef4444"
                                : authForm.confirmPassword
                                  ? C.gold
                                  : C.inputBorder)
                          }
                        />
                        <button
                          onClick={() => setShowConfirmPass((p) => !p)}
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 16,
                            color: C.textMuted,
                          }}
                        >
                          {showConfirmPass ? "🙈" : "👁️"}
                        </button>
                      </div>
                      {authErrors.confirmPassword && (
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: 11,
                            marginTop: 3,
                            display: "block",
                          }}
                        >
                          Passwords do not match
                        </span>
                      )}
                    </div>
                  )}

                  {/* Role selector for signup */}
                  {authTab === "signup" && (
                    <div>
                      <label
                        style={{
                          fontFamily: "'Source Sans 3',sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.textLight,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        {tx.roleLabel}
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        {tx.roles.map((role, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setAuthForm((v) => ({
                                ...v,
                                role: ["public", "worker", "admin"][i],
                              }))
                            }
                            style={{
                              flex: 1,
                              padding: "10px 6px",
                              borderRadius: 10,
                              border: `1.5px solid ${authForm.role === ["public", "worker", "admin"][i] ? C.maroon : C.border}`,
                              background:
                                authForm.role ===
                                ["public", "worker", "admin"][i]
                                  ? dark
                                    ? "rgba(192,82,74,0.15)"
                                    : "rgba(123,28,28,0.06)"
                                  : "transparent",
                              color:
                                authForm.role ===
                                ["public", "worker", "admin"][i]
                                  ? C.maroon
                                  : C.textLight,
                              fontFamily: "'Source Sans 3',sans-serif",
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              textAlign: "center",
                            }}
                          >
                            {["👤", "🏴", "⚙️"][i]}
                            <br />
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* API Error Message */}
                  {authErrors.api && (
                    <div style={{
                      color: '#ef4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}>
                      {authErrors.api}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleAuthSubmit}
                    className="pri-btn"
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: 16,
                      marginTop: 4,
                    }}
                  >
                    {authTab === "login" ? tx.submitLogin : tx.submitSignup}
                  </button>

                  {/* Divider */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                    <span
                      style={{
                        fontFamily: "'Source Sans 3',sans-serif",
                        fontSize: 12,
                        color: C.textMuted,
                      }}
                    >
                      {tx.orContinue}
                    </span>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>

                  {/* Social */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <button
                      className="social-btn"
                      style={{
                        borderColor: C.border,
                        color: C.text,
                        background: C.bgAlt,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                    <button
                      className="social-btn"
                      style={{
                        borderColor: C.border,
                        color: C.text,
                        background: C.bgAlt,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={dark ? "white" : "#1877F2"}
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </button>
                  </div>

                  {/* Switch link */}
                  <p
                    style={{
                      textAlign: "center",
                      fontFamily: "'Source Sans 3',sans-serif",
                      fontSize: 13,
                      color: C.textLight,
                      marginTop: 4,
                    }}
                  >
                    {authTab === "login" ? tx.noAccount : tx.hasAccount}{" "}
                    <span
                      onClick={() => {
                        setAuthTab(authTab === "login" ? "signup" : "login");
                        setAuthErrors({});
                      }}
                      style={{
                        color: C.maroon,
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {authTab === "login"
                        ? tx.switchToSignup
                        : tx.switchToLogin}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
