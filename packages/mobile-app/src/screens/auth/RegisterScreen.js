import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import PopupToast from '../../components/PopupToast';
import { T, TN_DISTRICTS } from '../../constants/theme';

// ── Field ─────────────────────────────────────────────────────────
function Field({ label, icon, value, onChange, placeholder, keyboard, secure, hint }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom:16 }}>
      <Text style={fs.label}>{label}</Text>
      <View style={fs.row}>
        <Text style={fs.icon}>{icon}</Text>
        <TextInput
          style={{ flex:1, paddingVertical:14, fontSize:15, color:T.text }}
          placeholder={placeholder} placeholderTextColor={T.textM}
          value={value} onChangeText={onChange}
          keyboardType={keyboard||'default'}
          autoCapitalize={keyboard==='email-address'?'none':'sentences'}
          secureTextEntry={!!secure&&!show}
        />
        {!!secure && (
          <TouchableOpacity onPress={()=>setShow(v=>!v)} style={{padding:8}}>
            <Text style={{fontSize:16}}>{show?'🙈':'👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hint && <Text style={fs.hint}>{hint}</Text>}
    </View>
  );
}

// ── OTP Boxes ─────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.split('');
  const handleChange = (text, idx) => {
    const clean = text.replace(/[^0-9]/g,'');
    const arr = value.split(''); arr[idx]=clean.slice(-1); onChange(arr.join(''));
    if (clean && idx<5) refs.current[idx+1]?.focus();
  };
  const handleKey = (e,idx) => {
    if (e.nativeEvent.key==='Backspace' && !digits[idx] && idx>0) refs.current[idx-1]?.focus();
  };
  return (
    <View style={ot.row}>
      {[0,1,2,3,4,5].map(i=>(
        <TextInput key={i} ref={r=>(refs.current[i]=r)}
          style={[ot.box, digits[i]&&ot.boxFilled]}
          value={digits[i]||''} onChangeText={t=>handleChange(t,i)}
          onKeyPress={e=>handleKey(e,i)} keyboardType="number-pad" maxLength={1} selectTextOnFocus
        />
      ))}
    </View>
  );
}

