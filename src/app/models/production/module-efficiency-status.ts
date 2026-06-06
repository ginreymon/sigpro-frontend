export interface ModuleEfficiencyStatus {
    module_id: number;
    number: number;
    name: string;
    location: string;
    
    work_shift_id: number;
    start_time: string;
    work_shift_start_utc: string;

    period_start: string;
    period_end: string;

    operator_count: number;

    total_ordered: number;
    total_planned: number;
    total_completed: number;
    total_scrap: number;
    total_rejected: number;
    total_produced: number;

    unit_target: number;
    efficiency: number;

    status: string;
    is_active: number;
    is_pause: number;
    module_enabled: boolean;

    started_at: string | null;

    work_session_id: number | null;
    work_session_activity_id: number | null;
}