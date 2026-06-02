import { literalT } from "../../i18n/runtimeTamil";import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Platform, StatusBar, Alert } from
'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { billingAPI } from '../../services/api';
import PopupToast from '../../components/PopupToast';

export default function BillingScreen({ navigation }) {
  const { userInfo, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState({});
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const [tab, setTab] = useState('plan'); // 'plan', 'history'

  const showToast = (msg, type = 'error') => setToast({ visible: true, message: msg, type });

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [plansRes, histRes] = await Promise.all([
      billingAPI.getPlans(),
      billingAPI.getHistory()]
      );
      setPlans(plansRes.data?.plans || {});
      setHistory(histRes.data?.history || []);
    } catch (e) {
      showToast('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleSubscribe = async (role) => {
    try {
      setLoading(true);
      const res = await billingAPI.subscribe(role);
      await updateProfile({ ...userInfo, role: res.data.subscription.planRole, subscription: res.data.subscription });
      showToast(`Successfully subscribed to ${role} plan!`, 'success');
      fetchBillingData();
    } catch (e) {
      showToast(e?.response?.data?.message || 'Subscription failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your current subscription?',
      [
      { text: 'No, Keep it', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const res = await billingAPI.cancel();
            await updateProfile({ ...userInfo, role: 'public', subscription: res.data.subscription });
            showToast('Subscription cancelled successfully', 'success');
            fetchBillingData();
          } catch (e) {
            showToast('Failed to cancel subscription');
          } finally {
            setLoading(false);
          }
        }
      }]

    );
  };

  const currentSub = userInfo?.subscription;
  const isSubscribed = currentSub && currentSub.status !== 'cancelled' && currentSub.status !== 'pending';

  // Available plans for the user based on their current role, or if they are public
  // We can just show the plans they are eligible for. Let's just list Worker and Agent plans, and Citizen if public.
  const displayPlans = ['citizen', 'worker', 'agent'].filter((p) => p !== userInfo?.role);

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
      <PopupToast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast((t) => ({ ...t, visible: false }))} />

      <LinearGradient colors={[T.maroon, T.maroonL]} style={s.header}>
        {navigation.canGoBack() &&
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backTxt}>{literalT("← Back")}</Text>
          </TouchableOpacity>
        }
        <View style={s.headerIcon}>
          <Text style={{ fontSize: 28 }}>💳</Text>
        </View>
        <Text style={s.headerTitle}>{literalT("Pricing & Billing")}</Text>
        <Text style={s.headerSub}>{literalT("Manage your subscriptions & invoices")}</Text>
      </LinearGradient>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tabBtn, tab === 'plan' && s.tabActive]} onPress={() => setTab('plan')}>
          <Text style={[s.tabTxt, tab === 'plan' && s.tabTxtActive]}>{literalT("My Plan")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'history' && s.tabActive]} onPress={() => setTab('history')}>
          <Text style={[s.tabTxt, tab === 'history' && s.tabTxtActive]}>{literalT("Billing History")}</Text>
        </TouchableOpacity>
      </View>

      {loading ?
      <ActivityIndicator size="large" color={T.maroon} style={{ marginTop: 40 }} /> :

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {tab === 'plan' &&
        <>
              {isSubscribed ?
          <View style={s.card}>
                  <Text style={s.cardTitle}>{literalT("Current Subscription")}</Text>
                  <View style={s.planHeader}>
                    <View style={s.planIcon}><Text style={{ fontSize: 24 }}>{currentSub.planRole === 'agent' ? '🎭' : '👷'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planName}>{currentSub.planRole.toUpperCase()}{literalT("PLAN")}</Text>
                      <Text style={s.planStatus}>{literalT("Active ✅")}</Text>
                    </View>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>{literalT("Amount:")}</Text>
                    <Text style={s.val}>₹ {currentSub.amount} / {currentSub.interval}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>{literalT("Started On:")}</Text>
                    <Text style={s.val}>{new Date(currentSub.currentPeriodStart).toLocaleDateString()}</Text>
                  </View>
                  <View style={s.row}>
                    <Text style={s.label}>{literalT("Next Billing:")}</Text>
                    <Text style={s.val}>{new Date(currentSub.currentPeriodEnd).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
                    <Text style={s.cancelTxt}>{literalT("Cancel Subscription")}</Text>
                  </TouchableOpacity>
                </View> :

          <View style={s.alertBox}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>⚠️</Text>
                  <Text style={s.alertTitle}>{literalT("No Active Subscription")}</Text>
                  <Text style={s.alertSub}>{literalT("You are currently on the free Public plan. Upgrade to unlock more features.")}</Text>
                </View>
          }

              <Text style={s.sectionTitle}>{literalT("Available Upgrades")}</Text>
              {displayPlans.map((role) => {
            const p = plans[role];
            if (!p) return null;
            return (
              <View key={role} style={s.upgradeCard}>
                    <Text style={s.upgTitle}>{p.label}{literalT("Plan")}</Text>
                    <Text style={s.upgPrice}>₹ {p.amount} <Text style={{ fontSize: 14, color: T.textM }}>/ {p.interval}</Text></Text>
                    <Text style={s.upgDesc}>
                      {role === 'worker' ? 'Access worker dashboard, manage complaints, and update statuses.' :
                  role === 'agent' ? 'Manage workers, view district analytics, and handle escalations.' :
                  'Basic citizen features for reporting and tracking issues.'}
                    </Text>
                    <TouchableOpacity style={s.subBtn} onPress={() => handleSubscribe(role)}>
                      <Text style={s.subTxt}>{literalT("Subscribe to")}{p.label}</Text>
                    </TouchableOpacity>
                  </View>);

          })}
            </>
        }

          {tab === 'history' &&
        <View style={s.card}>
              <Text style={s.cardTitle}>{literalT("Invoices")}</Text>
              {history.length === 0 ?
          <Text style={s.emptyTxt}>{literalT("No billing history available.")}</Text> :

          history.map((inv, idx) =>
          <View key={idx} style={s.invRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.invId}>{inv.id}</Text>
                      <Text style={s.invDate}>{new Date(inv.date).toLocaleDateString()} - {inv.plan.toUpperCase()}{literalT("Plan")}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.invAmt}>₹ {inv.amount}</Text>
                      <Text style={s.invStatus}>{inv.status}</Text>
                    </View>
                  </View>
          )
          }
            </View>
        }
          
        </ScrollView>
      }
    </View>);

}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 52 : 40, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40, left: 20 },
  backTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  headerIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: T.border },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: T.maroon },
  tabTxt: { fontSize: 15, fontWeight: '700', color: T.textM },
  tabTxtActive: { color: T.maroon },
  body: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: T.border, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 16 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  planIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 18, fontWeight: '800', color: T.text },
  planStatus: { fontSize: 13, color: T.green, fontWeight: '700', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 14, color: T.textM, fontWeight: '600' },
  val: { fontSize: 14, color: T.text, fontWeight: '700' },
  cancelBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: T.red },
  cancelTxt: { textAlign: 'center', color: T.red, fontWeight: '700', fontSize: 14 },
  alertBox: { backgroundColor: '#FFF5F5', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FED7D7' },
  alertTitle: { fontSize: 16, fontWeight: '800', color: T.red, marginBottom: 8 },
  alertSub: { fontSize: 13, color: T.textM, textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 14, marginTop: 8 },
  upgradeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: T.gold, shadowColor: T.gold, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  upgTitle: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 8 },
  upgPrice: { fontSize: 24, fontWeight: '900', color: T.maroon, marginBottom: 12 },
  upgDesc: { fontSize: 13, color: T.textM, lineHeight: 19, marginBottom: 20 },
  subBtn: { backgroundColor: T.maroon, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  subTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  emptyTxt: { fontSize: 14, color: T.textM, textAlign: 'center', paddingVertical: 20 },
  invRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border, paddingVertical: 12 },
  invId: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 4 },
  invDate: { fontSize: 12, color: T.textM },
  invAmt: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 4 },
  invStatus: { fontSize: 12, color: T.green, fontWeight: '700' }
});
