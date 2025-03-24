export interface Location {
  latitude: number;
  longitude: number;
}

export interface Stop {
  id: string;
  trip: string;
  location: Location;
  sequence: number;
  status: 'pending' | 'completed' | 'skipped';
  stop_type: 'pickup' | 'dropoff' | 'rest' | 'fuel';
  arrival_time: string;
  duration_minutes: number;
  cycle_hours_at_stop: number;
  distance_from_last_stop: number;
  created_at: string;
  updated_at: string;
}

export interface LogSheet {
  id: string;
  trip: string;
  start_time: string;
  end_time?: string;
  start_location: Location;
  end_location?: Location;
  start_cycle_hours: number;
  end_cycle_hours?: number;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RouteGeometry {
  coordinates: [number, number][];
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: any[];
}

export interface Route {
  routes?: Array<{
    geometry: RouteGeometry;
    distance: number;
    duration: number;
    legs: RouteLeg[];
  }>;
  code?: string;
  message?: string;
}

export interface Trip {
  id: string;
  current_location: Location;
  pickup_location: Location;
  dropoff_location: Location;
  fuel_stop?: Location;
  current_cycle_hours: number;
  status: 'planned' | 'in_progress' | 'completed';
  route?: Route;
  stops: Stop[];
  log_sheets: LogSheet[];
  created_at: string;
  updated_at: string;
} 