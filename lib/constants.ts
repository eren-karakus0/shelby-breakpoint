import { isDevelopment } from "./environment";

export const UPLOAD_ALLOWLIST_ADDRESSES =
  (process.env.NEXT_PUBLIC_UPLOAD_ALLOWLIST_ADDRESSES &&
    process.env.NEXT_PUBLIC_UPLOAD_ALLOWLIST_ADDRESSES?.split(",")) ||
  [];

export const ALLOWED_HOSTS =
  (process.env.NEXT_PUBLIC_ALLOWED_HOSTS &&
    process.env.NEXT_PUBLIC_ALLOWED_HOSTS?.split(",")) ||
  (isDevelopment ? ["localhost:3000"] : []);

// Pagination
export const VIDEO_PAGE_SIZE = 20;

// Video recording
export const MAX_RECORDING_TIME_SECONDS = 60;

// Blob storage
export const BLOB_EXPIRATION_DAYS = 14;

// JWT Signing
export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (isDevelopment ? "4a2c3d6bf8de0daef57e15e389e9e967" : undefined);

// reCAPTCHA v3 verification
export const RECAPTCHA_VERIFY_URL =
  "https://www.google.com/recaptcha/api/siteverify";
export const RECAPTCHA_SCORE_THRESHOLD = 0.5;

export const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
export const NEXT_PUBLIC_RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Profile field limits
export const MAX_USERNAME_LENGTH = 30;
export const MAX_BIO_LENGTH = 200;
