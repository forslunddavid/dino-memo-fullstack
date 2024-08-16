import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../components/Button"

function JoinGame() {
	const [name, setName] = useState("")
	const [gameId, setGameId] = useState("")
	const navigate = useNavigate()

	const handleJoinGame = async () => {
		if (gameId && name) {
			await fetch(
				`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}/join`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ name }),
				}
			)
			navigate(`/game/${gameId}`, { state: { name } })
		} else {
			alert("Please enter both a name and a game ID")
		}
	}

	return (
		<>
			<label>
				Namn
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
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
		</>
	)
}

export default JoinGame
