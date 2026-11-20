import { get } from '@/api/request'

export interface DateRange {
    date_type: string
    start_date: string
    end_date: string
    label: string
}

export interface RevenueData {
    table_revenue: number
    assistant_revenue: number
    product_revenue: number
    package_revenue: number
    total_revenue: number
    order_count: number
    last_period_revenue: number
    revenue_change: number
}

export interface KPIData {
    occupancy_rate: number
    turnover_rate: number
    avg_customer_spend: number
    table_utilization: number
}

export interface TrendData {
    date: string
    date_value: string
    revenue: number
    orders: number
}

export interface HotProduct {
    rank: number
    name: string
    revenue: number
    quantity: number
}

export interface StaffStats {
    total_employees: number
    checked_in_count: number
    checkin_rate: number
    total_assistants: number
    working_assistants: number
}

export interface PendingTasks {
    approvals: number
    orders: number
    notifications: number
}

export interface DashboardData {
    date_range: DateRange
    revenue: RevenueData
    kpi: KPIData
    trend: TrendData[]
    hot_products: HotProduct[]
    staff_stats: StaffStats
    pending_tasks: PendingTasks
}

export function getDashboardData(
    dateType: string = 'today',
    startDate?: string,
    endDate?: string
): Promise<DashboardData> {
    const params: Record<string, string> = {
        date_type: dateType
    }
    if (dateType === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
    }

    return get<DashboardData>('/mobile.Mobile/dashboardStats', params)
}

// === ReportService P0 ===

export interface ReportRevenue {
    table_revenue: number
    assistant_revenue: number
    product_revenue: number
    charging_revenue: number
    package_revenue: number
    total_revenue: number
    order_count: number
    last_period_revenue: number
    revenue_change: number
}

export interface ReportOperation {
    order_count: number
    total_duration_minutes: number
    avg_order_amount: number
    avg_customer_spend: number
    avg_duration_minutes: number
    total_customers: number
    total_tables: number
    occupied_tables: number
    occupancy_rate: number
    turnover_rate: number
    table_utilization: number
    product_sales_count?: number
    table_duration_minutes?: number
    assistant_duration_minutes?: number
    outwork_duration_minutes?: number
    meituan_duration_minutes?: number
    douyin_duration_minutes?: number
}

export interface ReportProduct {
    rank: number
    name: string
    revenue: number
    quantity: number
}

/** 收入总览 */
export function getRevenueSummary(params: { store_id?: string; start_date: string; end_date: string }): Promise<ReportRevenue> {
    return get('/report.Report/revenueSummary', params as any)
}

/** 运营指标 */
export function getOperationOverview(params: { store_id?: string; start_date: string; end_date: string }): Promise<ReportOperation> {
    return get('/report.Report/operationOverview', params as any)
}

/** 商品排行 */
export function getProductRank(params: { store_id?: string; start_date: string; end_date: string; limit?: number }): Promise<ReportProduct[]> {
    return get('/report.Report/productRank', params as any)
}

// === 考勤报表 ===

export interface AttendanceReportEmployee {
    employee_id: string
    employee_name: string
    role: string
    role_name: string
    avatar?: string
    scheduled_days: number
    sign_in_days: number
    absent_days: number
    late_days: number
    attendance_rate: number
    has_photos: boolean
    daily_records?: AttendanceDailyRecord[]
}

export interface AttendanceDailyRecord {
    date: string
    week_day: string
    is_scheduled: boolean
    sign_in_time?: string
    sign_out_time?: string
    status: 'normal' | 'late' | 'absent' | 'off'
    photos?: string[]
}

export interface AttendanceReportData {
    month: string
    total_employees: number
    total_scheduled_days: number
    total_sign_in_days: number
    overall_attendance_rate: number
    employees: AttendanceReportEmployee[]
}

export function getAttendanceReport(params: { month: string; employee_type?: string }): Promise<AttendanceReportData> {
    return get('/report.Report/attendanceReport', params as any)
}

// === 收入渠道 ===
export interface ChannelRevenue {
    channel: string
    channel_label: string
    revenue: number
    order_count: number
}
export function getRevenueByChannel(params: { start_date: string; end_date: string }): Promise<ChannelRevenue[]> {
    return get('/report.Report/revenueByChannel', params as any)
}

// === 收入项目 ===
export interface ItemTypeRevenue {
    item_type: string
    item_label: string
    revenue: number
    order_count: number
}
export function getRevenueByItemType(params: { start_date: string; end_date: string }): Promise<ItemTypeRevenue[]> {
    return get('/report.Report/revenueByItemType', params as any)
}

// === 充值报表 ===
export interface RechargeItem {
    channel: string
    amount: number
    count: number
}
export function getRechargeReport(params: { start_date: string; end_date: string }): Promise<RechargeItem[]> {
    return get('/report.Report/rechargeReport', params as any)
}