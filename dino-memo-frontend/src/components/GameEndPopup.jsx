import { useNavigate } from "react-router-dom"
import Button from "../components/Button"
import "./GameEndPopup.css"

function GameEndPopup({ winner }) {
	const navigate = useNavigate()

	const message = winner === null ? "It's a tie!" : `${winner} wins!`

	return (
		<div className="popup-overlay">
			<div className="popup-content">
				<h2>{message}</h2>
				<Button onClick={() => navigate("/")}>Back to Home</Button>
			</div>
		</div>
	)
}

export default GameEndPopup
