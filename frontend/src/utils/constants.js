// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9090/api';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'perfectlinks_access_token',
  REFRESH_TOKEN: 'perfectlinks_refresh_token',
  USER: 'perfectlinks_user',
};

// HTTP Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Link status display config
export const LINK_STATUS_CONFIG = {
  200: { label: 'OK', color: 'success', bgColor: 'bg-success-50', textColor: 'text-success-700' },
  201: { label: 'Created', color: 'success', bgColor: 'bg-success-50', textColor: 'text-success-700' },
  301: { label: 'Redirect 301', color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-700' },
  302: { label: 'Redirect 302', color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-700' },
  307: { label: 'Redirect 307', color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-700' },
  308: { label: 'Redirect 308', color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-700' },
  400: { label: 'Bad Request', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  401: { label: 'Unauthorized', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  403: { label: 'Forbidden', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  404: { label: 'Not Found', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  500: { label: 'Server Error', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  503: { label: 'Unavailable', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-700' },
  0: { label: 'Error', color: 'danger', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

// Plans quotas
export const PLAN_QUOTAS = {
  free: 100,
  premium: 500,
  pro: 1000,
};

export const PLAN_LABELS = {
  free: 'Gratuit',
  premium: 'Premium',
  pro: 'Pro',
};
