import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const en = {
  // Nav
  dashboard:     'Dashboard',
  complaints:    'Complaints',
  workers:       'Workers',
  newsAndCamps:  'News & Camps',
  education:     'Education',
  analytics:     'Analytics',
  notifications: 'Notifications',
  logout:        'Logout',

  // Actions
  addWorker:     '+ Add Worker',
  addComplaint:  '+ File Complaint',
  addNews:       '+ Add News',
  addCamp:       '+ Add Camp',
  uploadVideo:   '+ Upload',
  createExam:    '+ Create',
  sendAnnounce:  '📣 Announce',
  sendNotif:     '📣 Send Announcement',
  viewAttach:    'View Attachments',
  noAttach:      'No attachments',
  attach:        'Attachments',
  photo:         'Photo',
  video:         'Video',
  updateStatus:  'Update status:',
  reportedOn:    'Reported',
  searchWorkers: '🔍  Search workers...',
  allDistricts:  'All 38 Districts',
  results:       'results',

  // Dashboard
  totalComplaints: 'Total Complaints',
  pending:         'Pending',
  completed:       'Completed',
  activeWorkers:   'Active Workers',
  weeklyActivity:  'Weekly Activity',
  submitted:       'Submitted',
  resolved:        'Resolved',
  byCategory:      'By Category',
  distribution:    'Distribution',
  recentComplaints:'Recent Complaints',
  viewAll:         'View all →',
  districtPerf:    'District Performance',
  completionRate:  'Completion Rate',
  overallResolution:'Overall Resolution',

  // Status
  statusNew:       'NEW',
  statusProgress:  'IN PROGRESS',
  statusDone:      'COMPLETED',
  allStatus:       'ALL',

  // Workers
  resolutionRate:  'Resolution rate',
  removeWorker:    '🗑️ Remove Worker',
  addNewWorker:    'Add New Worker',
  resolvedCount:   'Resolved',
  pendingCount:    'Pending',
  rating:          'Rating',

  // News
  news:            '📰 News',
  camps:           '🏕️ Camps',
  published:       'published',
  draft:           'draft',
  delete:          'Delete',
  notifyUsers:     '📣 Notify',
  addNewCamp:      'Add New Camp',

  // Education
  videos:          '🎥 Videos',
  exams:           '📝 Exams',
  certificates:    '🏆 Certificates',
  autoIssued:      'Auto-issued when score ≥ 60%',
  viewSummary:     'View Summary →',
  noVideos:        'No videos yet',
  noExams:         'No exams yet',

  // Analytics
  avgResolutionTime: 'Avg Resolution Time',
  citizenSatisfaction:'Citizen Satisfaction',
  workerEfficiency:  'Worker Efficiency',
  repeatComplaints:  'Repeat Complaints',
  weeklyTrend:       'Weekly Trend',
  districtBreakdown: 'District Breakdown',

  // Notifications
  activityLogs:    'activity logs',
  noNotifications: 'No notifications yet',

  // Forms
  fullName:    'Full Name',
  email:       'Email',
  phone:       'Phone',
  password:    'Password',
  boothNumber: 'Booth Number',
  district:    'District',
  category:    'Category',
  description: 'Description',
  title:       'Title',
  content:     'Content',
  level:       'Level',
  status:      'Status',
  type:        'Type',
  location:    'Location',
  date:        'Date',
  slots:       'Total Slots',
  duration:    'Duration',
  totalMarks:  'Total Marks',
  message:     'Message',
  saving:      '⏳ Saving...',

  // Language
  language:    'Language',
  english:     'English',
  tamil:       'தமிழ்',
};

