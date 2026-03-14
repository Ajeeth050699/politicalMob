import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, BackHandler, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { educationAPI } from '../../services/api';
import { T } from '../../constants/theme';

export default function ExamScreen({ route, navigation }) {
  const { examId, title } = route.params;

  const [exam,       setExam]       = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [currentQ,   setCurrentQ]   = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    educationAPI.getExamById(examId)
      .then(({ data }) => {
        setExam(data);
        const mins = parseInt(data.duration) || 30;
        setTimeLeft(mins * 60);
      })
      .catch(() => { Alert.alert('Error', 'Could not load exam'); navigation.goBack(); })
      .finally(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    if (!exam || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); submitExam(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [exam, result]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!result) {
        Alert.alert('Exit Exam?', 'Your progress will be lost.', [
          { text: 'Stay',  style: 'cancel' },
          { text: 'Exit',  onPress: () => navigation.goBack() },
        ]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [result]);

  const submitExam = async (auto = false) => {
    if (!auto) {
      const unanswered = exam.questions.length - Object.keys(answers).length;
      if (unanswered > 0) {
        const go = await new Promise((res) =>
          Alert.alert(
            '⚠️ Unanswered Questions',
            `You have ${unanswered} unanswered question(s). Submit anyway?`,
            [
              { text: 'Go Back', onPress: () => res(false), style: 'cancel' },
              { text: 'Submit',  onPress: () => res(true)  },
            ]
          )
        );
        if (!go) return;
      }
    }
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const { data } = await educationAPI.submitExam(examId, { answers });
      setResult(data);
    } catch {
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const isUrgent = timeLeft > 0 && timeLeft <= 60;
  const progress = exam ? ((currentQ + 1) / exam.questions.length) * 100 : 0;
  const answered = Object.keys(answers).length;

  // ─────────────────────────────────────────────────────────────
  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={T.maroon} size="large" />
      <Text style={{ color: T.textM, marginTop: 12, fontSize: 14 }}>Loading exam...</Text>
    </View>
  );
  if (!exam) return null;

  // ─────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ─────────────────────────────────────────────────────────────
  if (result) {
    const pct     = Math.round((result.score / result.total) * 100);
    const passed  = result.passed;
    const grade   = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'F';
    const gradeBg = pct >= 60 ? '#dcfce7' : '#fee2e2';
    const gradeColor = pct >= 60 ? '#16a34a' : '#dc2626';

    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <StatusBar backgroundColor={passed ? '#16a34a' : T.maroon} barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Result hero */}
          <LinearGradient
            colors={passed ? ['#16a34a', '#15803d'] : [T.maroon, T.maroonL]}
            style={s.resultHero}
          >
            <View style={s.resultEmojiBox}>
              <Text style={{ fontSize: 52 }}>{passed ? '🏆' : '📝'}</Text>
            </View>
            <Text style={s.resultTitle}>
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </Text>
            <Text style={s.resultSub}>
              {passed ? 'You have passed this exam' : 'You need 60% to pass. Try again!'}
            </Text>

            {/* Score big display */}
            <View style={s.scoreBig}>
              <Text style={s.scoreBigNum}>{result.score}</Text>
              <Text style={s.scoreBigSlash}>/</Text>
              <Text style={s.scoreBigTotal}>{result.total}</Text>
            </View>
          </LinearGradient>

          <View style={{ padding: 20 }}>
            {/* Stats row */}
            <View style={s.resultStatsRow}>
              <View style={s.resultStat}>
                <Text style={[s.resultStatNum, { color: gradeColor }]}>{pct}%</Text>
                <Text style={s.resultStatLabel}>Score</Text>
              </View>
              <View style={s.resultStatDivider} />
              <View style={s.resultStat}>
                <View style={[s.gradeBadge, { backgroundColor: gradeBg }]}>
                  <Text style={[s.gradeText, { color: gradeColor }]}>{grade}</Text>
                </View>
                <Text style={s.resultStatLabel}>Grade</Text>
              </View>
              <View style={s.resultStatDivider} />
              <View style={s.resultStat}>
                <Text style={[s.resultStatNum, { color: T.blue }]}>{result.total - result.score}</Text>
                <Text style={s.resultStatLabel}>Wrong</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={s.resultBarBg}>
              <View style={[s.resultBarFill, { width: `${pct}%`, backgroundColor: pct >= 60 ? '#16a34a' : T.red }]} />
              <View style={[s.passMark, { left: '60%' }]}>
                <Text style={s.passMarkTxt}>60%</Text>
              </View>
            </View>
            <Text style={s.passMarkLabel}>Pass mark: 60%</Text>

            {/* Certificate card */}
            {result.certificate && (
              <View style={s.certCard}>
                <LinearGradient colors={['#fef3c7', '#fde68a']} style={s.certGrad}>
                  <Text style={{ fontSize: 40 }}>🎓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.certTitle}>Certificate Earned!</Text>
                    <Text style={s.certSub}>Your certificate has been issued for passing this exam</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Action buttons */}
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[T.maroon, T.maroonL]} style={s.backBtnGrad}>
                <Text style={s.backBtnTxt}>← Back to Education</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!passed && (
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQ(0);
                  const mins = parseInt(exam.duration) || 30;
                  setTimeLeft(mins * 60);
                }}
                activeOpacity={0.85}
              >
                <Text style={s.retryBtnTxt}>🔄 Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // EXAM SCREEN
  // ─────────────────────────────────────────────────────────────
  const q = exam.questions[currentQ];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar backgroundColor={isUrgent ? '#dc2626' : T.maroon} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={isUrgent ? ['#dc2626', '#b91c1c'] : [T.maroon, T.maroonL]}
        style={s.header}
      >
        {/* Top row */}
        <View style={s.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1}>{exam.title}</Text>
            <Text style={s.headerSub}>
              {answered}/{exam.questions.length} answered
            </Text>
          </View>
          {/* Timer */}
          <View style={[s.timerBox, isUrgent && s.timerUrgent]}>
            <Text style={s.timerIcon}>{isUrgent ? '⚠️' : '⏱'}</Text>
            <Text style={[s.timerTxt, isUrgent && { fontSize: 18 }]}>{fmt(timeLeft)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Step info */}
        <View style={s.stepRow}>
          <Text style={s.stepTxt}>Question {currentQ + 1} of {exam.questions.length}</Text>
          <Text style={s.stepPct}>{Math.round(progress)}% complete</Text>
        </View>
      </LinearGradient>

      {/* ── Question + Options ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        {/* Question card */}
        <View style={s.qCard}>
          <View style={s.qNumBadge}>
            <Text style={s.qNumTxt}>Q{currentQ + 1}</Text>
          </View>
          <Text style={s.qText}>{q.question}</Text>
        </View>

        {/* Options */}
        <Text style={s.chooseLabel}>Choose your answer:</Text>
        {q.options.map((opt, idx) => {
          const sel    = answers[q._id?.toString()] === idx;
          const letter = ['A', 'B', 'C', 'D'][idx];
          return (
            <TouchableOpacity
              key={idx}
              style={[s.optCard, sel && s.optCardSel]}
              onPress={() => setAnswers(a => ({ ...a, [q._id?.toString()]: idx }))}
              activeOpacity={0.8}
            >
              <View style={[s.optLetter, sel && s.optLetterSel]}>
                <Text style={[s.optLetterTxt, sel && { color: '#fff' }]}>{letter}</Text>
              </View>
              <Text style={[s.optTxt, sel && { color: T.maroon, fontWeight: '700' }]}>{opt}</Text>
              {sel && <Text style={s.optCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bottom nav ── */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={[s.navBtn, currentQ === 0 && { opacity: 0.35 }]}
          onPress={() => setCurrentQ(c => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          activeOpacity={0.8}
        >
          <Text style={s.navBtnTxt}>← Prev</Text>
        </TouchableOpacity>

        {currentQ < exam.questions.length - 1 ? (
          <TouchableOpacity
            style={[s.navBtn, s.navBtnNext]}
            onPress={() => setCurrentQ(c => Math.min(exam.questions.length - 1, c + 1))}
            activeOpacity={0.8}
          >
            <Text style={[s.navBtnTxt, { color: '#fff' }]}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.navBtn, s.navBtnSubmit, submitting && { opacity: 0.6 }]}
            onPress={() => submitExam(false)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[s.navBtnTxt, { color: '#fff' }]}>Submit ✓</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── Dot navigation ── */}
      <View style={s.dotsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {exam.questions.map((_, i) => {
            const isAnswered = answers[exam.questions[i]._id?.toString()] !== undefined;
            const isCurrent  = i === currentQ;
            return (
              <TouchableOpacity key={i} onPress={() => setCurrentQ(i)} style={{ padding: 4 }}>
                <View style={[
                  s.dot,
                  isCurrent  && s.dotCurrent,
                  isAnswered && !isCurrent && s.dotAnswered,
                ]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={s.dotLegend}>{answered}/{exam.questions.length}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },

  // ── EXAM header ──
  header:      { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 14, paddingHorizontal: 20 },
  headerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  timerBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50 },
  timerUrgent: { backgroundColor: 'rgba(255,255,255,0.25)' },
  timerIcon:   { fontSize: 14 },
  timerTxt:    { color: '#fff', fontWeight: '900', fontSize: 16 },
  progressBg:  { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: '100%', backgroundColor: T.gold, borderRadius: 3 },
  stepRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  stepTxt:     { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  stepPct:     { color: T.goldL, fontSize: 11, fontWeight: '700' },

  // ── Question ──
  qCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: T.border, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
  qNumBadge:   { alignSelf: 'flex-start', backgroundColor: T.maroon + '12', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginBottom: 12 },
  qNumTxt:     { fontSize: 12, fontWeight: '800', color: T.maroon },
  qText:       { fontSize: 16, fontWeight: '600', color: T.text, lineHeight: 26 },
  chooseLabel: { fontSize: 13, fontWeight: '700', color: T.textL, marginBottom: 10 },

  // ── Options ──
  optCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: T.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  optCardSel:  { borderColor: T.maroon, backgroundColor: '#FFF8EE' },
  optLetter:   { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optLetterSel:{ backgroundColor: T.maroon, borderColor: T.maroon },
  optLetterTxt:{ fontWeight: '800', fontSize: 14, color: T.textL },
  optTxt:      { fontSize: 14, color: T.text, flex: 1, lineHeight: 20 },
  optCheck:    { fontSize: 18, color: T.maroon, fontWeight: '800' },

  // ── Nav bar ──
  navBar:      { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: T.border, elevation: 8 },
  navBtn:      { flex: 1, paddingVertical: 14, borderRadius: 50, borderWidth: 2, borderColor: T.border, alignItems: 'center' },
  navBtnNext:  { backgroundColor: T.blue,  borderColor: T.blue  },
  navBtnSubmit:{ backgroundColor: '#16a34a', borderColor: '#16a34a' },
  navBtnTxt:   { fontSize: 15, fontWeight: '800', color: T.textL },

  // ── Dots ──
  dotsBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: T.border },
  dot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5e7eb' },
  dotCurrent:  { backgroundColor: T.maroon, width: 22, borderRadius: 5 },
  dotAnswered: { backgroundColor: '#16a34a' },
  dotLegend:   { fontSize: 12, color: T.textM, fontWeight: '700', marginLeft: 8, flexShrink: 0 },

  // ─────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ─────────────────────────────────────────────────────────────
  resultHero:      { paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingBottom: 36, paddingHorizontal: 24, alignItems: 'center' },
  resultEmojiBox:  { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  resultTitle:     { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center' },
  resultSub:       { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },
  scoreBig:        { flexDirection: 'row', alignItems: 'baseline', marginTop: 20, gap: 4 },
  scoreBigNum:     { fontSize: 56, fontWeight: '900', color: '#fff' },
  scoreBigSlash:   { fontSize: 32, color: 'rgba(255,255,255,0.5)' },
  scoreBigTotal:   { fontSize: 32, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },

  resultStatsRow:  { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: T.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  resultStat:      { flex: 1, alignItems: 'center' },
  resultStatNum:   { fontSize: 28, fontWeight: '900', color: T.text },
  resultStatLabel: { fontSize: 12, color: T.textM, marginTop: 4, fontWeight: '600' },
  resultStatDivider:{ width: 1, backgroundColor: T.border, marginHorizontal: 8 },
  gradeBadge:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50 },
  gradeText:       { fontSize: 22, fontWeight: '900' },

  resultBarBg:     { height: 12, backgroundColor: '#f3f4f6', borderRadius: 6, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  resultBarFill:   { height: '100%', borderRadius: 6 },
  passMark:        { position: 'absolute', top: -2, width: 2, height: 16, backgroundColor: '#9ca3af' },
  passMarkTxt:     { position: 'absolute', top: 16, fontSize: 9, color: '#9ca3af', marginLeft: -8 },
  passMarkLabel:   { fontSize: 11, color: T.textM, textAlign: 'right', marginBottom: 16 },

  certCard:        { borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#d97706' },
  certGrad:        { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  certTitle:       { fontSize: 16, fontWeight: '800', color: T.maroonD },
  certSub:         { fontSize: 12, color: '#92400e', marginTop: 4, lineHeight: 17 },

  backBtn:         { borderRadius: 50, overflow: 'hidden', marginBottom: 12, elevation: 4, shadowColor: T.maroon, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  backBtnGrad:     { paddingVertical: 18, alignItems: 'center' },
  backBtnTxt:      { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  retryBtn:        { borderWidth: 2, borderColor: T.maroon, borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  retryBtnTxt:     { fontSize: 16, fontWeight: '700', color: T.maroon },
});