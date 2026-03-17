import "./ThemesList.scss";
import ThemeItem from "../ThemeItem/ThemeItem";
import type { Theme } from "@/api/themes";

interface Props {
    themes: Theme[];
}

export default function ThemesList({ themes }: Props) {
    return (
        <div className="themes-list">
            {themes.map((theme) => (
                <ThemeItem
                    key={theme.criteria_id}
                    theme={theme}
                />
            ))}
        </div>
    );
}
