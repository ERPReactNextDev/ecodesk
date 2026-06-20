import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client for server-side operations with full admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client-side client for browser operations
export const supabaseClient = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE || ''
);

// Types based on the provided users table structure
export interface User {
  idx: number;
  id: number;
  ReferenceID: string;
  UserId: string;
  Firstname: string;
  Lastname: string;
  Email: string;
  userName: string;
  Password: string;
  Role: string;
  TargetQuota: number | null;
  Department: string;
  Location: string;
  Company: string;
  Manager: string;
  TSM: string;
  Status: string;
  createdAt: string;
  LockUntil: string | null;
  LoginAttempts: number;
  updatedAt: string;
  ContactNumber: string;
  profilePicture: string;
  Position: string;
  FingerprintKey: string | null;
  ManagerName: string;
  TSMName: string;
  DeviceId: string;
  Address: string | null;
  AnotherNumber: string | null;
  Birthday: string | null;
  Gender: string | null;
  OtherEmail: string | null;
  Connection: string;
  signatureImage: string | null;
  LastLoginAt: string | null;
  SecondaryEmail: string | null;
  pin: string | null;
  registrationMethod: string | null;
  twoFactorEnabled: boolean;
  otp: string | null;
  otpExpiry: string | null;
  permissions: string | null;
  credentials: string | null;
  faceDescriptors: string | null;
  faceVerificationEnabled: boolean;
  Directories: string;
  spf_owner: string | null;
}

export interface ActivityLog {
  id?: number;
  email: string;
  department: string;
  status: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}
