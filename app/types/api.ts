export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
