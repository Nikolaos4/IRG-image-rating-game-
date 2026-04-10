import { http } from "./http";

export type NewsItem = {
    title: string;
    content: string;
};

export type CreateNewsRequest = {
    title: string;
    content: string;
};

export async function createNewsRequest(payload: CreateNewsRequest) {
    const response = await http.post<null>("/news", payload);
    return response.data;
}
