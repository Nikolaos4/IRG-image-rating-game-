import { http } from "./http";

export type CreateGameRequest = {
    criteria: number;
};

export type CreateGameResponse = {
    message: string;
    game: {
        status: string;
        game_id: string;
        max_rounds: number | null;
        current_round: number;
        criteria: {
            criteria_id: number;
            name: string;
        };
    };
};

export type GetGameResponse = {
    game: {
        status: string;
        game_id: string;
        max_players: number | null;
        max_rounds: number | null;
        current_round: number;
        criteria: {
            criteria_id: number;
            name: string;
        };
        creator: {
            user_id: number;
            username: string;
        };
        members: Array<{
            user_id: number;
            username: string;
        }>;
    };
};

export type JoinGameResponse = {
    message: string;
    game?: {
        game_id: string;
        game_member_id: number;
    };
};

export type EditGameSettingsRequest = {
    max_rounds?: number;
    max_players?: number;
};

export type EditGameSettingsResponse = {
    message: string;
    game: {
        game_id: string;
        max_rounds: number | null;
        max_players: number | null;
    };
};

export type StartGameResponse = {
    message: string;
    game: {
        game_id: string;
        status: string;
    };
};

export type GetRoundResponse = {
    round: {
        current_round: number;
        first_image: number;
        second_image: number;
        first_image_url: string;
        second_image_url: string;
        first_image_votes: number;
        second_image_votes: null;
        votes_received: number;
        votes_required: number;
    };
};

export type VoteRoundRequest = {
    voted_image_id: number;
};

export type VoteRoundResponse = {
    message: string;
    game?: {
        game_id: string;
        status?: string;
        current_round?: number;
    };
    completedRound?: {
        current_round: number;
        first_image: number;
        second_image: number;
        first_image_url: string;
        second_image_url: string;
        winner_image_id: number;
        first_image_votes: number;
        second_image_votes: number;
        votes_received: number;
        votes_required: number;
    };
    round?: {
        current_round: number;
        first_image: number;
        second_image: number;
        first_image_url: string;
        second_image_url: string;
        first_image_votes: number;
        second_image_votes: null;
        votes_received: number;
        votes_required: number;
    };
};

export type GameResultResponse = {
    game: {
        game_id: string;
        status: string;
        max_rounds: number | null;
        played_rounds: number;
        criteria: {
            criteria_id: number;
            name: string;
            description: string;
        };
        total_votes: number;
        player_stats: Array<{
            user_id: number;
            username: string;
            correct_answers: number;
        }>;
        winners: Array<{
            image_id: number;
            url: string;
            votes: number;
            position: number;
        }>;
        results: Array<{
            image_id: number;
            url: string;
            votes: number;
            position: number;
        }>;
    };
};

export async function createGameRequest(payload: CreateGameRequest) {
    const response = await http.post<CreateGameResponse>("/games", payload);
    return response.data;
}

export async function getGameRequest(gameId: string) {
    const response = await http.get<GetGameResponse>(`/games/${gameId}`);
    return response.data;
}

export async function joinGameRequest(gameId: string) {
    const response = await http.post<JoinGameResponse>(`/games/${gameId}/join`);
    return response.data;
}

export async function editGameSettingsRequest(gameId: string, payload: EditGameSettingsRequest) {
    const response = await http.patch<EditGameSettingsResponse>(`/games/${gameId}/settings`, payload);
    return response.data;
}

export async function startGameRequest(gameId: string) {
    const response = await http.post<StartGameResponse>(`/games/${gameId}/start`);
    return response.data;
}

export async function getRoundRequest(gameId: string) {
    const response = await http.get<GetRoundResponse>(`/games/${gameId}/round`);
    return response.data;
}

export async function voteRoundRequest(gameId: string, payload: VoteRoundRequest) {
    const response = await http.post<VoteRoundResponse>(`/games/${gameId}/round`, payload);
    return response.data;
}

export async function getGameResultRequest(gameId: string) {
    const response = await http.get<GameResultResponse>(`/games/${gameId}/result`);
    return response.data;
}

export function getRoundWsUrl(gameId: string, token?: string) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
    const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");

    if (!token) {
        return `${wsBaseUrl}/games/${gameId}/round/ws`;
    }

    const params = new URLSearchParams({ token });
    return `${wsBaseUrl}/games/${gameId}/round/ws?${params.toString()}`;
}

export function getGameWsUrl(gameId: string, token?: string) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
    const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");

    if (!token) {
        return `${wsBaseUrl}/games/${gameId}/ws`;
    }

    const params = new URLSearchParams({ token });
    return `${wsBaseUrl}/games/${gameId}/ws?${params.toString()}`;
}
