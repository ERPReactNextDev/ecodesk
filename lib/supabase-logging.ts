import { supabase, ActivityLog } from './supabase';

export async function logActivity(activityLog: ActivityLog) {
  const { data, error } = await supabase
    .from('activityLogs')
    .insert({
      email: activityLog.email,
      department: activityLog.department,
      status: activityLog.status,
      timestamp: activityLog.timestamp.toISOString(),
      ipAddress: activityLog.ipAddress,
      userAgent: activityLog.userAgent,
      deviceId: activityLog.deviceId,
      latitude: activityLog.latitude,
      longitude: activityLog.longitude,
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    throw error;
  }

  return data;
}

export async function getActivityLogsByEmail(email: string) {
  const { data, error } = await supabase
    .from('activityLogs')
    .select('*')
    .eq('email', email)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }

  return data;
}

export async function getActivityLogsByDepartment(department: string) {
  const { data, error } = await supabase
    .from('activityLogs')
    .select('*')
    .eq('department', department)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }

  return data;
}
