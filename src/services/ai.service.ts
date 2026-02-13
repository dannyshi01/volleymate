import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  // This service is currently disabled to allow offline usage without an API Key.
  // If you wish to re-enable AI features, uncomment the code below and ensure
  // you have a valid process.env['API_KEY'].

  constructor() {}

  async getMatchAnalysis(teamA: string[], teamB: string[]): Promise<string> {
    return "AI features are currently disabled.";
  }
}