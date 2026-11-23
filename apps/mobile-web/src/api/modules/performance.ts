import { get } from '@/api/request'

export interface TodayPerformance {
	today_income: number
	today_orders: number
	today_duration: number
	today_rating: number
}

export interface TrendItem {
	date: string
	income: number
	orders: number
}

export interface RankingItem {
	rank: number
	name: string
	income: number
	orders: number
}

export interface RankingData {
	my_rank: number
	my_income: number
	list: RankingItem[]
}

export interface MonthlyStats {
	total_orders: number
	total_income: number
	total_duration: number
	avg_rating: number
	rating_count: number
}

export function getPerformance(type: string = 'today'): Promise<TodayPerformance> {
	return get('/mobile.Performance/index', { type })
}

export function getPerformanceTrend(days: number = 7): Promise<{ list: TrendItem[] }> {
	return get('/mobile.Performance/trend', { days })
}

export function getRanking(): Promise<RankingData> {
	return get('/mobile.Performance/ranking')
}

export function getMonthly(): Promise<MonthlyStats> {
	return get('/mobile.Performance/monthly')
}

export interface DurationReportItem {
	date: string
	weekday: string
	table_name: string
	duration_minutes: number
}

export function getDurationReport(startDate: string, endDate: string): Promise<DurationReportItem[]> {
	return get('/mobile.Performance/durationReport', { start_date: startDate, end_date: endDate }) as any
}

export interface DailySummaryItem {
	date: string
	weekday: string
	order_count: number
	total_duration: number
}

export function getDailySummary(startDate: string, endDate: string): Promise<DailySummaryItem[]> {
	return get('/mobile.Performance/dailySummary', { start_date: startDate, end_date: endDate }) as any
}
