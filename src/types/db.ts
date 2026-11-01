export type BotStatusRow = {
  id: string;
  status: string;
  last_heartbeat_at: string | null;
  last_connected_at: string | null;
  last_disconnect_reason: string | null;
};

export type ScheduleRow = {
  id: string;
  code: string;
  name: string;
  send_time: string;
  is_active: boolean;
};

export type PasswordRow = {
  id: string;
  schedule_id: string;
  valid_date: string;
  password_value: string;
  is_current: boolean;
  schedules:
    | { name: string; code: string }
    | { name: string; code: string }[]
    | null;
};

export type DeliveryLogRow = {
  id: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  group_id: string | null;
  schedule_id: string | null;
};

export type NotificationLogRow = {
  id: string;
  status: string;
  recipient_jid: string | null;
  schedule_id: string | null;
};