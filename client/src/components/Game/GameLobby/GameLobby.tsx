import Button from "@/components/ui/Button/Button";
import "./GameLobby.scss";
import { startGameRequest, type GetGameResponse } from "@/api/game";
import GameMember from "../GameMember/GameMember";

interface Props {
    game: GetGameResponse["game"];
    onStatusUpdated: (status: string) => void;
}

export default function GameLobby({ game, onStatusUpdated }: Props) {
    async function startGame() {
        try {
            const response = await startGameRequest(game.game_id);
            onStatusUpdated(response.game.status);
        } catch (error) {
            console.error("Error starting game:", error);
        }
    }

    return (
        <div className="game-lobby">
            <Button>Скопировать ссылку</Button>
            <div className="rounds">Раундов: {game.max_rounds}</div>
            <div className="members">
                Участников: {game.members.length + 1} из {game.max_players}
            </div>
            <div className="members-list">
                <GameMember
                    member={game.creator}
                    isCreator={true}
                />
                {game.members.map((member) => (
                    <GameMember
                        key={member.user_id}
                        member={member}
                    />
                ))}
            </div>
            <Button onClick={startGame}>Начать</Button>
        </div>
    );
}
