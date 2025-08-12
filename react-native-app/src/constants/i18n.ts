// 🌍 Tactical Mapping System - Internationalization (i18n)
// Supports: Arabic (RTL) and English (LTR) with tactical/military terminology

export type SupportedLanguage = 'en' | 'ar';
export type TextDirection = 'ltr' | 'rtl';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: TextDirection;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
  },
};

// Translation keys interface for type safety
export interface TranslationKeys {
  // App general
  app: {
    name: string;
    tagline: string;
    version: string;
  };
  
  // Navigation
  navigation: {
    home: string;
    map: string;
    communication: string;
    targets: string;
    settings: string;
    back: string;
    close: string;
    menu: string;
  };
  
  // Authentication
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    signIn: string;
    signOut: string;
    welcome: string;
    unauthorized: string;
  };
  
  // Map interface
  map: {
    title: string;
    loading: string;
    offline: string;
    online: string;
    layers: string;
    zoom: {
      in: string;
      out: string;
      fit: string;
    };
    location: {
      current: string;
      sharing: string;
      accuracy: string;
    };
    drawing: {
      point: string;
      line: string;
      polygon: string;
      circle: string;
      rectangle: string;
      clear: string;
      save: string;
      cancel: string;
    };
  };
  
  // Tactical operations
  tactical: {
    session: {
      create: string;
      join: string;
      leave: string;
      active: string;
      participants: string;
      name: string;
      description: string;
    };
    targets: {
      add: string;
      edit: string;
      delete: string;
      track: string;
      classify: string;
      friendly: string;
      hostile: string;
      neutral: string;
      unknown: string;
      priority: {
        critical: string;
        high: string;
        medium: string;
        low: string;
      };
    };
    geofencing: {
      create: string;
      edit: string;
      delete: string;
      alerts: string;
      entry: string;
      exit: string;
      violation: string;
    };
    navigation: {
      route: string;
      waypoint: string;
      distance: string;
      duration: string;
      elevation: string;
      bearing: string;
      calculate: string;
      start: string;
      stop: string;
    };
  };
  
  // Communication
  communication: {
    chat: {
      title: string;
      message: string;
      send: string;
      typing: string;
      online: string;
      offline: string;
      history: string;
      search: string;
    };
    video: {
      call: string;
      answer: string;
      decline: string;
      mute: string;
      unmute: string;
      camera: string;
      screen: string;
      participants: string;
    };
    media: {
      photo: string;
      video: string;
      audio: string;
      document: string;
      location: string;
      share: string;
    };
  };
  
  // Emergency
  emergency: {
    alert: string;
    panic: string;
    medical: string;
    evacuation: string;
    distress: string;
    sos: string;
    contacts: string;
    procedures: string;
  };
  
  // Settings
  settings: {
    title: string;
    theme: string;
    language: string;
    notifications: string;
    privacy: string;
    security: string;
    about: string;
    help: string;
    feedback: string;
  };
  
  // Themes
  themes: {
    light: string;
    dark: string;
    desertCamo: string;
    forestCamo: string;
  };
  
  // Common actions
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    confirm: string;
    retry: string;
    refresh: string;
    search: string;
    filter: string;
    sort: string;
    export: string;
    import: string;
  };
  
  // Status messages
  status: {
    loading: string;
    saving: string;
    saved: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    connecting: string;
    connected: string;
    disconnected: string;
  };
  
  // Time and dates
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    minutes: string;
    hours: string;
    days: string;
    weeks: string;
    months: string;
    years: string;
  };
  
  // Units
  units: {
    meters: string;
    kilometers: string;
    feet: string;
    miles: string;
    degrees: string;
    seconds: string;
    minutes: string;
    hours: string;
  };
}