const ta = {
  // Nav
  dashboard:     'டாஷ்போர்டு',
  complaints:    'புகார்கள்',
  workers:       'பணியாளர்கள்',
  newsAndCamps:  'செய்தி & முகாம்',
  education:     'கல்வி',
  analytics:     'பகுப்பாய்வு',
  notifications: 'அறிவிப்புகள்',
  logout:        'வெளியேறு',

  // Actions
  addWorker:     '+ பணியாளர் சேர்',
  addComplaint:  '+ புகார் பதிவு',
  addNews:       '+ செய்தி சேர்',
  addCamp:       '+ முகாம் சேர்',
  uploadVideo:   '+ பதிவேற்று',
  createExam:    '+ உருவாக்கு',
  sendAnnounce:  '📣 அறிவிக்க',
  sendNotif:     '📣 அறிவிப்பு அனுப்பு',
  viewAttach:    'இணைப்புகள் பார்',
  noAttach:      'இணைப்புகள் இல்லை',
  attach:        'இணைப்புகள்',
  photo:         'புகைப்படம்',
  video:         'வீடியோ',
  updateStatus:  'நிலை புதுப்பி:',
  reportedOn:    'புகாரளித்த நாள்',
  searchWorkers: '🔍  பணியாளர் தேடு...',
  allDistricts:  'அனைத்து 38 மாவட்டங்கள்',
  results:       'முடிவுகள்',

  // Dashboard
  totalComplaints: 'மொத்த புகார்கள்',
  pending:         'நிலுவை',
  completed:       'முடிந்தவை',
  activeWorkers:   'செயலில் உள்ள பணியாளர்கள்',
  weeklyActivity:  'வாராந்திர செயல்பாடு',
  submitted:       'சமர்ப்பிக்கப்பட்டவை',
  resolved:        'தீர்வு செய்யப்பட்டவை',
  byCategory:      'வகை வாரியாக',
  distribution:    'பரவல்',
  recentComplaints:'சமீபத்திய புகார்கள்',
  viewAll:         'அனைத்தும் பார் →',
  districtPerf:    'மாவட்ட செயல்திறன்',
  completionRate:  'தீர்வு விகிதம்',
  overallResolution:'மொத்த தீர்வு',

  // Status
  statusNew:       'புதிய',
  statusProgress:  'செயலில்',
  statusDone:      'முடிந்தது',
  allStatus:       'அனைத்தும்',

  // Workers
  resolutionRate:  'தீர்வு விகிதம்',
  removeWorker:    '🗑️ நீக்கு',
  addNewWorker:    'புதிய பணியாளர் சேர்',
  resolvedCount:   'தீர்வு',
  pendingCount:    'நிலுவை',
  rating:          'மதிப்பீடு',

  // News
  news:            '📰 செய்தி',
  camps:           '🏕️ முகாம்கள்',
  published:       'வெளியிடப்பட்டது',
  draft:           'வரைவு',
  delete:          'நீக்கு',
  notifyUsers:     '📣 அறிவிக்க',
  addNewCamp:      'புதிய முகாம் சேர்',

  // Education
  videos:          '🎥 வீடியோக்கள்',
  exams:           '📝 தேர்வுகள்',
  certificates:    '🏆 சான்றிதழ்கள்',
  autoIssued:      '60% மேல் பெற்றால் தானாக வழங்கப்படும்',
  viewSummary:     'சுருக்கம் பார் →',
  noVideos:        'வீடியோக்கள் இல்லை',
  noExams:         'தேர்வுகள் இல்லை',

  // Analytics
  avgResolutionTime: 'சராசரி தீர்வு நேரம்',
  citizenSatisfaction:'குடிமகன் திருப்தி',
  workerEfficiency:  'பணியாளர் திறன்',
  repeatComplaints:  'மீண்டும் புகார்கள்',
  weeklyTrend:       'வாராந்திர போக்கு',
  districtBreakdown: 'மாவட்ட விவரம்',

  // Notifications
  activityLogs:    'செயல் பதிவுகள்',
  noNotifications: 'அறிவிப்புகள் இல்லை',

  // Forms
  fullName:    'முழு பெயர்',
  email:       'மின்னஞ்சல்',
  phone:       'தொலைபேசி',
  password:    'கடவுச்சொல்',
  boothNumber: 'பூத் எண்',
  district:    'மாவட்டம்',
  category:    'வகை',
  description: 'விவரம்',
  title:       'தலைப்பு',
  content:     'உள்ளடக்கம்',
  level:       'நிலை',
  status:      'நிலை',
  type:        'வகை',
  location:    'இடம்',
  date:        'தேதி',
  slots:       'மொத்த இடங்கள்',
  duration:    'கால அளவு',
  totalMarks:  'மொத்த மதிப்பெண்',
  message:     'செய்தி',
  saving:      '⏳ சேமிக்கிறது...',

  // Language
  language:    'மொழி',
  english:     'English',
  tamil:       'தமிழ்',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'adminLang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;