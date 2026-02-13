import { Injectable, signal, computed, effect } from '@angular/core';

export type SkillLevel = 'A' | 'B+' | 'B' | 'B-' | 'C+' | 'C';
export type Gender = 'Male' | 'Female';

export interface Player {
  id: string;
  name: string;
  level: SkillLevel;
  gender: Gender;
  paid: boolean;
  present: boolean;
}

export interface Team {
  name: string;
  players: Player[];
  score: number;
}

export interface MatchRecord {
  id: string;
  team1Name: string;
  team1Score: number;
  team2Name: string;
  team2Score: number;
  timestamp: string;
}

export interface Session {
  id: string;
  name: string; // e.g., "Monday Night", "Gym A"
  date: string; // ISO string (YYYY-MM-DDTHH:mm)
  fee: number; // Cost per person
  players: Player[];
  teams: Team[];
  matches: MatchRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // --- Constants ---
  readonly skillWeights: Record<SkillLevel, number> = {
    'A': 6, 'B+': 5, 'B': 4, 'B-': 3, 'C+': 2, 'C': 1
  };
  readonly skillLevels: SkillLevel[] = ['A', 'B+', 'B', 'B-', 'C+', 'C'];
  private readonly STORAGE_KEY = 'volleymate_pro_data_v1';

  // --- State ---
  // List of all sessions
  private sessionsSignal = signal<Session[]>([
    {
      id: 'demo-1',
      name: 'Sunday Morning Open Play',
      date: new Date().toISOString(), // Default to ISO string
      fee: 150,
      players: [
        { id: '1', name: 'Alex', level: 'A', gender: 'Male', paid: true, present: true },
        { id: '2', name: 'Bella', level: 'B', gender: 'Female', paid: false, present: true },
        { id: '3', name: 'Charlie', level: 'C+', gender: 'Male', paid: true, present: true },
        { id: '4', name: 'Diana', level: 'B+', gender: 'Female', paid: true, present: true },
        { id: '5', name: 'Eve', level: 'A', gender: 'Female', paid: false, present: false },
        { id: '6', name: 'Frank', level: 'C', gender: 'Male', paid: true, present: true },
      ],
      teams: [],
      matches: []
    }
  ]);

  // ID of the currently selected session
  activeSessionId = signal<string | null>(null);

  constructor() {
    // 1. Load from LocalStorage on init
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.sessionsSignal.set(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse saved data, reverting to defaults.');
      }
    }