// English translations
export const EN_TRANSLATIONS: TranslationKeys = {
  app: {
    name: 'Tactical Mapping',
    tagline: 'Advanced Tactical Operations Platform',
    version: 'v1.0.0',
  },
  
  navigation: {
    home: 'Home',
    map: 'Map',
    communication: 'Comms',
    targets: 'Targets',
    settings: 'Settings',
    back: 'Back',
    close: 'Close',
    menu: 'Menu',
  },
  
  auth: {
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    welcome: 'Welcome',
    unauthorized: 'Unauthorized Access',
  },
  
  map: {
    title: 'Tactical Map',
    loading: 'Loading Map...',
    offline: 'Offline Mode',
    online: 'Online Mode',
    layers: 'Layers',
    zoom: {
      in: 'Zoom In',
      out: 'Zoom Out',
      fit: 'Fit to View',
    },
    location: {
      current: 'Current Location',
      sharing: 'Location Sharing',
      accuracy: 'Accuracy',
    },
    drawing: {
      point: 'Point',
      line: 'Line',
      polygon: 'Polygon',
      circle: 'Circle',
      rectangle: 'Rectangle',
      clear: 'Clear',
      save: 'Save',
      cancel: 'Cancel',
    },
  },
  
  tactical: {
    session: {
      create: 'Create Session',
      join: 'Join Session',
      leave: 'Leave Session',
      active: 'Active Session',
      participants: 'Participants',
      name: 'Session Name',
      description: 'Description',
    },
    targets: {
      add: 'Add Target',
      edit: 'Edit Target',
      delete: 'Delete Target',
      track: 'Track Target',
      classify: 'Classify',
      friendly: 'Friendly',
      hostile: 'Hostile',
      neutral: 'Neutral',
      unknown: 'Unknown',
      priority: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
    },
    geofencing: {
      create: 'Create Geofence',
      edit: 'Edit Geofence',
      delete: 'Delete Geofence',
      alerts: 'Alerts',
      entry: 'Entry Alert',
      exit: 'Exit Alert',
      violation: 'Violation',
    },
    navigation: {
      route: 'Route',
      waypoint: 'Waypoint',
      distance: 'Distance',
      duration: 'Duration',
      elevation: 'Elevation',
      bearing: 'Bearing',
      calculate: 'Calculate',
      start: 'Start Navigation',
      stop: 'Stop Navigation',
    },
  },
  
  communication: {
    chat: {
      title: 'Chat',
      message: 'Message',
      send: 'Send',
      typing: 'Typing...',
      online: 'Online',
      offline: 'Offline',
      history: 'History',
      search: 'Search Messages',
    },
    video: {
      call: 'Video Call',
      answer: 'Answer',
      decline: 'Decline',
      mute: 'Mute',
      unmute: 'Unmute',
      camera: 'Camera',
      screen: 'Screen Share',
      participants: 'Participants',
    },
    media: {
      photo: 'Photo',
      video: 'Video',
      audio: 'Audio',
      document: 'Document',
      location: 'Location',
      share: 'Share',
    },
  },
  
  emergency: {
    alert: 'Emergency Alert',
    panic: 'Panic Button',
    medical: 'Medical Emergency',
    evacuation: 'Evacuation',
    distress: 'Distress Signal',
    sos: 'SOS',
    contacts: 'Emergency Contacts',
    procedures: 'Emergency Procedures',
  },
  
  settings: {
    title: 'Settings',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy',
    security: 'Security',
    about: 'About',
    help: 'Help',
    feedback: 'Feedback',
  },
  
  themes: {
    light: 'Light',
    dark: 'Dark',
    desertCamo: 'Desert Camo',
    forestCamo: 'Forest Camo',
  },
  
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    confirm: 'Confirm',
    retry: 'Retry',
    refresh: 'Refresh',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
  },
  
  status: {
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
  },
  
  time: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
  },
  
  units: {
    meters: 'm',
    kilometers: 'km',
    feet: 'ft',
    miles: 'mi',
    degrees: '°',
    seconds: 's',
    minutes: 'min',
    hours: 'h',
  },
};

