import { useMemo, useState } from "react";
import Popup, { type PopupAction } from "../Popup/Popup";
import "./Select.scss";

export type SelectOption<T extends string> = {
    value: T;
    label: string;
};

type Props<T extends string> = {
    value: T;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
    placeholder?: string;
};

export default function Select<T extends string>({ value, options, onChange, disabled, placeholder }: Props<T>) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder ?? "Выберите";

    const actions = useMemo<PopupAction[]>(
        () =>
            options.map((option) => ({
                key: option.value,
                label: option.label,
                selected: option.value === value,
                onClick: () => onChange(option.value),
            })),
        [onChange, options, value],
    );

    return (
        <div className="select">
            <button
                type="button"
                className="select__trigger"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}>
                <span>{selectedLabel}</span>
                <span className="select__chevron">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M12 14.975q-.2 0-.375-.062T11.3 14.7l-4.6-4.6q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l3.9 3.9l3.9-3.9q.275-.275.7-.275t.7.275t.275.7t-.275.7l-4.6 4.6q-.15.15-.325.213t-.375.062"
                        />
                    </svg>
                </span>
            </button>

            <Popup
                isOpen={isOpen && !disabled}
                actions={actions}
                onClose={() => setIsOpen(false)}
                className="popup--select"
            />
        </div>
    );
}
