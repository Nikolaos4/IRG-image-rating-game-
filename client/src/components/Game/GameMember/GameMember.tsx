import type { GetGameResponse } from "@/api/game";
import { memo } from "react";
import "./GameMember.scss";

interface Props {
    member: GetGameResponse["game"]["members"][number];
    isCreator?: boolean;
}

function GameMemberComponent({ member, isCreator }: Props) {
    return (
        <div
            className="member"
            data-creator={isCreator}>
            <div className="avatar"></div>
            <div className="name">{member.username}</div>
        </div>
    );
}

const GameMember = memo(GameMemberComponent, (prev, next) => {
    return (
        prev.isCreator === next.isCreator &&
        prev.member.user_id === next.member.user_id &&
        prev.member.username === next.member.username
    );
});

export default GameMember;
