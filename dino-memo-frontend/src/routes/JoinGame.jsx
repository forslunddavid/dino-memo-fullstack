import { useState } from "react"
import { useNavigate } from "react-router-dom"
import background from "../assets/wood-background-with-cards.jpg"
import Button from "../components/Button"
import "./JoinGame.css"

function JoinGame() {
	const [player2Name, setPlayer2Name] = useState("")
	const [gameId, setGameId] = useState("")
	const [error, setError] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()

	const handleJoinGame = async () => {
		if (gameId && player2Name) {
			setIsLoading(true)
			setError("")
			try {
				const response = await fetch(
					`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}/join`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ player2Name }),
					}
				)

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.error || "Failed to join game")
				}

				const gameData = await response.json()
				console.log("Joined game:", gameData)

				navigate(`/game/${gameId}`, {
					state: { playerName: player2Name },
				})
			} catch (err) {
				console.error("Error joining game:", err)
				setError(err.message)
			} finally {
				setIsLoading(false)
			}
		} else {
			setError("Please enter both a name and a game ID")
		}
	}

	return (
		<>
			<div
				className="game-bg"
				style={{ backgroundImage: `url(${background})` }}
			>
				<div className="welcome-wrapper">
					<h3>Join a game</h3>
					<div className="join-game-label join-game-input">
						<label>Name:</label>
						<input
							type="text"
							value={player2Name}
							onChange={(e) => setPlayer2Name(e.target.value)}
							disabled={isLoading}
						/>
					</div>

					<div className="join-game-label join-game-input">
						<label>Game ID:</label>
						<input
							type="text"
							value={gameId}
							onChange={(e) => setGameId(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="join-game-button">
						<Button onClick={handleJoinGame} disabled={isLoading}>
							{isLoading ? "Joining..." : "Join Game"}
						</Button>
					</div>

					{error && <p style={{ color: "red" }}>{error}</p>}
				</div>
			</div>
		</>
	)
}

export default JoinGame
