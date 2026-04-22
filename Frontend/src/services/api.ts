import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    timestamp: string;
}

export interface MatchSummary {
    id: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
}

export interface MatchEvent {
    id: number;
    time: string;
    type: string;
    player: string;
    team: string;
    description: string;
}

export interface MatchDetail extends MatchSummary {
    durationMinutes: number;
    events: MatchEvent[];
}

export interface StatComparison {
    name: string;
    home: number | string;
    away: number | string;
}

export interface MatchOverview extends MatchSummary {
    matchId: string;
    possession: Record<string, number>;
    passAccuracy: Record<string, number>;
    stats: StatComparison[];
}

export interface PlayerSummary {
    id: string;
    name: string;
    teamId: string;
    teamName: string;
    position: string;
    number: number;
    rating: number;
    goals: number;
    assists: number;
}

export interface PlayerAttributes {
    speed: number;
    dribbling: number;
    shooting: number;
    passing: number;
    defending: number;
    physical: number;
}

export interface PlayerDetail extends PlayerSummary {
    minutesPlayed: number;
    passesAttempted: number;
    passesCompleted: number;
    turnovers: number;
    passAccuracy: number;
    turnoverRate: number;
    attributes: PlayerAttributes;
}

export interface Recommendation {
    id: string;
    scope: string;
    matchId?: string;
    teamId?: string;
    playerId?: string;
    title: string;
    description: string;
    priority: string;
    confidence: number;
    reasoning: string;
    metrics: Record<string, number | string | boolean>;
}

export interface TeamStats {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    avgRating: number;
}

export interface TeamAttributes {
    attack: number;
    passing: number;
    defense: number;
    speed: number;
    dribbling: number;
    shooting: number;
}

export interface TeamSummary {
    id: string;
    name: string;
    stadium: string;
    coach: string;
    founded: number;
    players: number;
    emoji: string;
    stats: TeamStats;
    attributes: TeamAttributes;
}

export interface HeatmapPoint {
    x: number;
    y: number;
    value: number;
}

export interface PlayerHeatmap {
    playerId: string;
    playerName: string;
    points: HeatmapPoint[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${BASE_URL}${path}`, options);
        const result: ApiResponse<T> = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result.data;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Connection error';
        toast.error(message);
        throw error;
    }
}

export const api = {
    matches: {
        list: () => request<MatchSummary[]>('/matches'),
        get: (id: string) => request<MatchDetail>(`/matches/${id}`),
        getOverview: (id: string) => request<MatchOverview>(`/matches/${id}/overview`),
        delete: (id: string | number) => request<void>(`/matches/${id}`, { method: 'DELETE' }),
    },
    players: {
        list: () => request<PlayerSummary[]>('/players'),
        get: (id: string) => request<PlayerDetail>(`/players/${id}`),
        getHeatmap: (id: string) => request<PlayerHeatmap>(`/players/${id}/heatmap`),
    },
    teams: {
        list: () => request<TeamSummary[]>('/teams'),
        get: (id: string) => request<TeamSummary>(`/teams/${id}`),
        getPlayers: (id: string) => request<PlayerSummary[]>(`/teams/${id}/players`),
    },
    recommendations: {
        list: () => request<Recommendation[]>('/recommendations'),
        forMatch: (matchId: string) => request<Recommendation[]>(`/recommendations/match/${matchId}`),
        forPlayer: (playerId: string) => request<Recommendation[]>(`/recommendations/player/${playerId}`),
    },
    upload: {
        video: (formData: FormData) => request<{ task_id: string }>('/analysis/upload', {
            method: 'POST',
            body: formData,
        }),
        getTaskStatus: (taskId: string) => request<{ status: string, error_message?: string }>(`/analysis/tasks/${taskId}`),
    }
};

