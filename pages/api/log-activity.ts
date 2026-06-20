import type { NextApiRequest, NextApiResponse } from 'next';
import { logActivity } from '@/lib/supabase-logging';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email, department, status, timestamp, deviceId, location } = req.body;

  if (!email || !department || !status || !timestamp) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Get client IP
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip =
      (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : undefined) ||
      (Array.isArray(xForwardedFor) ? xForwardedFor[0] : undefined) ||
      req.socket.remoteAddress ||
      'Unknown';

    const userAgent = req.headers['user-agent'] || 'Unknown';

    const activityLog = {
      email,
      department,
      status,
      timestamp: new Date(timestamp),
      ipAddress: ip,
      userAgent,
      deviceId: deviceId || 'Unknown',
      latitude: location?.latitude,
      longitude: location?.longitude,
    };

    const result = await logActivity(activityLog);

    return res.status(200).json({
      message: 'Activity logged successfully.',
      id: result.id,
    });
  } catch (error) {
    console.error('Logging error:', error);
    return res.status(500).json({ message: 'Error logging activity.' });
  }
}
