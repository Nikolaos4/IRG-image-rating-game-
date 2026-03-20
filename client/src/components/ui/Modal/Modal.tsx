import { useEffect, useRef, type ReactNode } from "react";
import "./Modal.scss";

type Props = {
    isOpen: boolean;
    title?: string;
    onClose: () => void;
    children: ReactNode;
};

export default function Modal({ isOpen, title, onClose, children }: Props) {
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (!contentRef.current) {
                    return;
                }

                if (!contentRef.current.contains(event.target as Node)) {
                    onClose();
                }
            }}>
            <div
                ref={contentRef}
                className="modal-content">
                <div className="modal-header">
                    {title ? <h3>{title}</h3> : null}
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
