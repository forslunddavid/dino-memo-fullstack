const GameStatus = ({ currentPlayer, localPlayer, socket }) => (
	<>
		<p>
			Current Turn:{" "}
			{currentPlayer === localPlayer ? "Your Turn" : "Opponent's Turn"}
		</p>
		<p>Connection Status: {socket ? "Connected" : "Disconnected"}</p>
	</>
)

export default GameStatus
