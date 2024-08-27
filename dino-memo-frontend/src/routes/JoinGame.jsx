import { useState } from "react"
import { useNavigate } from "react-router-dom"
import background from "../assets/wood-background-with-cards.jpg"
import Button from "../components/Button"

function JoinGame() {
	const [player2Name, setPlayer2Name] = useState("")
	const [gameId, setGameId] = useState("")
	const [error, setError] = useState("")
	const navigate = useNavigate()

	const handleJoinGame = async () => {
		if (gameId && player2Name) {
			try {
				const response = await fetch(
					`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}/join`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ name: player2Name }),
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
				<label>
					Namn
					<input
						type="text"
						value={player2Name}
						onChange={(e) => setPlayer2Name(e.target.value)}
					/>
				</label>
				<label>
					Spel-id
					<input
						type="text"
						value={gameId}
						onChange={(e) => setGameId(e.target.value)}
					/>
				</label>
				<Button onClick={handleJoinGame}>Anslut till spel</Button>
				{error && <p style={{ color: "red" }}>{error}</p>}
			</div>
		</>
	)
}

export default JoinGame
