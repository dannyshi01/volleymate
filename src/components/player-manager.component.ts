import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService, SkillLevel, Gender } from '../services/state.service';

@Component({
  selector: 'app-player-manager',
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Main Container -->
    <div class="h-full flex flex-col bg-stone-50 md:bg-white md:rounded-xl md:shadow-sm md:border md:border-stone-200 overflow-hidden relative">
      
      <!-- Header / Stats -->
      <div class="p-4 bg-stone-100 border-b border-stone-200 flex flex-col gap-4 sticky top-0 z-10 shadow-sm md:shadow-none">
         <!-- Top Row: Stats Chips & Financials -->
         <div class="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
             
             <!-- Left: Counts -->
             <div class="text-xs md:text-sm text-stone-600 font-medium flex gap-3 overflow-x-auto no-scrollbar items-center shrink-0">
                <div class="flex items-center gap-1 shrink-0"><span class="w-2 h-2 rounded-full bg-stone-400"></span> {{ state.stats().total }} Total</div>
                <div class="flex items-center gap-1 shrink-0"><span class="w-2 h-2 rounded-full bg-[#947A6D]"></span> {{ state.stats().present }} Present</div>
                <div class="flex items-center gap-1 shrink-0"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> {{ state.stats().paidCount }} Paid</div>
             </div>

             <!-- Right: Financials Input -->
             <div class="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm w-full md:w-auto justify-between md:justify-start">
                 <div class="flex items-center gap-1">
                     <span class="text-xs font-bold text-stone-500 uppercase">Fee:</span>
                     <span class="text-stone-400 font-bold">$</span>
                     <input 
                         type="number" 
                         [ngModel]="state.activeSession()?.fee"
                         (ngModelChange)="state.updateFee($event)"
                         class="w-16 bg-transparent border-b border-stone-300 focus:border-[#947A6D] outline-none font-bold text-stone-800 text-sm focus:ring-0 p-0"
                         min="0"
                     >
                 </div>
                 <div class="w-px h-4 bg-stone-200"></div>
                 <div class="flex items-center gap-1">
                     <span class="text-xs font-bold text-stone-500 uppercase">Total:</span>
                     <span class="text-emerald-600 font-bold">\${{ state.stats().collected | number }}</span>
                 </div>
             </div>
         </div>
         
         <!-- Second Row: Actions & Sort -->
         <div class="flex items-center justify-between">
             <div class="flex gap-2 w-full md:w-auto">
                <!-- Add Action Buttons (Initial State) -->
                @if (!addMode()) {
                    <button 
                        (click)="addMode.set('single')"
                        class="px-4 py-2 bg-white border border-stone-300 rounded-lg text-stone-600 font-bold hover:bg-stone-50 hover:border-[#947A6D] hover:text-[#947A6D] transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                        <span class="material-icons-round text-base">person_add</span>
                        <span class="hidden md:inline">Add Player</span>
                    </button>
                    <button 
                        (click)="addMode.set('batch')"
                        class="px-4 py-2 bg-white border border-stone-300 rounded-lg text-stone-600 font-bold hover:bg-stone-50 hover:border-[#947A6D] hover:text-[#947A6D] transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                        <span class="material-icons-round text-base">playlist_add</span>
                        <span class="hidden md:inline">Batch Import</span>
                    </button>
                }
             </div>
             
             <!-- Right Side Controls -->
             <div class="flex items-center gap-2">
                 <!-- Actions Dropdown -->
                 <div class="relative">
                    <button 
                        (click)="toggleActionsMenu()"
                        class="bg-white border border-stone-300 text-stone-600 rounded-lg w-8 h-8 flex items-center justify-center hover:bg-stone-50 active:bg-stone-100 transition-colors"
                        title="Actions"
                    >
                        <span class="material-icons-round text-lg">more_horiz</span>
                    </button>
                    
                    @if (showActionsMenu()) {
                        <div class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-stone-100 z-50 overflow-hidden animate-scale-in">
                            <button (click)="exportList()" class="w-full text-left px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2">
                                <span class="material-icons-round text-stone-400">description</span> Export List
                            </button>
                            <div class="h-px bg-stone-100 mx-2"></div>
                            <button (click)="checkInAll()" class="w-full text-left px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2">
                                <span class="material-icons-round text-stone-400">check_circle</span> Check In All
                            </button>
                            <button (click)="payAll()" class="w-full text-left px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2">
                                <span class="material-icons-round text-stone-400">attach_money</span> Pay All (Present)
                            </button>
                        </div>
                        <!-- Backdrop to close -->
                        <div class="fixed inset-0 z-40" (click)="toggleActionsMenu()"></div>
                    }
                 </div>

                 <!-- Sorting Dropdown -->
                 <div class="relative shrink-0">
                     <select 
                        [ngModel]="currentSort()"
                        (ngModelChange)="sort($event)"
                        class="bg-white border border-stone-300 text-stone-600 text-xs rounded-lg focus:ring-[#947A6D] focus:border-[#947A6D] block p-1.5 pl-2 pr-6 appearance-none font-bold cursor-pointer h-8"
                     >
                        <option value="custom">Sort: Custom</option>
                        <option value="present">Sort: Present</option>
                        <option value="paid">Sort: Paid</option>
                     </select>
                     <span class="material-icons-round absolute right-1 top-1.5 text-sm text-stone-400 pointer-events-none">sort</span>
                 </div>
             </div>
         </div>

         <!-- Single Add Form -->
         @if (addMode() === 'single') {
            <div class="flex flex-col gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm animate-fade-in">
                <h3 class="text-xs font-bold text-stone-500 uppercase">New Player</h3>
                <div class="flex flex-col md:flex-row gap-2">
                    <!-- Name Input -->
                    <input 
                    type="text" 
                    [(ngModel)]="newName" 
                    placeholder="Name" 
                    class="flex-1 px-3 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#947A6D] bg-stone-50 shadow-sm"
                    >
                    
                    <div class="flex gap-2">
                         <!-- Level Select -->
                        <select 
                        [(ngModel)]="newLevel" 
                        class="w-20 px-1 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#947A6D] bg-white shadow-sm text-center font-bold text-stone-700 cursor-pointer"
                        >
                        @for (lvl of state.skillLevels; track lvl) {
                            <option [value]="lvl">{{ lvl }}</option>
                        }
                        </select>

                        <!-- Gender Toggle -->
                        <button
                        (click)="toggleNewGender()"
                        class="w-12 flex items-center justify-center border border-stone-300 rounded-lg bg-white hover:bg-stone-50 transition-colors shadow-sm"
                        [title]="newGender()"
                        >
                        <span class="material-icons-round text-2xl" [class.text-blue-500]="newGender() === 'Male'" [class.text-pink-500]="newGender() === 'Female'">
                            {{ newGender() === 'Male' ? 'man' : 'woman' }}
                        </span>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-2 mt-1">
                    <button 
                        (click)="cancelAdd()"
                        class="flex-1 py-2 rounded-lg bg-stone-100 text-stone-500 font-bold hover:bg-stone-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        (click)="add()"
                        [disabled]="!newName().trim()"
                        class="flex-1 py-2 rounded-lg bg-[#947A6D] hover:bg-[#7d6559] text-white font-bold transition-colors shadow-sm disabled:opacity-50 text-sm"
                    >
                        Add Player
                    </button>
                </div>
            </div>
         }

         <!-- Batch Import Form -->
         @if (addMode() === 'batch') {
            <div class="flex flex-col gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm animate-fade-in">
                <div class="flex justify-between items-center">
                    <h3 class="text-xs font-bold text-stone-500 uppercase">Batch Import</h3>
                    <div class="flex items-center gap-2">
                        <select [(ngModel)]="batchLevel" class="text-xs border border-stone-200 rounded p-1 bg-stone-50">
                            @for (lvl of state.skillLevels; track lvl) { <option [value]="lvl">{{lvl}}</option> }
                        </select>
                         <button (click)="toggleBatchGender()" class="text-xs border border-stone-200 rounded p-1 w-6 h-6 flex items-center justify-center bg-stone-50">
                             <span class="material-icons-round text-base" [class.text-blue-500]="batchGender() === 'Male'" [class.text-pink-500]="batchGender() === 'Female'">
                                {{ batchGender() === 'Male' ? 'man' : 'woman' }}
                            </span>
                         </button>
                    </div>
                </div>

                <textarea 
                    [(ngModel)]="importText"
                    placeholder="Format: Name Count&#10;Example:&#10;David 3&#10;Sarah 2"
                    rows="4"
                    class="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#947A6D] bg-stone-50 text-sm font-mono placeholder:text-stone-400"
                ></textarea>
                
                <div class="flex gap-2 mt-1">
                    <button 
                        (click)="cancelAdd()"
                        class="flex-1 py-2 rounded-lg bg-stone-100 text-stone-500 font-bold hover:bg-stone-200 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        (click)="processBatch()"
                        [disabled]="!importText().trim()"
                        class="flex-1 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold transition-colors shadow-sm disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                        <span class="material-icons-round text-sm">save_alt</span>
                        Import
                    </button>
                </div>
            </div>
         }
      </div>

      <!-- Scrollable List -->
      <div class="flex-1 overflow-y-auto">
        <div class="divide-y divide-stone-100 pb-20 md:pb-0" (dragover)="onListDragOver($event)">
            @for (player of state.players(); track player.id; let i = $index) {
              <div 
                class="bg-white p-4 flex items-center justify-between transition-colors hover:bg-stone-50 select-none group"
                [class.opacity-40]="draggedIndex() === i"
                [class.border-t-2]="dragOverIndex() === i && i !== draggedIndex()"
                [class.border-[#947A6D]]="dragOverIndex() === i && i !== draggedIndex()"
                draggable="true"
                (dragstart)="onDragStart($event, i)"
                (dragover)="onDragOver($event, i)"
                (dragend)="onDragEnd()"
                (drop)="onDrop($event, i)"
              >
                  <!-- Left: Drag Handle & Info -->
                  <div class="flex items-center gap-3">
                      <!-- Drag Handle -->
                      <div class="text-stone-300 cursor-move md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <span class="material-icons-round text-lg">drag_indicator</span>
                      </div>

                      <div class="relative">
                          <div [class]="getLevelBadgeClass(player.level)" class="w-10 h-8 flex items-center justify-center text-sm font-bold rounded border shadow-sm shrink-0">
                              {{ player.level }}
                          </div>
                          <!-- Gender Indicator (Small Dot/Icon) -->
                          <div class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-stone-100 shadow-sm">
                              <span class="material-icons-round text-[10px]" [class.text-blue-500]="player.gender === 'Male'" [class.text-pink-500]="player.gender === 'Female'">
                                  {{ player.gender === 'Male' ? 'circle' : 'circle' }}
                              </span>
                          </div>
                      </div>
                      
                      <div class="flex flex-col min-w-0">
                          <div class="flex items-center gap-1">
                             <span class="text-stone-800 font-bold text-lg leading-tight truncate">{{ player.name }}</span>
                          </div>
                          <span class="text-xs text-stone-400">{{ player.present ? 'Checked In' : 'Absent' }}</span>
                      </div>
                  </div>

                  <!-- Right: Actions -->
                  <div class="flex items-center gap-1 shrink-0" (mousedown)="$event.stopPropagation()">
                      <!-- Presence -->
                      <button 
                        (click)="state.togglePresence(player.id)"
                        [class]="player.present ? 'bg-[#947A6D] text-white border-[#947A6D]' : 'bg-white text-stone-300 border-stone-200'"
                        class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-95"
                      >
                        <span class="material-icons-round">check</span>
                      </button>

                      <!-- Payment -->
                      <button 
                        (click)="state.togglePayment(player.id)"
                        [disabled]="!player.present"
                        [class.opacity-30]="!player.present"
                        [class]="player.paid ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-stone-300 border-stone-200'"
                        class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-95"
                      >
                        <span class="material-icons-round">attach_money</span>
                      </button>

                      <!-- More (Bottom Sheet Trigger) -->
                      <button 
                        (click)="openMenu(player.id)"
                        class="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors ml-1"
                      >
                         <span class="material-icons-round">more_vert</span>
                      </button>
                  </div>
              </div>
            }
            
            @if (state.players().length === 0) {
              <div class="flex flex-col items-center justify-center h-64 text-stone-400">
                <span class="material-icons-round text-5xl mb-2 opacity-20">sports_volleyball</span>
                <p>No players yet.</p>
              </div>
            }
        </div>
      </div>
    </div>

    <!-- Bottom Sheet Action Menu -->
    @if (activeMenuId()) {
       <!-- Backdrop -->
       <div 
         class="fixed inset-0 bg-black/40 z-40 transition-opacity" 
         (click)="closeMenu()"
       ></div>
       
       <!-- Sheet -->
       <div class="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-6 flex flex-col gap-3 animate-slide-up max-w-lg mx-auto md:bottom-4 md:rounded-2xl md:left-4 md:right-4">
          <div class="flex flex-col items-center mb-2">
             <div class="w-12 h-1 bg-stone-300 rounded-full mb-4"></div>
             <h3 class="text-lg font-bold text-stone-800">
               {{ getActivePlayer()?.name || 'Player Actions' }}
             </h3>
             <p class="text-sm text-stone-400">Select an action</p>
          </div>

          <button 
            (click)="openEdit()"
            class="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <span class="material-icons-round">edit</span>
            Edit Details
          </button>

          <button 
            (click)="confirmDelete()"
            class="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <span class="material-icons-round">delete</span>
            Delete Player
          </button>

          <button 
            (click)="closeMenu()"
            class="w-full bg-white text-stone-500 font-bold py-2 rounded-xl transition-colors mt-2"
          >
            Cancel
          </button>
       </div>
    }

    <!-- Export Modal -->
    @if (showExportModal()) {
        <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-scale-in">
              <h3 class="text-xl font-bold text-stone-800 flex justify-between items-center">
                  Export List
                  <button (click)="closeExportModal()" class="text-stone-400 hover:text-stone-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
                      <span class="material-icons-round">close</span>
                  </button>
              </h3>
              
              <div class="relative">
                  <textarea 
                      readonly
                      class="w-full h-64 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none resize-none text-stone-700"
                      [value]="exportContent()"
                  ></textarea>
              </div>

              <button 
                (click)="copyToClipboard()"
                class="w-full py-3 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-900 transition-colors shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                [class.bg-emerald-600]="copySuccess()"
                [class.hover:bg-emerald-700]="copySuccess()"
              >
                <span class="material-icons-round">{{ copySuccess() ? 'check' : 'content_copy' }}</span>
                {{ copySuccess() ? 'Copied!' : 'Copy to Clipboard' }}
              </button>
           </div>
        </div>
    }

    <!-- Edit Player Modal -->
    @if (showEditModal()) {
        <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-scale-in">
              <h3 class="text-xl font-bold text-stone-800 text-center">Edit Player</h3>
              
              <!-- Name Input -->
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-stone-500 uppercase ml-1">Name</label>
                <input 
                    type="text" 
                    [(ngModel)]="editName" 
                    class="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#947A6D]"
                    placeholder="Enter name"
                >
              </div>

              <div class="flex gap-4">
                  <!-- Level Select -->
                  <div class="flex flex-col gap-1 flex-1">
                    <label class="text-xs font-bold text-stone-500 uppercase ml-1">Level</label>
                    <select 
                        [(ngModel)]="editLevel" 
                        class="w-full px-4 py-3 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#947A6D] bg-white appearance-none text-center font-bold"
                    >
                        @for (lvl of state.skillLevels; track lvl) {
                            <option [value]="lvl">{{ lvl }}</option>
                        }
                    </select>
                  </div>

                  <!-- Gender Select -->
                  <div class="flex flex-col gap-1 flex-1">
                     <label class="text-xs font-bold text-stone-500 uppercase ml-1">Gender</label>
                     <div class="flex gap-1 h-[46px]"> <!-- height matches input (py-3 approx) -->
                        <button 
                            (click)="editGender.set('Male')"
                            [class.bg-blue-100]="editGender() === 'Male'"
                            [class.border-blue-200]="editGender() === 'Male'"
                            [class.text-blue-600]="editGender() === 'Male'"
                            [class.border-stone-200]="editGender() !== 'Male'"
                            [class.text-stone-400]="editGender() !== 'Male'"
                            class="flex-1 rounded-l-xl border flex items-center justify-center transition-colors"
                        >
                             <span class="material-icons-round">man</span>
                        </button>
                        <button 
                            (click)="editGender.set('Female')"
                            [class.bg-pink-100]="editGender() === 'Female'"
                            [class.border-pink-200]="editGender() === 'Female'"
                            [class.text-pink-600]="editGender() === 'Female'"
                            [class.border-stone-200]="editGender() !== 'Female'"
                            [class.text-stone-400]="editGender() !== 'Female'"
                            class="flex-1 rounded-r-xl border flex items-center justify-center transition-colors border-l-0"
                        >
                             <span class="material-icons-round">woman</span>
                        </button>
                     </div>
                  </div>
              </div>

              <div class="flex gap-3 mt-4">
                 <button 
                   (click)="cancelEdit()"
                   class="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   (click)="executeEdit()"
                   [disabled]="!editName().trim()"
                   class="flex-1 py-3 rounded-xl bg-[#947A6D] text-white font-bold hover:bg-[#7d6559] shadow-lg shadow-stone-200 transition-colors disabled:opacity-50"
                 >
                   Save
                 </button>
              </div>
           </div>
        </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteConfirm()) {
        <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-scale-in">
              <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto">
                 <span class="material-icons-round text-2xl">warning</span>
              </div>
              
              <div class="text-center">
                 <h3 class="text-xl font-bold text-stone-800">Remove Player?</h3>
                 <p class="text-stone-500 mt-2">
                    Are you sure you want to remove <span class="font-bold text-stone-800">{{ getActivePlayer()?.name }}</span> from the roster? This cannot be undone.
                 </p>
              </div>

              <div class="flex gap-3 mt-2">
                 <button 
                   (click)="cancelDelete()"
                   class="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   (click)="executeDelete()"
                   class="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-colors"
                 >
                   Yes, Remove
                 </button>
              </div>
           </div>
        </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up {
      animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in {
      animation: scale-in 0.2s ease-out;
    }
    @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
      }
  `]
})
export class PlayerManagerComponent {
  state = inject(StateService);
  
  // UI State
  addMode = signal<'single' | 'batch' | null>(null);
  showActionsMenu = signal(false);

  // Single Add State
  newName = signal('');
  newLevel = signal<SkillLevel>('B');
  newGender = signal<Gender>('Male');

  // Batch Import State
  importText = signal('');
  batchLevel = signal<SkillLevel>('B');
  batchGender = signal<Gender>('Male');

  // Modal / Menu State
  activeMenuId = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  showEditModal = signal(false);
  editName = signal('');
  editLevel = signal<SkillLevel>('B');
  editGender = signal<Gender>('Male');

  // Export Modal State
  showExportModal = signal(false);
  exportContent = signal('');
  copySuccess = signal(false);

  // Sort State
  currentSort = signal<'custom' | 'present' | 'paid'>('custom');

  // Drag and Drop State
  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  // --- Actions Menu ---
  toggleActionsMenu() {
    this.showActionsMenu.update(v => !v);
  }

  checkInAll() {
    this.state.markAllPresent();
    this.showActionsMenu.set(false);
  }

  payAll() {
    this.state.markAllPaid();
    this.showActionsMenu.set(false);
  }

  exportList() {
    const players = this.state.players();
    if (players.length === 0) return;

    // Create text content: "No. Name Gender" using Chinese for Gender
    const content = players
        .map((p, i) => `${i + 1}. ${p.name} ${p.gender === 'Male' ? '男' : '女'}`)
        .join('\n');

    this.exportContent.set(content);
    this.showExportModal.set(true);
    this.showActionsMenu.set(false);
  }

  closeExportModal() {
      this.showExportModal.set(false);
      this.copySuccess.set(false);
  }

  copyToClipboard() {
      navigator.clipboard.writeText(this.exportContent()).then(() => {
          this.copySuccess.set(true);
          setTimeout(() => this.copySuccess.set(false), 2000);
      }).catch(err => {
          console.error('Failed to copy: ', err);
      });
  }

  // --- Add Actions ---
  toggleNewGender() {
      this.newGender.update(g => g === 'Male' ? 'Female' : 'Male');
  }

  toggleBatchGender() {
      this.batchGender.update(g => g === 'Male' ? 'Female' : 'Male');
  }

  cancelAdd() {
      this.addMode.set(null);
      this.newName.set('');
      this.importText.set('');
  }

  add() {
    if (!this.newName().trim()) return;
    this.state.addPlayer(this.newName(), this.newLevel(), this.newGender());
    this.newName.set('');
    this.addMode.set(null);
  }

  processBatch() {
      const text = this.importText().trim();
      if (!text) return;

      const lines = text.split('\n');
      const playersToAdd: {name: string, level: SkillLevel, gender: Gender}[] = [];
      
      const defaultLevel = this.batchLevel();
      const defaultGender = this.batchGender();

      for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const parts = trimmed.split(/\s+/);
          const lastPart = parts[parts.length - 1];
          const count = parseInt(lastPart);

          // Check if the last part is a valid number
          if (!isNaN(count) && parts.length > 1 && count > 0) {
              const baseName = parts.slice(0, -1).join(' ');
              for (let i = 1; i <= count; i++) {
                  playersToAdd.push({
                      name: `${baseName} ${i}`,
                      level: defaultLevel,
                      gender: defaultGender
                  });
              }
          } else {
              // Treat as single player if no number provided
               playersToAdd.push({
                  name: trimmed,
                  level: defaultLevel,
                  gender: defaultGender
              });
          }
      }

      if (playersToAdd.length > 0) {
          this.state.addPlayers(playersToAdd);
      }
      
      this.importText.set('');
      this.addMode.set(null);
  }

  // --- Sorting ---
  sort(criteria: 'custom' | 'present' | 'paid') {
      this.currentSort.set(criteria);
      if (criteria !== 'custom') {
          this.state.sortPlayers(criteria);
      }
  }

  // --- Drag and Drop Logic ---
  onDragStart(event: DragEvent, index: number) {
      this.draggedIndex.set(index);
      if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
      }
  }

  onListDragOver(event: DragEvent) {
      event.preventDefault(); // Necessary to allow dropping
  }

  onDragOver(event: DragEvent, index: number) {
      event.preventDefault();
      if (this.draggedIndex() === null || this.draggedIndex() === index) return;
      this.dragOverIndex.set(index);
  }

  onDragEnd() {
      this.draggedIndex.set(null);
      this.dragOverIndex.set(null);
  }

  onDrop(event: DragEvent, dropIndex: number) {
      event.preventDefault();
      const dragIndex = this.draggedIndex();
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
          this.state.reorderPlayers(dragIndex, dropIndex);
          // If we reorder, we are effectively in custom mode
          this.currentSort.set('custom');
      }
      this.onDragEnd();
  }

  // --- Menu Logic ---
  openMenu(id: string) {
    this.activeMenuId.set(id);
    this.showDeleteConfirm.set(false);
    this.showEditModal.set(false);
  }

  closeMenu() {
    this.activeMenuId.set(null);
    this.showDeleteConfirm.set(false);
    this.showEditModal.set(false);
  }

  // Edit Actions
  openEdit() {
    const player = this.getActivePlayer();
    if (player) {
        this.editName.set(player.name);
        this.editLevel.set(player.level);
        this.editGender.set(player.gender);
        this.showEditModal.set(true);
    }
  }

  cancelEdit() {
      this.showEditModal.set(false);
      this.activeMenuId.set(null);
  }

  executeEdit() {
      const id = this.activeMenuId();
      if (id && this.editName().trim()) {
          this.state.updatePlayerDetails(
              id, 
              this.editName().trim(),
              this.editLevel(),
              this.editGender()
          );
      }
      this.cancelEdit();
  }

  // Delete Actions
  confirmDelete() {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.closeMenu();
  }

  executeDelete() {
    const id = this.activeMenuId();
    if (id) {
        this.state.removePlayer(id);
    }
    this.closeMenu();
  }

  getActivePlayer() {
      const id = this.activeMenuId();
      if (!id) return null;
      return this.state.players().find(p => p.id === id);
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