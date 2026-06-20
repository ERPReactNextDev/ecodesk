import bcrypt from 'bcrypt';
import { supabase, User } from './supabase';

// Simple in-memory cache for user data
const userCache = new Map<string, User>();

export async function validateUser({
  Email,
  Password,
}: {
  Email: string;
  Password: string;
}) {
  // Check cache first (avoid DB hit)
  if (userCache.has(Email)) {
    const cachedUser = userCache.get(Email);
    if (cachedUser) {
      const isValidPassword = await bcrypt.compare(Password, cachedUser.Password);
      if (isValidPassword) return { success: true, user: cachedUser };
    }
  }

  // Find user in Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('Email', Email)
    .single();

  if (error || !user) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Validate password
  const isValidPassword = await bcrypt.compare(Password, user.Password);
  if (!isValidPassword) {
    return { success: false, message: 'Invalid email or password' };
  }

  // Save to cache for faster next access
  userCache.set(Email, user as User);

  return { success: true, user: user as User };
}

export async function getUserByEmail(Email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('Email', Email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function getUserByReferenceID(ReferenceID: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('ReferenceID', ReferenceID)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function updateUserLoginAttempts(Email: string, attempts: number) {
  const { error } = await supabase
    .from('users')
    .update({ LoginAttempts: attempts })
    .eq('Email', Email);

  if (error) {
    console.error('Error updating login attempts:', error);
  }
}

export async function lockUserAccount(Email: string, lockUntil: string) {
  const { error } = await supabase
    .from('users')
    .update({
      Status: 'Locked',
      LockUntil: lockUntil,
    })
    .eq('Email', Email);

  if (error) {
    console.error('Error locking user account:', error);
  }
}

export async function resetUserLoginAttempts(Email: string) {
  const { error } = await supabase
    .from('users')
    .update({
      LoginAttempts: 0,
      Status: 'Active',
      LockUntil: null,
    })
    .eq('Email', Email);

  if (error) {
    console.error('Error resetting login attempts:', error);
  }
}

export async function updateUserLastLogin(Email: string) {
  const { error } = await supabase
    .from('users')
    .update({
      LastLoginAt: new Date().toISOString(),
    })
    .eq('Email', Email);

  if (error) {
    console.error('Error updating last login:', error);
  }
}
