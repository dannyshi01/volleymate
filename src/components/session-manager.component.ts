import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-session-manager',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 h-full flex flex-col gap-6 max-w-2xl mx-auto w-full">
      
      <!-- Intro Card -->
      <div class="bg-[#947A6D] rounded-2xl p-6 text-white shadow-lg">
        <h2 class="text-2xl font-bold mb-2">Welcome, Host!</h2>
        <p class="opacity-90 text-sm">Select a session to manage attendance, teams, and scores, or create a new venue event.</p>
      </div>

      <!-- Add Session Controls -->
      <div class="flex flex-col gap-2">
         <label class="text-xs font-bold text-stone-500 uppercase px-1">Actions</label>
         
         @if (!isAdding()) {
             <button 
                (click)="startAdding()"
                class="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center gap-2 text-stone-500 font-bold hover:bg-stone-50 hover:border-[#947A6D] hover:text-[#947A6D] transition-all"
             >
                <span class="material-icons-round">add_circle_outline</span>
                Create New Session
             </button>
         } @else {
             <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm animate-fade-in">
                <div class="flex flex-col gap-3">
                    <h3 class="font-bold text-stone-800">New Session Details</h3>
                    <input 
                    type="text" 
                    [(ngModel)]="newSessionName" 
                    placeholder="Session Name (e.g. Court A)" 
                    class="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#947A6D] shadow-sm bg-stone-50"
                    >
                    <input 
                    type="datetime-local" 
                    [(ngModel)]="newSessionDate" 
                    class="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#947A6D] shadow-sm bg-stone-50 text-sm"
                    >
                    <div class="flex gap-2 mt-2">
                        <button 
                            (click)="cancelAdding()"
                            class="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            (click)="add()"
                            [disabled]="!newSessionName().trim()"
                            class="flex-1 py-3 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-900 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span class="material-icons-round text-sm">check</span>
                            Create
                        </button>
                    </div>
                </div>
            </div>
         }
      </div>

      <!-- Session List -->
      <div class="flex-1 overflow-y-auto">
        <label class="text-xs font-bold text-stone-500 uppercase px-1 mb-2 block">Your Sessions</label>
        
        <div class="flex flex-col gap-3 pb-20">
          @for (session of state.sessions(); track session.id) {
            <div 
              class="group bg-white rounded-xl p-4 border border-stone-200 shadow-sm hover:border-[#947A6D] hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              (click)="select(session.id)"
            >
               <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-lg text-stone-800 group-hover:text-[#947A6D] transition-colors">{{ session.name }}</h3>
                    <div class="text-xs text-stone-400 font-medium mt-1 flex items-center gap-1">
                      <span class="material-icons-round text-sm">event</span>
                      {{ session.date | date:'medium' }}
                    </div>
                  </div>
                  
                  <div class="flex flex-col items-end gap-1">
                     <span class="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded font-bold">
                        {{ session.players.length }} Players
                     </span>
                  </div>
               </div>
               
               <!-- Delete Button (Top Right) -->
               <button 
                  (click)="delete($event, session.id)"
                  class="absolute top-2 right-2 p-2 text-stone-300 hover:text-rose-500 transition-colors z-10"
               >
                  <span class="material-icons-round text-lg">delete</span>
               </button>
            </div>
          }

          @if (state.sessions().length === 0) {
            <div class="text-center py-10 text-stone-400 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                <span class="material-icons-round text-4xl mb-2 opacity-50">event_busy</span>
                <p>No active sessions.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
      @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
      }
  `]
})
export class SessionManagerComponent {
  state = inject(StateService);
  isAdding = signal(false);
  newSessionName = signal('');
  newSessionDate = signal('');

  getNowISOString() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  startAdding() {
      this.newSessionDate.set(this.getNowISOString());
      this.isAdding.set(true);
  }

  cancelAdding() {
      this.isAdding.set(false);
      this.newSessionName.set('');
  }

  add() {
    if (!this.newSessionName().trim() || !this.newSessionDate()) return;
    this.state.addSession(this.newSessionName(), this.newSessionDate());
    this.cancelAdding();
  }

  select(id: string) {
    this.state.selectSession(id);
  }

  delete(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Delete this session and all its player data?')) {
      this.state.deleteSession(id);
    }
  }
}