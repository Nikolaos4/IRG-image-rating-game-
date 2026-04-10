import { http } from "./http";

export async function postConnectTgRequest() {
    const response = await http.post<{ code: string }>("/connect-tg");
    return response.data.code;
}
