import { http } from "./http";

export type RatingItem = {
    position: number;
    user_id: number;
    username: string;
    wins: number;
    losses: number;
};

export type RatingResponse = {
    rating: RatingItem[];
};

export async function getRatingRequest() {
    const response = await http.get<RatingResponse>("/rating");
    return response.data.rating;
}
