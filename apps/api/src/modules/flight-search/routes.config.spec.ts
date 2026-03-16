import { FLIGHT_ROUTES, computeDates, formatDate, TRIP_LENGTH_DAYS, MONTHS_AHEAD } from './routes.config';

describe('Flight Routes Config', () => {
  it('should have 4 routes', () => {
    expect(FLIGHT_ROUTES).toHaveLength(4);
  });

  it('should include NYC-BOS, NYC-MIA, NYC-LAX, WAS-PAR', () => {
    const routeCodes = FLIGHT_ROUTES.map((r) => `${r.originCode}-${r.destinationCode}`);
    expect(routeCodes).toContain('NYC-BOS');
    expect(routeCodes).toContain('NYC-MIA');
    expect(routeCodes).toContain('NYC-LAX');
    expect(routeCodes).toContain('WAS-PAR');
  });

  it('should compute dates 2 months ahead with 5-day trip', () => {
    const { departDate, returnDate } = computeDates();
    const now = new Date();
    const expectedMonth = (now.getMonth() + MONTHS_AHEAD) % 12;

    expect(departDate.getMonth()).toBe(expectedMonth);

    const diffDays = Math.round((returnDate.getTime() - departDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(TRIP_LENGTH_DAYS);
  });

  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2026-05-15');
    expect(formatDate(date)).toBe('2026-05-15');
  });
});
