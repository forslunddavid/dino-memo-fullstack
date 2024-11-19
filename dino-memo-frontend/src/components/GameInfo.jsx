// const GameInfo = ({
// 	gameId,
// 	gameState,
// 	isSinglePlayer,
// 	localPlayer,
// 	socket,
// }) => (
// 	<div className="game-info">
// 		<p>Game ID: {gameId}</p>
// 		{isSinglePlayer ? (
// 			<p>Points: {gameState.players?.player1?.points || 0}</p>
// 		) : (
// 			<>
// 				<p>
// 					Player 1: {gameState.players?.player1?.name || "Unknown"}{" "}
// 					Points: {gameState.players?.player1?.points || 0}
// 				</p>
// 				<p>
// 					Player 2:{" "}
// 					{gameState.players?.player2?.name || "Waiting for player 2"}{" "}
// 					Points: {gameState.players?.player2?.points || 0}
// 				</p>
// 				<p>
// 					Current Turn:{" "}
// 					{gameState.currentPlayer === localPlayer
// 						? "Your Turn"
// 						: "Opponent's Turn"}
// 				</p>
// 				<p>
// 					Connection Status: {socket ? "Connected" : "Disconnected"}
// 				</p>
// 			</>
// 		)}
// 	</div>
// )

import PlayerInfo from "./PlayerInfo"
import GameStatus from "./GameStatus"

const GameInfo = ({
	gameId,
	gameState,
	isSinglePlayer,
	localPlayer,
	socket,
}) => (
	<div className="game-info">
		<p>Game ID: {gameId}</p>
		{isSinglePlayer ? (
			<p>Points: {gameState.players?.player1?.points || 0}</p>
		) : (
			<>
				<PlayerInfo
					player={gameState.players?.player1}
					label="Player 1"
				/>
				<PlayerInfo
					player={gameState.players?.player2}
					label="Player 2"
					waiting="Waiting for player 2"
				/>
				<GameStatus
					currentPlayer={gameState.currentPlayer}
					localPlayer={localPlayer}
					socket={socket}
				/>
			</>
		)}
	</div>
)

export default GameInfo
