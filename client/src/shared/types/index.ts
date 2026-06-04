export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface HealthData {
  service: string;
  status: string;
  timestamp: string;
}
