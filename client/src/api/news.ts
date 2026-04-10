import { http } from "./http";

export type News = {
    news: Array<{
        news_id: number,
        title: string,
        content: string,
        created_at: string,
        author: string,
    }>;
};

export async function postNews(payload : {title: string, content: string}) {
    const response = await http.post<{ message: string }>("/", payload);
    return response.data;
}

export async function getNews() {
    const response = await http.get<News>("/");
    return response.data.news;
}