const ROLE_PLANS = {
  public:  { role: 'public',  label: 'Citizen', amount: 1,   currency: 'INR', interval: 'month' },
  citizen: { role: 'citizen', label: 'Citizen', amount: 1,   currency: 'INR', interval: 'month' },
  worker:  { role: 'worker',  label: 'Worker',  amount: 10,  currency: 'INR', interval: 'month' },
  agent:   { role: 'agent',   label: 'Agent',   amount: 100, currency: 'INR', interval: 'month' },
  admin:   { role: 'admin',   label: 'Admin',   amount: 0,   currency: 'INR', interval: 'month' },
  superadmin: { role: 'superadmin', label: 'Super Admin', amount: 0, currency: 'INR', interval: 'month' },
};

const getPlanForRole = (role) => ROLE_PLANS[role] || ROLE_PLANS.public;

module.exports = {
  ROLE_PLANS,
  getPlanForRole,
};
