import { Page } from 'playwright';

export interface FlightSearchParams {
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departDate: string;
  returnDate: string;
}

export interface FlightSearchPrice {
  priceAmount: number;
  currency: string;
  providerName: string | null;
  resultRank: number;
}

export interface FlightSearchAdapterResult {
  success: boolean;
  prices: FlightSearchPrice[];
  error?: string;
}

export interface FlightSearchAdapter {
  readonly name: string;
  canHandle(url: string): boolean;
  detectSearchForm(page: Page): Promise<boolean>;
  search(page: Page, params: FlightSearchParams): Promise<FlightSearchAdapterResult>;
}
