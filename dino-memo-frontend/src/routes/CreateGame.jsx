import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Button from "../components/Button"
import background from "../assets/wood-background-with-cards.webp"
import { createGame } from "../constants/api"
import "./CreateGame.css"

function CreateGame() {
	const [formData, setFormData] = useState({
		player1Name: "",
		isSinglePlayer: false,
	})
	const [error, setError] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()

	const handleInputChange = (e) => {
		const value =
			e.target.type === "checkbox" ? e.target.checked : e.target.value
		setFormData((prev) => ({
			...prev,
			[e.target.name]: value,
		}))
		setError("")
	}

	const handleCreateGame = async (e) => {
		e.preventDefault()
		const { player1Name, isSinglePlayer } = formData

		if (!player1Name.trim()) {
			setError("Please enter a name")
			return
		}

		setIsLoading(true)
		setError("")

		try {
			const data = await createGame(player1Name.trim(), isSinglePlayer)
			console.log("Game created successfully:", data)
			navigate(`/game/${data.gameId}`, {
				state: {
					playerName: player1Name.trim(),
					isSinglePlayer,
				},
			})
		} catch (error) {
			console.error("Error creating game:", error)
			setError(error.message)
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
				<form onSubmit={handleCreateGame} className="create-game-form">
					<h3>Create a new game</h3>

					<div className="form-group">
						<input
							id="player1Name"
							name="player1Name"
							type="text"
							value={formData.player1Name}
							onChange={handleInputChange}
							disabled={isLoading}
							required
							maxLength={50}
							aria-label="Your name"
							placeholder="Enter your name"
						/>
					</div>

					<div className="form-group checkbox-group">
						<label
							htmlFor="isSinglePlayer"
							className="checkbox-label"
						>
							<input
								type="checkbox"
								id="isSinglePlayer"
								name="isSinglePlayer"
								checked={formData.isSinglePlayer}
								onChange={handleInputChange}
								disabled={isLoading}
							/>
							Single player game
						</label>
					</div>
					<div className="form-group">
						<Button
							type="submit"
							disabled={isLoading}
							aria-busy={isLoading}
						>
							{isLoading ? "Creating..." : "Create new game"}
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

export default CreateGame
