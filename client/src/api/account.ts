import { http } from "./http";

export async function postConnectTgRequest() {
    const response = await http.post<{ code: string }>("/account/connect-tg");
    return response.data.code;
}
