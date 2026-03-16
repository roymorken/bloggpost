export interface FlightRoute {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
}

export const FLIGHT_ROUTES: FlightRoute[] = [
  { origin: 'New York', originCode: 'NYC', destination: 'Boston', destinationCode: 'BOS' },
  { origin: 'New York', originCode: 'NYC', destination: 'Miami', destinationCode: 'MIA' },
  { origin: 'New York', originCode: 'NYC', destination: 'Los Angeles', destinationCode: 'LAX' },
  { origin: 'Washington', originCode: 'WAS', destination: 'Paris', destinationCode: 'PAR' },
];

export const TRIP_LENGTH_DAYS = 5;
export const MONTHS_AHEAD = 2;

export function computeDates(): { departDate: Date; returnDate: Date } {
  const departDate = new Date();
  departDate.setMonth(departDate.getMonth() + MONTHS_AHEAD);
  departDate.setHours(0, 0, 0, 0);

  const returnDate = new Date(departDate);
  returnDate.setDate(returnDate.getDate() + TRIP_LENGTH_DAYS);

  return { departDate, returnDate };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
