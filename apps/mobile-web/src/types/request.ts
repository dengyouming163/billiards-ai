export interface RequestOptions<T = Record<string, unknown>> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: T
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
  cache?: boolean
}
