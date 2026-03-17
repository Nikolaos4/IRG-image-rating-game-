import { http } from "./http";

export type Theme = {
    criteria_id: number;
    name: string;
    description: string;
    images_count: number;
};

export type ThemesResponse = {
    message: string;
    themes: Theme[];
};

export async function getThemesRequest() {
    const response = await http.get<ThemesResponse>("/themes");
    return response.data.themes;
}