// Arabic translations (RTL)
export const AR_TRANSLATIONS: TranslationKeys = {
  app: {
    name: 'الخرائط التكتيكية',
    tagline: 'منصة العمليات التكتيكية المتقدمة',
    version: 'الإصدار 1.0.0',
  },
  
  navigation: {
    home: 'الرئيسية',
    map: 'الخريطة',
    communication: 'الاتصالات',
    targets: 'الأهداف',
    settings: 'الإعدادات',
    back: 'رجوع',
    close: 'إغلاق',
    menu: 'القائمة',
  },
  
  auth: {
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'دخول',
    signOut: 'خروج',
    welcome: 'مرحباً',
    unauthorized: 'وصول غير مصرح',
  },
  
  map: {
    title: 'الخريطة التكتيكية',
    loading: 'جاري تحميل الخريطة...',
    offline: 'وضع عدم الاتصال',
    online: 'وضع الاتصال',
    layers: 'الطبقات',
    zoom: {
      in: 'تكبير',
      out: 'تصغير',
      fit: 'ملائمة العرض',
    },
    location: {
      current: 'الموقع الحالي',
      sharing: 'مشاركة الموقع',
      accuracy: 'الدقة',
    },
    drawing: {
      point: 'نقطة',
      line: 'خط',
      polygon: 'مضلع',
      circle: 'دائرة',
      rectangle: 'مستطيل',
      clear: 'مسح',
      save: 'حفظ',
      cancel: 'إلغاء',
    },
  },
  
  tactical: {
    session: {
      create: 'إنشاء جلسة',
      join: 'انضمام للجلسة',
      leave: 'مغادرة الجلسة',
      active: 'جلسة نشطة',
      participants: 'المشاركون',
      name: 'اسم الجلسة',
      description: 'الوصف',
    },
    targets: {
      add: 'إضافة هدف',
      edit: 'تعديل الهدف',
      delete: 'حذف الهدف',
      track: 'تتبع الهدف',
      classify: 'تصنيف',
      friendly: 'صديق',
      hostile: 'عدائي',
      neutral: 'محايد',
      unknown: 'مجهول',
      priority: {
        critical: 'حرج',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
      },
    },
    geofencing: {
      create: 'إنشاء سياج جغرافي',
      edit: 'تعديل السياج',
      delete: 'حذف السياج',
      alerts: 'التنبيهات',
      entry: 'تنبيه الدخول',
      exit: 'تنبيه الخروج',
      violation: 'انتهاك',
    },
    navigation: {
      route: 'المسار',
      waypoint: 'نقطة طريق',
      distance: 'المسافة',
      duration: 'المدة',
      elevation: 'الارتفاع',
      bearing: 'الاتجاه',
      calculate: 'حساب',
      start: 'بدء الملاحة',
      stop: 'إيقاف الملاحة',
    },
  },
  
  communication: {
    chat: {
      title: 'المحادثة',
      message: 'رسالة',
      send: 'إرسال',
      typing: 'يكتب...',
      online: 'متصل',
      offline: 'غير متصل',
      history: 'السجل',
      search: 'البحث في الرسائل',
    },
    video: {
      call: 'مكالمة فيديو',
      answer: 'رد',
      decline: 'رفض',
      mute: 'كتم',
      unmute: 'إلغاء الكتم',
      camera: 'الكاميرا',
      screen: 'مشاركة الشاشة',
      participants: 'المشاركون',
    },
    media: {
      photo: 'صورة',
      video: 'فيديو',
      audio: 'صوت',
      document: 'مستند',
      location: 'الموقع',
      share: 'مشاركة',
    },
  },
  
  emergency: {
    alert: 'تنبيه طوارئ',
    panic: 'زر الذعر',
    medical: 'طوارئ طبية',
    evacuation: 'إخلاء',
    distress: 'إشارة استغاثة',
    sos: 'استغاثة',
    contacts: 'جهات اتصال الطوارئ',
    procedures: 'إجراءات الطوارئ',
  },
  
  settings: {
    title: 'الإعدادات',
    theme: 'المظهر',
    language: 'اللغة',
    notifications: 'الإشعارات',
    privacy: 'الخصوصية',
    security: 'الأمان',
    about: 'حول',
    help: 'المساعدة',
    feedback: 'التعليقات',
  },
  
  themes: {
    light: 'فاتح',
    dark: 'داكن',
    desertCamo: 'تمويه صحراوي',
    forestCamo: 'تمويه غابات',
  },
  
  actions: {
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    remove: 'إزالة',
    confirm: 'تأكيد',
    retry: 'إعادة المحاولة',
    refresh: 'تحديث',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    export: 'تصدير',
    import: 'استيراد',
  },
  
  status: {
    loading: 'جاري التحميل...',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    info: 'معلومات',
    connecting: 'جاري الاتصال...',
    connected: 'متصل',
    disconnected: 'منقطع',
  },
  
  time: {
    now: 'الآن',
    today: 'اليوم',
    yesterday: 'أمس',
    tomorrow: 'غداً',
    minutes: 'دقائق',
    hours: 'ساعات',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'أشهر',
    years: 'سنوات',
  },
  
  units: {
    meters: 'م',
    kilometers: 'كم',
    feet: 'قدم',
    miles: 'ميل',
    degrees: '°',
    seconds: 'ث',
    minutes: 'د',
    hours: 'س',
  },
};

// Translation registry
export const TRANSLATIONS = {
  en: EN_TRANSLATIONS,
  ar: AR_TRANSLATIONS,
} as const;

// i18n utilities
export const getTranslation = (language: SupportedLanguage, key: string): string => {
  const keys = key.split('.');
  let value: any = TRANSLATIONS[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

export const isRTL = (language: SupportedLanguage): boolean => {
  return SUPPORTED_LANGUAGES[language].direction === 'rtl';
};

export const getLanguageConfig = (language: SupportedLanguage): LanguageConfig => {
  return SUPPORTED_LANGUAGES[language];
};

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';