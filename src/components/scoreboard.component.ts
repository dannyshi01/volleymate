import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-scoreboard',
  imports: [CommonModule],
  template: `
    <div class="h-full w-full relative bg-stone-900 select-none overflow-hidden font-sans">
        
      @if (state.teams().length >= 2) {
        <!-- Main Split Container -->
        <div class="absolute inset-0 flex flex-col sm:flex-row">
            
            <!-- Team 1 Zone (Top / Left) -->
            <!-- Entire area is a button for +1 -->
            <div 
                (click)="state.updateScore(0, 1)"
                class="flex-1 relative flex flex-col items-center justify-center cursor-pointer transition-all active:brightness-90 touch-manipulation bg-[#947A6D] text-white overflow-hidden group"
            >
                <!-- Decrement Button (Top Right Corner) -->
                <button 
                    (click)="$event.stopPropagation(); state.updateScore(0, -1)"
                    class="absolute top-4 right-4 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white/80 transition-colors z-20 active:scale-95"
                    title="扣分"
                >
                    <span class="material-icons-round text-2xl md:text-3xl">remove</span>
                </button>

                <!-- Content -->
                <div class="z-10 flex flex-col items-center gap-2 md:gap-4 pointer-events-none">
                    <h2 class="text-xl md:text-3xl font-bold tracking-widest uppercase opacity-90 drop-shadow-md">
                        {{ state.teams()[0].name }}
                    </h2>
                    <div class="text-[35vw] sm:text-[20vw] leading-none font-black tracking-tighter tabular-nums drop-shadow-lg">
                        {{ state.teams()[0].score }}
                    </div>
                </div>

                <!-- Tap Hint -->
                <div class="absolute bottom-4 text-white/40 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    點擊加分
                </div>
            </div>

            <!-- Team 2 Zone (Bottom / Right) -->
            <div 
                (click)="state.updateScore(1, 1)"
                class="flex-1 relative flex flex-col items-center justify-center cursor-pointer transition-all active:brightness-90 touch-manipulation bg-slate-700 text-white overflow-hidden group border-t-2 sm:border-t-0 sm:border-l-2 border-white/10"
            >
                <!-- Decrement Button (Top Right Corner of this zone) -->
                <button 
                    (click)="$event.stopPropagation(); state.updateScore(1, -1)"
                    class="absolute top-4 right-4 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white/80 transition-colors z-20 active:scale-95"
                    title="扣分"
                >
                    <span class="material-icons-round text-2xl md:text-3xl">remove</span>
                </button>

                <!-- Content -->
                <div class="z-10 flex flex-col items-center gap-2 md:gap-4 pointer-events-none">
                    <h2 class="text-xl md:text-3xl font-bold tracking-widest uppercase opacity-90 drop-shadow-md">
                        {{ state.teams()[1].name }}
                    </h2>
                    <div class="text-[35vw] sm:text-[20vw] leading-none font-black tracking-tighter tabular-nums drop-shadow-lg">
                        {{ state.teams()[1].score }}
                    </div>
                </div>

                <!-- Tap Hint -->
                <div class="absolute bottom-4 text-white/40 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    點擊加分
                </div>
            </div>
        </div>

        <!-- Floating Gear Button (Settings) -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <button 
                (click)="toggleSettings()"
                class="w-12 h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
            >
                <span class="material-icons-round text-2xl md:text-3xl">settings</span>
            </button>
        </div>

        <!-- Settings Modal Overlay -->
        @if (showSettings()) {
            <div class="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" (click)="toggleSettings()">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-scale-in" (click)="$event.stopPropagation()">
                    
                    <!-- Modal Header -->
                    <div class="p-4 border-b border-stone-100 flex items-center justify-between">
                        <div class="flex items-center gap-2 text-stone-800">
                            <span class="material-icons-round text-stone-400">settings</span>
                            <h3 class="font-bold text-lg">比賽控制</h3>
                        </div>
                        <button (click)="toggleSettings()" class="text-stone-400 hover:text-stone-600">
                            <span class="material-icons-round">close</span>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-4 flex flex-col gap-4 overflow-y-auto">
                        
                        <!-- Actions -->
                        <div class="flex flex-col gap-2">
                             <button 
                                (click)="saveAndReset()"
                                class="w-full py-4 bg-[#947A6D] hover:bg-[#7d6559] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-md"
                            >
                                <span class="material-icons-round text-2xl">save</span>
                                <div class="flex flex-col leading-none text-left">
                                    <span class="text-base">結束此局</span>
                                    <span class="text-[10px] opacity-80 font-normal">儲存並重置 0-0</span>
                                </div>
                            </button>

                            <button 
                                (click)="resetScoresOnly()"
                                class="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                            >
                                <span class="material-icons-round">restart_alt</span>
                                僅重置分數 (不儲存)
                            </button>
                        </div>

                        <!-- History Section -->
                        <div class="mt-2">
                            <h4 class="text-xs font-bold text-stone-400 uppercase mb-2 tracking-wider">場次紀錄</h4>
                            
                            @if ((state.activeSession()?.matches || []).length > 0) {
                                <div class="flex flex-col gap-2">
                                    @for (match of state.activeSession()?.matches; track match.id) {
                                        <div class="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg text-sm">
                                            <!-- Team 1 Result -->
                                            <div class="flex flex-col items-start w-1/3">
                                                <span class="font-bold text-stone-700 truncate w-full" [title]="match.team1Name">{{ match.team1Name }}</span>
                                                <span class="text-lg font-black text-[#947A6D]">{{ match.team1Score }}</span>
                                            </div>
                                            
                                            <!-- VS -->
                                            <div class="text-stone-300 text-xs font-bold">VS</div>

                                            <!-- Team 2 Result -->
                                            <div class="flex flex-col items-end w-1/3 text-right">
                                                <span class="font-bold text-stone-700 truncate w-full" [title]="match.team2Name">{{ match.team2Name }}</span>
                                                <span class="text-lg font-black text-slate-600">{{ match.team2Score }}</span>
                                            </div>
                                        </div>
                                    }
                                </div>
                            } @else {
                                <div class="text-center py-6 text-stone-300 border-2 border-dashed border-stone-100 rounded-lg">
                                    <span class="material-icons-round text-3xl mb-1">history</span>
                                    <p class="text-xs">尚無比賽紀錄</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        }

      } @else {
          <!-- Empty State -->
          <div class="h-full flex flex-col items-center justify-center p-8 bg-stone-100">
            <div class="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 text-center max-w-sm">
                <span class="material-icons-round text-6xl text-stone-300 mb-4">scoreboard</span>
                <h3 class="text-xl font-bold text-stone-700">準備好比賽了嗎？</h3>
                <p class="text-stone-500 mt-2">請先至 <strong>分隊產生</strong> 頁面建立隊伍，即可開始計分。</p>
            </div>
          </div>
      }
    </div>
  `,
  styles: [`
      @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      }
      .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
      }
      @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
      }
      .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
      }
  `]
})
export class ScoreboardComponent {
  state = inject(StateService);
  showSettings = signal(false);

  toggleSettings() {
    this.showSettings.update(v => !v);
  }

  saveAndReset() {
      if (confirm('確定要結束此局並儲存分數嗎？')) {
          this.state.saveMatchResult();
          this.state.resetScores();
          // We keep the settings open so they can see the history update, or we can close it.
          // Let's keep it open to show the history.
      }
  }

  resetScoresOnly() {
    if(confirm('確定要捨棄當前分數並重置為 0-0 嗎？')) {
        this.state.resetScores();
        this.showSettings.set(false);
    }
  }
}