// ── Step bar ──────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <View style={{flexDirection:'row',gap:6,marginBottom:24}}>
      {[1,2,3,4].map(i=>(
        <View key={i} style={{height:4,borderRadius:2,flex:1,backgroundColor:i<=step?T.maroon:T.border}} />
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [step,          setStep]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [otpCode,       setOtpCode]       = useState('');
  const [countdown,     setCountdown]     = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [boothInfo,     setBoothInfo]     = useState(null);
  const [phoneInput,    setPhoneInput]    = useState('');
  const [toast,         setToast]         = useState({visible:false,message:'',type:'error'});
  const [form, setForm] = useState({
    name:'', email:'', password:'', confirmPassword:'',
    district:'', booth:'', pincode:'', address:'', role:'public',
  });

  const set = k => v => setForm(f=>({...f,[k]:v}));
  const showToast = (msg,type='error') => setToast({visible:true,message:msg,type});

  useEffect(()=>{
    if(countdown<=0) return;
    const id=setTimeout(()=>setCountdown(c=>c-1),1000);
    return ()=>clearTimeout(id);
  },[countdown]);

  // Step 1 validation
  const handleStep1 = () => {
    if (!form.name.trim()||form.name.trim().length<2) { showToast('Please enter your full name.'); return; }
    if (form.password.length<6)                       { showToast('Password must be at least 6 characters.'); return; }
    if (form.password!==form.confirmPassword)         { showToast('Passwords do not match.'); return; }
    setStep(2);
  };

  // Send OTP
  const handleSendOtp = async () => {
    const phone = phoneInput.trim();
    if (!phone||phone.replace(/\D/g,'').length<10) { showToast('Enter a valid 10-digit phone number.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.sendOtp(phone);
      if (res.data?.otp) showToast(`Dev OTP: ${res.data.otp}`,'info');
      else showToast(`OTP sent to ${phone}`,'success');
      setVerifiedPhone(phone);
      setCountdown(60);
    } catch(err) {
      showToast(err?.response?.data?.message||'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length<6) { showToast('Enter the full 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(verifiedPhone, otpCode);
      showToast('Phone verified!','success');
      setTimeout(()=>setStep(3),600);
    } catch(err) {
      showToast(err?.response?.data?.message||'Invalid OTP. Try again.');
    } finally { setLoading(false); }
  };

  // Step 3 - location
  const handleStep3 = async () => {
    if (!form.district) { showToast('Please select your district.'); return; }
    if (form.role==='worker' && form.booth) {
      setLoading(true);
      try {
        const res = await authAPI.verifyBooth(form.booth, form.district);
        setBoothInfo(res.data);
      } catch { setBoothInfo(null); }
      finally { setLoading(false); }
    }
    setStep(4);
  };

  // Final register
  const handleRegister = async () => {
    setLoading(true);
    try {
      await register({
        name:form.name, email:form.email||undefined,
        password:form.password, phone:verifiedPhone,
        role:form.role, booth:form.booth, district:form.district,
        address:form.address, pincode:form.pincode,
      });
    } catch(err) {
      showToast(err?.response?.data?.message||'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const TITLES = [
    {title:'Personal Info',          sub:'Enter your name and password'},
    {title:'Verify Phone 📱',        sub:'Verify your phone number securely'},
    {title:'Your Location 📍',       sub:'Select your district and booth'},
    {title:'Confirm & Register ✅',  sub:'Review and create your account'},
  ];

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={()=>setToast(t=>({...t,visible:false}))} />

      <LinearGradient colors={[T.maroon,T.maroonL]} style={s.topBg}>
        <TouchableOpacity onPress={()=>step>1?setStep(st=>st-1):navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={s.logoCircle}><Text style={{fontSize:30}}>🏛️</Text></View>
        <Text style={s.appName}>People Connect</Text>
        <Text style={s.tagline}>{TITLES[step-1].title}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <StepBar step={step} />
            <Text style={s.cardTitle}>{TITLES[step-1].title}</Text>
            <Text style={s.cardSub}>{TITLES[step-1].sub}</Text>

            {/* ══ STEP 1 ══ */}
            {step===1 && (
              <>
                <Field label="Full Name *"        icon="👤" value={form.name}            onChange={set('name')}            placeholder="Your full name" />
                <Field label="Email (optional)"   icon="✉️" value={form.email}           onChange={set('email')}           placeholder="your@email.com" keyboard="email-address" hint="Email is optional. Used for password reset." />
                <Field label="Password *"         icon="🔒" value={form.password}        onChange={set('password')}        placeholder="Min 6 characters" secure />
                <Field label="Confirm Password *" icon="🔒" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" secure />
                <Text style={fs.label}>I am registering as *</Text>
                <View style={{flexDirection:'row',gap:10,marginBottom:20}}>
                  {[{v:'public',l:'🏠 Citizen',d:'File complaints'},{v:'worker',l:'👷 Agent',d:'Resolve complaints'}].map(r=>(
                    <TouchableOpacity key={r.v} style={[s.roleCard,form.role===r.v&&s.roleCardActive]} onPress={()=>set('role')(r.v)} activeOpacity={0.85}>
                      <Text style={[s.roleLabel,form.role===r.v&&{color:'#fff'}]}>{r.l}</Text>
                      <Text style={[s.roleDesc,form.role===r.v&&{color:'rgba(255,255,255,0.75)'}]}>{r.d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.btn} onPress={handleStep1} activeOpacity={0.85}>
                  <Text style={s.btnText}>Continue →</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ══ STEP 2 ══ */}
            {step===2 && (
              <>
                {!verifiedPhone ? (
                  <View style={s.phoneBox}>
                    <Text style={s.phoneTitle}>📱 Phone Verification</Text>
                    <Text style={s.phoneSub}>Your phone number is used as your identity. We will send a 6-digit OTP to verify.</Text>
                    <Field label="Phone Number *" icon="📱" value={phoneInput} onChange={setPhoneInput} placeholder="10-digit mobile number" keyboard="phone-pad" />
                    <TouchableOpacity style={[s.btn,loading&&{opacity:0.7}]} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP →</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={s.cardSub}>
                      Enter the 6-digit OTP sent to{'\n'}
                      <Text style={{fontWeight:'800',color:T.text}}>{verifiedPhone}</Text>
                    </Text>
                    <OtpInput value={otpCode} onChange={setOtpCode} />
                    <View style={s.resendRow}>
                      {countdown>0
                        ? <Text style={s.resendTimer}>Resend in <Text style={{fontWeight:'800',color:T.maroon}}>{countdown}s</Text></Text>
                        : <TouchableOpacity onPress={handleSendOtp}><Text style={s.resendLink}>Didn't receive? <Text style={{color:T.maroon,fontWeight:'800'}}>Resend OTP</Text></Text></TouchableOpacity>
                      }
                    </View>
                    <TouchableOpacity style={[s.btn,(otpCode.length<6||loading)&&{opacity:0.6}]} onPress={handleVerifyOtp} disabled={otpCode.length<6||loading} activeOpacity={0.85}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify OTP ✓</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>{setVerifiedPhone('');setOtpCode('');}} style={s.changePh}>
                      <Text style={s.changePhTxt}>← Change phone number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* ══ STEP 3 ══ */}
            {step===3 && (
              <>
                <Text style={fs.label}>District *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
                  {TN_DISTRICTS.map(d=>(
                    <TouchableOpacity key={d} style={[s.distChip,form.district===d&&s.distChipActive]} onPress={()=>set('district')(d)} activeOpacity={0.8}>
                      <Text style={[s.distTxt,form.district===d&&{color:'#fff',fontWeight:'700'}]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Field label="Booth Number" icon="🏠" value={form.booth}   onChange={set('booth')}   placeholder={form.role==='worker'?'Required — your assigned booth':'Optional'} hint={form.role==='worker'?'Required for agents':'Helps assign your complaint to the right agent'} />
                <Field label="Pincode"      icon="📮" value={form.pincode} onChange={set('pincode')} placeholder="6-digit pincode" keyboard="numeric" hint="Used for fallback complaint routing" />
                <Field label="Address"      icon="🏘️" value={form.address} onChange={set('address')} placeholder="Door no, street, area" />
                {boothInfo && (
                  <View style={[s.infoCard,{backgroundColor:boothInfo.workerCount>0?'#FEF3C7':'#DCFCE7'}]}>
                    <Text style={{fontSize:20}}>{boothInfo.workerCount>0?'👥':'🎉'}</Text>
                    <Text style={{flex:1,fontSize:13,color:T.text,lineHeight:19}}>{boothInfo.message}</Text>
                  </View>
                )}
                <TouchableOpacity style={[s.btn,(!form.district||loading)&&{opacity:0.6}]} onPress={handleStep3} disabled={!form.district||loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue →</Text>}
                </TouchableOpacity>
              </>
            )}

            {/* ══ STEP 4 ══ */}
            {step===4 && (
              <>
                <View style={s.summaryCard}>
                  <Text style={s.summaryTitle}>📋 Registration Summary</Text>
                  {[
                    ['Name',     form.name,           '👤'],
                    ['Phone',    verifiedPhone,        '📱'],
                    ['Email',    form.email||'—',      '✉️'],
                    ['Role',     form.role==='worker'?'Agent / Worker':'Citizen','🎭'],
                    ['District', form.district,        '📍'],
                    ['Booth',    form.booth   ||'—',   '🏠'],
                    ['Pincode',  form.pincode ||'—',   '📮'],
                  ].map(([l,v,i])=>(
                    <View key={l} style={s.summaryRow}>
                      <Text style={s.summaryIcon}>{i}</Text>
                      <Text style={s.summaryLabel}>{l}</Text>
                      <Text style={s.summaryVal}>{v}</Text>
                    </View>
                  ))}
                </View>
                {form.role==='worker' && (
                  <View style={s.workerBanner}>
                    <Text style={{fontSize:20}}>👷</Text>
                    <Text style={{flex:1,fontSize:13,color:'#1e40af',lineHeight:19}}>
                      As an agent, you will receive new complaints from booth <Text style={{fontWeight:'800'}}>{form.booth||form.district}</Text>. First to accept a complaint gets it locked to you.
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={[s.btn,loading&&{opacity:0.7}]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>✅ Create Account</Text>}
                </TouchableOpacity>
              </>
            )}

            <Text style={s.footerText}>
              Already have an account?{' '}
              <Text style={{color:T.maroon,fontWeight:'700'}} onPress={()=>navigation.navigate('Login')}>Sign In</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ot = StyleSheet.create({
  row:      {flexDirection:'row',justifyContent:'space-between',marginVertical:24},
  box:      {width:48,height:56,borderRadius:14,borderWidth:2,borderColor:T.border,backgroundColor:T.bg,textAlign:'center',fontSize:22,fontWeight:'800',color:T.text},
  boxFilled:{borderColor:T.maroon,backgroundColor:'#FFF8EE'},
});
const fs = StyleSheet.create({
  label:{fontSize:13,fontWeight:'700',color:T.textL,marginBottom:8},
  row:  {flexDirection:'row',alignItems:'center',borderWidth:1.5,borderColor:T.border,borderRadius:14,backgroundColor:T.bg,paddingHorizontal:14},
  icon: {fontSize:16,marginRight:10},
  hint: {fontSize:11,color:T.textM,marginTop:6,lineHeight:16},
});
const s = StyleSheet.create({
  root:       {flex:1,backgroundColor:T.maroon},
  topBg:      {alignItems:'center',paddingTop:Platform.OS==='ios'?52:40,paddingBottom:28},
  backBtn:    {position:'absolute',top:Platform.OS==='ios'?52:40,left:20},
  backTxt:    {color:'rgba(255,255,255,0.85)',fontSize:15,fontWeight:'600'},
  logoCircle: {width:68,height:68,borderRadius:34,backgroundColor:'rgba(255,255,255,0.15)',alignItems:'center',justifyContent:'center',marginBottom:10},
  appName:    {fontSize:20,fontWeight:'900',color:'#fff',marginBottom:4},
  tagline:    {fontSize:13,color:'rgba(255,255,255,0.7)'},
  scroll:     {flexGrow:1},
  card:       {backgroundColor:'#fff',borderTopLeftRadius:32,borderTopRightRadius:32,padding:28,paddingTop:32,minHeight:'100%'},
  cardTitle:  {fontSize:22,fontWeight:'800',color:T.text,marginBottom:6},
  cardSub:    {fontSize:14,color:T.textM,marginBottom:24,lineHeight:20},
  btn:        {backgroundColor:T.maroon,borderRadius:50,paddingVertical:16,alignItems:'center',marginTop:8,elevation:4,shadowColor:T.maroon,shadowOpacity:0.4,shadowRadius:8,shadowOffset:{width:0,height:4}},
  btnText:    {fontSize:16,fontWeight:'800',color:'#fff',letterSpacing:0.5},
  roleCard:       {flex:1,borderRadius:16,borderWidth:2,borderColor:T.border,padding:14,alignItems:'center',gap:4},
  roleCardActive: {backgroundColor:T.maroon,borderColor:T.maroon},
  roleLabel:  {fontSize:14,fontWeight:'700',color:T.text},
  roleDesc:   {fontSize:11,color:T.textM},
  phoneBox:   {backgroundColor:T.bg,borderRadius:20,padding:20,borderWidth:1,borderColor:T.border},
  phoneTitle: {fontSize:16,fontWeight:'800',color:T.text,marginBottom:8,textAlign:'center'},
  phoneSub:   {fontSize:13,color:T.textM,textAlign:'center',marginBottom:20,lineHeight:19},
  distChip:       {paddingHorizontal:14,paddingVertical:8,borderRadius:50,borderWidth:1.5,borderColor:T.border,marginRight:8,backgroundColor:T.bg},
  distChipActive: {backgroundColor:T.maroon,borderColor:T.maroon},
  distTxt:    {fontSize:13,color:T.textL,fontWeight:'600'},
  infoCard:   {flexDirection:'row',gap:12,alignItems:'flex-start',borderRadius:14,padding:14,marginBottom:16,borderWidth:1,borderColor:'rgba(0,0,0,0.08)'},
  workerBanner:{flexDirection:'row',gap:12,alignItems:'flex-start',backgroundColor:'#DBEAFE',borderRadius:14,padding:14,marginBottom:16,borderWidth:1,borderColor:'#3b82f640'},
  summaryCard:  {backgroundColor:T.goldP,borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:'#C9982A40'},
  summaryTitle: {fontSize:14,fontWeight:'800',color:T.maroonD,marginBottom:14},
  summaryRow:   {flexDirection:'row',alignItems:'center',gap:10,marginBottom:10},
  summaryIcon:  {fontSize:16,width:22},
  summaryLabel: {fontSize:12,color:T.textM,fontWeight:'600',width:64},
  summaryVal:   {fontSize:13,color:T.text,fontWeight:'700',flex:1},
  resendRow:    {alignItems:'center',marginBottom:16},
  resendTimer:  {fontSize:13,color:T.textM},
  resendLink:   {fontSize:13,color:T.textM},
  changePh:     {alignItems:'center',marginTop:12},
  changePhTxt:  {fontSize:13,color:T.textM,fontWeight:'600'},
  footerText:   {textAlign:'center',fontSize:14,color:T.textL,marginTop:24},
});