export type ServiceStatus = 'ok' | 'warn' | 'down' | 'unknown';

export interface MonitoringSummary {
  overall: ServiceStatus;
  environment: 'development' | 'production';
  server_time: number; // epoch seconds
  services: {
    backend: { status: ServiceStatus; uptime_seconds: number };
    database: { status: ServiceStatus; latency_ms: number | null };
    api: {
      status: ServiceStatus;
      total: number;
      availability: number | null;
      p50_ms: number | null;
      p95_ms: number | null;
      since: number | null;
    };
    frontend: { status: ServiceStatus; errors_last_15min: number };
    siesa: { status: ServiceStatus; last_checked?: number; source?: 'send' | 'check' };
  };
  active_users: number;
  recent_errors: ServerError[];
  alerts: { level: ServiceStatus; message: string }[];
}

export interface ServerError {
  ts: number;
  method: string;
  route: string;
  status: number;
  exception?: string | null;
}

export interface MonitoringDiagnostics {
  hostname: string;
  host: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_percent: number;
    disk_free_gb: number;
  };
  database: { size_mb: number | null; user_sessions: number | null };
  slow_endpoints: { method: string; route: string; count: number; avg_ms: number; p95_ms: number; errors: number }[];
  server_errors: ServerError[];
  client_errors: { ts: number; user_id: number | null; message: string; path: string; stack: string }[];
  active_users: { user_id: number; username: string; ts: number }[];
}

export interface SiesaCheckResult {
  status: ServiceStatus;
  latency_ms?: number;
  detail?: string;
}
