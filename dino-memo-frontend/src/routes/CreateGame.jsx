import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Button from "../components/Button"
import background from "../assets/wood-background-with-cards.jpg"
import "./CreateGame.css"

function CreateGame() {
	const [player1Name, setPlayer1Name] = useState("")
	const navigate = useNavigate()

	const handleCreateGame = async () => {
		if (player1Name) {
			const response = await fetch(
				"https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ player1Name }),
				}
			)

			if (response.ok) {
				const { gameId } = await response.json()
				navigate(`/game/${gameId}`, { state: { player1Name } })
			} else {
				alert("Failed to create game")
			}
		} else {
			alert("Please enter a name")
		}
	}

	return (
		<>
			<div
				className="game-bg"
				style={{ backgroundImage: `url(${background})` }}
			>
				<div className="welcome-wrapper">
					<h3>Create a new game</h3>
					<label className="create-game-label">
						<p>Name:</p>
						<input
							className="create-game-input"
							type="text"
							value={player1Name}
							onChange={(e) => setPlayer1Name(e.target.value)}
						/>
					</label>
					<div className="create-game-button">
						<Button onClick={handleCreateGame}>
							Create new game
						</Button>
					</div>
				</div>
			</div>
		</>
	)
}

export default CreateGame
