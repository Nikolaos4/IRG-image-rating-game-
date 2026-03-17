import type { Theme } from "@/api/themes";
import "./ThemeItem.scss";

interface Props {
    theme: Theme;
}

export default function ThemeItem({ theme }: Props) {
    return (
        <div className="theme-item">
            <img
                src="/images/theme-placeholder.png"
                alt={theme.name}
            />
            <div className="data">
                <h3>{theme.name}</h3>
                <div className="images-count">{theme.images_count} картинок</div>
            </div>
        </div>
    );
}
