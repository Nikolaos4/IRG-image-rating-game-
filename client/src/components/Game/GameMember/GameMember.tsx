import type { GetGameResponse } from "@/api/game";
import "./GameMember.scss";

interface Props {
    member: GetGameResponse["game"]["members"][number];
    isCreator?: boolean;
}

export default function GameMember({ member, isCreator }: Props) {
    return (
        <div
            className="member"
            data-creator={isCreator}>
            <div className="avatar"></div>
            <div className="name">{member.username}</div>
        </div>
    );
}
