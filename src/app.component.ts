import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerManagerComponent } from './components/player-manager.component';
import { TeamBuilderComponent } from './components/team-builder.component';
import { ScoreboardComponent } from './components/scoreboard.component';
import { SessionManagerComponent } from './components/session-manager.component';
import { StateService } from './services/state.service';

type Tab = 'players' | 'teams' | 'score';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    PlayerManagerComponent, 
    TeamBuilderComponent, 
    ScoreboardComponent,
    SessionManagerComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  state = inject(StateService);
  activeTab = signal<Tab>('players');

  constructor() {
    // Reset to 'players' tab whenever a new session is selected
    effect(() => {
      if (this.state.activeSessionId()) {
        this.activeTab.set('players');
      }
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  goBackToSessions() {
    this.state.selectSession(null);
  }
}