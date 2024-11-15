import { useState } from "react"
import { useNavigate } from "react-router-dom"
import background from "../assets/wood-background-with-cards.jpg"
import Button from "../components/Button"
import "./JoinGame.css"
import { joinGame } from "../constants/api"

function JoinGame() {
	const [formData, setFormData] = useState({
		player2Name: "",
		gameId: "",
	})
	const [error, setError] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))
		setError("")
	}

	const handleJoinGame = async (e) => {
		e.preventDefault() // Prevent form submission
		const { player2Name, gameId } = formData

		if (!player2Name || !gameId) {
			setError("Please enter both name and game ID")
			return // Return early if validation fails
		}

		setIsLoading(true)
		setError("")

		try {
			const gameData = await joinGame(gameId, player2Name)
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
	}

	return (
		<main
			className="game-bg"
			style={{ backgroundImage: `url(${background})` }}
		>
			<div className="welcome-wrapper">
				<form onSubmit={handleJoinGame} className="join-game-form">
					<h3>Join a game</h3>

					<div className="form-group">
						<label htmlFor="player2Name">Name:</label>
						<input
							id="player2Name"
							name="player2Name"
							type="text"
							value={formData.player2Name}
							onChange={handleInputChange}
							disabled={isLoading}
							required
							maxLength={50}
							aria-label="Your name"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="gameId">Game ID:</label>
						<input
							id="gameId"
							name="gameId"
							type="text"
							value={formData.gameId}
							onChange={handleInputChange}
							disabled={isLoading}
							required
							pattern="[A-Za-z0-9\-]+"
						/>
					</div>

					<div className="form-group">
						<Button
							className="join-game-button"
							disabled={isLoading}
							aria-busy={isLoading}
							type="submit"
						>
							{isLoading ? "Joining..." : "Join Game"}
						</Button>
					</div>

					{error && (
						<p role="alert" className="error-message">
							{error}
						</p>
					)}
				</form>
			</div>
		</main>
	)
}

export default JoinGame
