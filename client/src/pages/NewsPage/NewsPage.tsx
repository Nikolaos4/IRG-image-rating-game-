import { postNews } from "@/api/news";
import "@/assets/scss/pages.scss";
import Button from "@/components/ui/Button/Button";
import Input from "@/components/ui/Input/Input";
import type { ChangeEvent } from "react";
import "./NewsPage.scss";

export default function NewsPage() {
    async function onSubmit(e: ChangeEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const title = formData.get("title")?.toString()!;
        const content = formData.get("content")?.toString()!;

        try {
            await postNews({ title, content });
            alert("Новость успешно создана!");
        } catch (error) {
            console.error("Error creating news request:", error);
        }
    }

    return (
        <main className="news-page">
            <h2>Новая новость</h2>

            <form
                className="news-form"
                onSubmit={onSubmit}>
                <Input
                    placeholder="Заголовок"
                    name="title"
                />
                <textarea
                    placeholder="Текст"
                    name="content"
                />

                <Button type="submit">Опубликовать</Button>
            </form>
        </main>
    );
}