    // 2. Auto-save to LocalStorage whenever sessions change
    effect(() => {
      const sessions = this.sessionsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    });
  }

  // --- Computeds ---
  
  // Get the full object of the active session
  activeSession = computed(() => 
    this.sessionsSignal().find(s => s.id === this.activeSessionId()) || null
  );

  // Expose players of the ACTIVE session (Backwards compatibility for components)
  players = computed(() => this.activeSession()?.players || []);

  // Expose teams of the ACTIVE session
  teams = computed(() => this.activeSession()?.teams || []);

  presentPlayers = computed(() => this.players().filter(p => p.present));

  stats = computed(() => {
    const session = this.activeSession();
    const all = this.players();
    const present = all.filter(p => p.present);
    const paid = present.filter(p => p.paid);
    
    // Use the session fee, default to 0 if not set
    const feePerPerson = session?.fee || 0;
    const totalFees = paid.length * feePerPerson;
    
    return {
      total: all.length,
      present: present.length,
      paidCount: paid.length,
      unpaidCount: present.length - paid.length,
      collected: totalFees
    };
  });

  sessions = this.sessionsSignal.asReadonly();

  // --- Session Actions ---

  addSession(name: string, date: string) {
    const newSession: Session = {
      id: crypto.randomUUID(),
      name,
      date,
      fee: 150, // Default fee
      players: [],
      teams: [],
      matches: []
    };
    this.sessionsSignal.update(list => {
      const newList = [newSession, ...list];
      // Sort by date descending (newest first)
      return newList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  deleteSession(id: string) {
    this.sessionsSignal.update(list => list.filter(s => s.id !== id));
    if (this.activeSessionId() === id) {
      this.activeSessionId.set(null);
    }
  }

  selectSession(id: string | null) {
    this.activeSessionId.set(id);
  }

  updateFee(newFee: number) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId ? { ...s, fee: newFee } : s)
    );
  }

  // --- Player Actions (Targeting Active Session) ---

  addPlayer(name: string, level: SkillLevel, gender: Gender) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      level,
      gender,
      paid: false,
      present: false // Default to Absent as requested
    };

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: [...s.players, newPlayer] } 
        : s
      )
    );
  }

  // Bulk add players
  addPlayers(playersData: {name: string, level: SkillLevel, gender: Gender}[]) {
    const sessionId = this.activeSessionId();
    if (!sessionId || playersData.length === 0) return;

    const newPlayers: Player[] = playersData.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      level: p.level,
      gender: p.gender,
      paid: false,
      present: false
    }));

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: [...s.players, ...newPlayers] } 
        : s
      )
    );
  }

  updatePlayerDetails(playerId: string, name: string, level: SkillLevel, gender: Gender) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { 
            ...s, 
            players: s.players.map(p => p.id === playerId ? { ...p, name, level, gender } : p) 
          } 
        : s
      )
    );
  }

  removePlayer(playerId: string) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: s.players.filter(p => p.id !== playerId) } 
        : s
      )
    );
  }

  togglePresence(playerId: string) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: s.players.map(p => p.id === playerId ? { ...p, present: !p.present } : p) } 
        : s
      )
    );
  }

  togglePayment(playerId: string) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: s.players.map(p => p.id === playerId ? { ...p, paid: !p.paid } : p) } 
        : s
      )
    );
  }

  // --- Bulk Actions ---

  markAllPresent() {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, players: s.players.map(p => ({ ...p, present: true })) }
        : s
      )
    );
  }

  markAllPaid() {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { 
            ...s, 
            // Only mark paid if they are present (or you can decide to mark everyone paid)
            // Typically you pay if you are there.
            players: s.players.map(p => p.present ? { ...p, paid: true } : p) 
          }
        : s
      )
    );
  }

  // --- Reordering & Sorting ---

  reorderPlayers(fromIndex: number, toIndex: number) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;
    
    this.sessionsSignal.update(sessions => 
      sessions.map(s => {
        if (s.id !== sessionId) return s;
        
        const newPlayers = [...s.players];
        const [movedPlayer] = newPlayers.splice(fromIndex, 1);
        newPlayers.splice(toIndex, 0, movedPlayer);
        
        return { ...s, players: newPlayers };
      })
    );
  }

  sortPlayers(criteria: 'present' | 'paid' | 'name') {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => {
        if (s.id !== sessionId) return s;
        
        const newPlayers = [...s.players];
        newPlayers.sort((a, b) => {
          if (criteria === 'present') {
            // Present first
            return (Number(b.present) - Number(a.present));
          } else if (criteria === 'paid') {
            // Paid first
            return (Number(b.paid) - Number(a.paid));
          } else {
             return a.name.localeCompare(b.name);
          }
        });
        
        return { ...s, players: newPlayers };
      })
    );
  }

  // --- Team Actions ---

  generateTeams(teamCount: number) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    const pool = [...this.presentPlayers()];
    pool.sort((a, b) => this.skillWeights[b.level] - this.skillWeights[a.level]);

    const newTeams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
      name: `Team ${i + 1}`,
      players: [],
      score: 0
    }));

    pool.forEach((player, index) => {
      const cycle = Math.floor(index / teamCount);
      const isSnakeBack = cycle % 2 === 1;
      const teamIndex = isSnakeBack 
        ? (teamCount - 1) - (index % teamCount) 
        : index % teamCount;
      newTeams[teamIndex].players.push(player);
    });

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId ? { ...s, teams: newTeams } : s)
    );
  }

  movePlayerBetweenTeams(fromTeamIndex: number, toTeamIndex: number, fromPlayerIndex: number, toPlayerIndex: number | null) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => {
        if (s.id !== sessionId) return s;

        // Clone teams array
        const newTeams = s.teams.map(t => ({...t, players: [...t.players]}));
        
        // Validation
        if (!newTeams[fromTeamIndex] || !newTeams[toTeamIndex]) return s;

        // Remove from source
        const [movedPlayer] = newTeams[fromTeamIndex].players.splice(fromPlayerIndex, 1);
        if (!movedPlayer) return s;

        // Add to destination
        if (toPlayerIndex !== null && toPlayerIndex >= 0 && toPlayerIndex <= newTeams[toTeamIndex].players.length) {
            newTeams[toTeamIndex].players.splice(toPlayerIndex, 0, movedPlayer);
        } else {
            // Default to append
            newTeams[toTeamIndex].players.push(movedPlayer);
        }

        return { ...s, teams: newTeams };
      })
    );
  }

  updateScore(teamIndex: number, delta: number) {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => {
        if (s.id !== sessionId) return s;
        const newTeams = [...s.teams];
        if (newTeams[teamIndex]) {
          newTeams[teamIndex] = { 
            ...newTeams[teamIndex], 
            score: Math.max(0, newTeams[teamIndex].score + delta) 
          };
        }
        return { ...s, teams: newTeams };
      })
    );
  }

  saveMatchResult() {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;
    
    this.sessionsSignal.update(sessions => 
      sessions.map(s => {
        if (s.id !== sessionId) return s;
        if (s.teams.length < 2) return s;

        const record: MatchRecord = {
            id: crypto.randomUUID(),
            team1Name: s.teams[0].name,
            team1Score: s.teams[0].score,
            team2Name: s.teams[1].name,
            team2Score: s.teams[1].score,
            timestamp: new Date().toISOString()
        };

        // Add record to history (newest first)
        const newMatches = [record, ...(s.matches || [])];
        
        return { ...s, matches: newMatches };
      })
    );
  }

  resetScores() {
    const sessionId = this.activeSessionId();
    if (!sessionId) return;

    this.sessionsSignal.update(sessions => 
      sessions.map(s => s.id === sessionId 
        ? { ...s, teams: s.teams.map(t => ({ ...t, score: 0 })) } 
        : s
      )
    );
  }
}