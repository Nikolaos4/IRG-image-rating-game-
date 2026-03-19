import { useEffect, useRef } from "react";
import "./Popup.scss";

export type PopupAction = {
    key: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
};

type Props = {
    isOpen: boolean;
    actions: PopupAction[];
    onClose: () => void;
    className?: string;
};

export default function Popup({ isOpen, actions, onClose, className }: Props) {
    const popupRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (!popupRef.current) {
                return;
            }

            if (!popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            ref={popupRef}
            className={`popup ${className ?? ""}`.trim()}>
            <ul className="popup__list">
                {actions.map((action) => (
                    <li key={action.key}>
                        <button
                            type="button"
                            className={`popup__action ${action.danger ? "popup__action--danger" : ""}`.trim()}
                            onClick={() => {
                                action.onClick();
                                onClose();
                            }}>
                            {action.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
