import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import "./Start.css"
import background from "../assets/wood-background-with-cards.webp"
import MobileWarning from "../components/MobileWarning"

function Start() {
	const [showWarning, setShowWarning] = useState(false)

	useEffect(() => {
		// Check if user is on mobile
		const isMobile = window.innerWidth < 768
		// Check if user hasn't dismissed warning before
		const hasSeenWarning = localStorage.getItem("hideWarning")

		setShowWarning(isMobile && !hasSeenWarning)

		// Optional: Listen for resize events
		const handleResize = () => {
			const hasSeenWarning = localStorage.getItem("hideWarning")
			setShowWarning(window.innerWidth < 768 && !hasSeenWarning)
		}

		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	return (
		<main
			className="game-bg"
			style={{ backgroundImage: `url(${background})` }}
		>
			<MobileWarning
				isVisible={showWarning}
				setShowWarning={setShowWarning}
			/>
			<div className="welcome-wrapper">
				<section className="welcome-section">
					<h1>Welcome to Dino Memory</h1>
					<p className="paragraph">
						This is an online multiplayer game to learn your
						dinosaurs
					</p>
					<p className="paragraph">
						To create a game just click the create game button and
						enter your name
					</p>
					<p className="paragraph">
						To join a friend click join game, enter your name and
						the game-id that your friend gives you.
					</p>
				</section>
				<section className="button-section">
					<Link className="button start-buttons" to="/create-game">
						Create new game
					</Link>
					<Link className="button start-buttons" to="/join-game">
						Join Game
					</Link>
				</section>
			</div>
		</main>
	)
}

export default Start
