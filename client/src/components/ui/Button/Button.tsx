import "./Button.scss";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export default function Button({ children, ...props }: Props) {
    return <button {...props}>{children}</button>;
}
