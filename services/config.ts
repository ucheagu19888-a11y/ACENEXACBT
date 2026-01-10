// Configuration for API connection and external services
// Uses environment variables for flexibility across environments

// Backend API URL - uses environment variable in production
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Offline Mode Toggle - set to true to disable backend and use local storage only
export const FORCE_OFFLINE = false;

// Paystack Public Key - uses environment variable in production
// Use TEST keys for development (pk_test_), LIVE keys for production (pk_live_)
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_1234567890abcdefghijklmnopqrstuvwxyz";

/**
 * Get full API URL with endpoint
 * @param endpoint - API endpoint path (e.g., "/api/auth/login")
 * @returns Complete URL
 */
export const getApiUrl = (endpoint: string): string => {
    // Ensure no double slashes if BACKEND_URL ends with /
    const base = BACKEND_URL.replace(/\/$/, '');
    return `${base}${endpoint}`;
};

/**
 * Configuration validation for production
 */
export const validateConfig = (): void => {
    if (!BACKEND_URL || BACKEND_URL.includes('localhost')) {
        console.warn('⚠️  Using localhost backend URL. Set VITE_API_BASE_URL for production.');
    }

    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.includes('1234567890')) {
        console.warn('⚠️  Using placeholder Paystack key. Set VITE_PAYSTACK_PUBLIC_KEY for production.');
    }

    console.log('Configuration loaded:', {
        backend: BACKEND_URL,
        offlineMode: FORCE_OFFLINE,
        paystackConfigured: PAYSTACK_PUBLIC_KEY.startsWith('pk_'),
    });
};

// Run validation on import (helps catch missing env vars early)
if (typeof window !== 'undefined') {
    validateConfig();
}