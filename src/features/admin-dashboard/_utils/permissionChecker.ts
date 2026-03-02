import { AdminActivityLog } from '../_types/admin.types';
import { Tables } from './schemaConfig';

interface LogActivity {
  action: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export async function logAdminActivity(
  supabase: any,
  userId: string,
  userRole: string,
  activity: LogActivity
): Promise<void> {
  try {
    // Get IP and user agent from browser
    const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
    const ipData = ipResponse ? await ipResponse.json() : null;

    const activityLog = {
      user_id: userId,
      user_role: userRole,
      action: activity.action,
      target_table: activity.targetTable || null,
      target_id: activity.targetId || null,
      metadata: activity.metadata || {},
      ip_address: ipData?.ip || null,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null
    };

    const { error } = await supabase
      .from(Tables.adminActivityLogs())
      .insert(activityLog);

    if (error) {
      console.error('Failed to log admin activity:', error);
    }
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
}

export function formatActivityLog(log: AdminActivityLog): string {
  const date = new Date(log.created_at).toLocaleString();
  let message = `[${date}] ${log.action}`;

  if (log.target_table) {
    message += ` on ${log.target_table}`;
  }

  if (log.target_id) {
    message += ` (ID: ${log.target_id})`;
  }

  return message;
}

export function filterActivityLogs(
  logs: AdminActivityLog[],
  filters: {
    userId?: string;
    action?: string;
    targetTable?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): AdminActivityLog[] {
  return logs.filter(log => {
    if (filters.userId && log.user_id !== filters.userId) return false;
    if (filters.action && !log.action.includes(filters.action)) return false;
    if (filters.targetTable && log.target_table !== filters.targetTable) return false;

    const logDate = new Date(log.created_at);
    if (filters.dateFrom && logDate < filters.dateFrom) return false;
    if (filters.dateTo && logDate > filters.dateTo) return false;

    return true;
  });
}