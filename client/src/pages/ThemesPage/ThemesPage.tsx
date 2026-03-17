import ThemesList from "@/components/Themes/ThemesList/ThemesList";
import "./ThemesPage.scss";
import "@/assets/scss/pages.scss";
import { useEffect, useState } from "react";
import { getThemesRequest, type Theme } from "@/api/themes";

export default function ThemesPage() {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchThemes = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getThemesRequest();
                setThemes(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load themes";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchThemes();
    }, []);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    return (
        <main>
            <h2>Темы</h2>
            <ThemesList themes={themes} />
        </main>
    );
}
