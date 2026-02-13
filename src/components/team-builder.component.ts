import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService, SkillLevel } from '../services/state.service';

interface DragState {
  teamIndex: number;
  playerIndex: number;
}

@Component({
  selector: 'app-team-builder',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col gap-4">
      <!-- Controls -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="flex-1 md:flex-none">
                <label class="text-xs font-bold text-stone-500 uppercase block mb-1">隊伍數量</label>
                <select 
                    [(ngModel)]="teamCount" 
                    class="bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg focus:ring-[#947A6D] focus:border-[#947A6D] block w-full p-2.5"
                >
                    <option [value]="2">2 隊</option>
                    <option [value]="3">3 隊</option>
                    <option [value]="4">4 隊</option>
                </select>
            </div>
            
            <button 
                (click)="generate()"
                class="mt-5 bg-[#947A6D] hover:bg-[#7d6559] text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm flex-1 md:flex-none justify-center"
            >
                <span class="material-icons-round text-lg">cached</span>
                產生分隊
            </button>
        </div>
        <div class="text-xs text-stone-400 italic">
           拖曳球員可手動換隊
        </div>
      </div>

      <!-- Teams Grid -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
            @for (team of state.teams(); track team.name; let teamIdx = $index) {
            <div 
                class="bg-white rounded-xl shadow-sm border transition-all flex flex-col h-auto"
                [class.border-[#947A6D]]="dragOverTeamIndex() === teamIdx"
                [class.ring-2]="dragOverTeamIndex() === teamIdx"
                [class.ring-[#947A6D]]="dragOverTeamIndex() === teamIdx"
                [class.border-stone-200]="dragOverTeamIndex() !== teamIdx"
                (dragover)="onDragOverTeam($event, teamIdx)"
                (drop)="onDrop(teamIdx)"
            >
                <div class="bg-stone-50 p-3 border-b border-stone-200 flex justify-between items-center rounded-t-xl">
                <h3 class="font-bold text-lg text-stone-800">{{ team.name }}</h3>
                <div class="text-xs font-semibold bg-stone-200 text-stone-600 px-2 py-1 rounded">
                    均分: {{ getTeamAverage(team.players) | number:'1.1-1' }}
                </div>
                </div>
                
                <div class="p-2 flex-1 relative">
                    <!-- Drop Zone Overlay if dragging over empty team -->
                    @if (dragOverTeamIndex() === teamIdx && team.players.length === 0) {
                        <div class="absolute inset-0 bg-[#947A6D]/10 rounded-lg border-2 border-dashed border-[#947A6D] m-2 z-10 pointer-events-none"></div>
                    }

                    <table class="w-full text-sm">
                        <tbody class="divide-y divide-stone-100">
                        @for (player of team.players; track player.id; let playerIdx = $index) {
                            <tr 
                                draggable="true"
                                (dragstart)="onDragStart($event, teamIdx, playerIdx)"
                                (dragover)="onDragOverPlayer($event, teamIdx, playerIdx)"
                                (dragend)="onDragEnd()"
                                class="cursor-grab active:cursor-grabbing transition-all hover:bg-stone-50"
                                [class.opacity-40]="isDragging(teamIdx, playerIdx)"
                                [class.border-t-2]="isDragOver(teamIdx, playerIdx)"
                                [class.border-[#947A6D]]="isDragOver(teamIdx, playerIdx)"
                            >
                                <td class="p-2 text-stone-700 font-medium flex items-center gap-2">
                                    <span class="material-icons-round text-stone-300 text-sm">drag_indicator</span>
                                    <span class="material-icons-round text-sm" [class.text-blue-400]="player.gender === 'Male'" [class.text-pink-400]="player.gender === 'Female'">
                                    {{ player.gender === 'Male' ? 'man' : 'woman' }}
                                    </span>
                                    {{ player.name }}
                                </td>
                                <td class="p-2 text-right">
                                    <div class="inline-flex">
                                        <span [class]="getLevelBadgeClass(player.level)" class="w-8 h-6 flex items-center justify-center text-xs font-bold rounded border shadow-sm">
                                            {{ player.level }}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        }
                        </tbody>
                    </table>
                    
                    @if (team.players.length === 0) {
                        <div class="h-20 flex items-center justify-center text-stone-400 text-xs italic">
                            拖曳球員至此
                        </div>
                    }
                </div>
                
                <div class="bg-stone-50 p-2 text-center text-xs text-stone-400 border-t border-stone-200 rounded-b-xl mt-auto">
                人數: {{ team.players.length }}
                </div>
            </div>
            }

            @if (state.teams().length === 0) {
                <div class="col-span-full flex flex-col items-center justify-center text-stone-400 h-64 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/50">
                    <span class="material-icons-round text-5xl mb-3 text-stone-300">group_work</span>
                    <p class="font-medium">尚未產生隊伍</p>
                    <p class="text-sm">請點擊上方 "產生分隊"</p>
                </div>
            }
        </div>
      </div>
    </div>
  `
})
export class TeamBuilderComponent {
  state = inject(StateService);
  teamCount = signal(2);

  // Drag State
  draggedItem = signal<DragState | null>(null);
  dragOverTeamIndex = signal<number | null>(null);
  dragOverPlayerIndex = signal<number | null>(null); // To insert at specific position

  generate() {
    this.state.generateTeams(this.teamCount());
  }

  // --- Drag & Drop Logic ---

  onDragStart(event: DragEvent, teamIndex: number, playerIndex: number) {
      this.draggedItem.set({ teamIndex, playerIndex });
      if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          // Optional: Set a ghost image or text
      }
  }

  onDragOverTeam(event: DragEvent, teamIndex: number) {
      event.preventDefault(); // Allows drop
      if (!this.draggedItem()) return;
      
      // Only update if changed to avoid excessive change detection
      if (this.dragOverTeamIndex() !== teamIndex) {
        this.dragOverTeamIndex.set(teamIndex);
        // Reset player index when switching teams to append by default unless hovering a specific row
        this.dragOverPlayerIndex.set(null); 
      }
  }

  onDragOverPlayer(event: DragEvent, teamIndex: number, playerIndex: number) {
      event.preventDefault();
      event.stopPropagation(); // Stop bubbling to team container so we can be specific
      
      const dragged = this.draggedItem();
      if (!dragged) return;

      // Don't highlight if hovering over self
      if (dragged.teamIndex === teamIndex && dragged.playerIndex === playerIndex) {
          this.dragOverPlayerIndex.set(null);
          return;
      }

      this.dragOverTeamIndex.set(teamIndex);
      this.dragOverPlayerIndex.set(playerIndex);
  }

  onDragEnd() {
      this.draggedItem.set(null);
      this.dragOverTeamIndex.set(null);
      this.dragOverPlayerIndex.set(null);
  }

  onDrop(toTeamIndex: number) {
      const dragged = this.draggedItem();
      const targetPlayerIdx = this.dragOverPlayerIndex();

      if (dragged) {
          this.state.movePlayerBetweenTeams(
              dragged.teamIndex, 
              toTeamIndex, 
              dragged.playerIndex, 
              targetPlayerIdx
          );
      }
      this.onDragEnd();
  }

  // --- Helpers for View ---

  isDragging(teamIdx: number, playerIdx: number): boolean {
      const dragged = this.draggedItem();
      return dragged?.teamIndex === teamIdx && dragged?.playerIndex === playerIdx;
  }

  isDragOver(teamIdx: number, playerIdx: number): boolean {
      const dragged = this.draggedItem();
      // Don't show indicator if hovering over self
      if (dragged?.teamIndex === teamIdx && dragged?.playerIndex === playerIdx) return false;
      
      return this.dragOverTeamIndex() === teamIdx && this.dragOverPlayerIndex() === playerIdx;
  }

  getTeamAverage(players: any[]): number {
    if (!players.length) return 0;
    const total = players.reduce((sum, p) => sum + this.state.skillWeights[p.level as SkillLevel], 0);
    return total / players.length;
  }

  getLevelBadgeClass(level: SkillLevel): string {
    switch(level) {
      case 'A': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'B+': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'B': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'B-': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'C+': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  }
}