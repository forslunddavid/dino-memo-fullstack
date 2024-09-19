import { useNavigate } from "react-router-dom"
import Button from "../components/Button"
import "./GameEndPopup.css"

function GameEndPopup({ winner }) {
	const navigate = useNavigate()

	return (
		<div className="popup-overlay">
			<div className="popup-content">
				<h2>{winner ? `${winner} wins!` : "It's a tie!"}</h2>
				<Button onClick={() => navigate("/")}>Back to Home</Button>
			</div>
		</div>
	)
}

export default GameEndPopup
