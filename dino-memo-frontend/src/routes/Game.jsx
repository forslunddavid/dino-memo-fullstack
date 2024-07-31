import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import background from "../assets/wood-background.jpg"
import "./Game.css"
import "../components/Card.css"
import Card from "../components/Card"
import dinosaurs from "../assets/dinosaurs.json"

const shuffleArray = (array) => {
	for (
		let currentIndex = array.length - 1;
		currentIndex > 0;
		currentIndex--
	) {
		const randomIndex = Math.floor(Math.random() * (currentIndex + 1))
		;[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		]
	}
	return array
}

const createNewGame = (dinosaurs) => {
	const shuffledDinosaurs = shuffleArray([...dinosaurs])
	const selectedCards = shuffledDinosaurs.slice(0, 12)
	const cardDeck = [...selectedCards, ...selectedCards]
	return shuffleArray(cardDeck)
}

function Game() {
	const { state } = useLocation()
	const { gameId } = useParams()
	const [firstCard, setFirstCard] = useState(null)
	const [secondCard, setSecondCard] = useState(null)
	const [cardDeck, setCardDeck] = useState([])
	const [cardFlipped, setCardFlipped] = useState([])
	const [disableClicks, setDisableClicks] = useState(false)
	const [players, setPlayers] = useState({
		player1: { name: "", points: 0 },
		player2: { name: "", points: 0 },
	})

	useEffect(() => {
		const fetchGameState = async () => {
			const response = await fetch(
				`https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}`
			)
			const gameState = await response.json()
			setCardDeck(gameState.cardDeck || createNewGame(dinosaurs))
			setCardFlipped(gameState.cardFlipped || Array(24).fill(false))
			setPlayers({
				player1: gameState.player1,
				player2: gameState.player2,
			})
		}

		fetchGameState()
		const interval = setInterval(fetchGameState, 1000) // Polling every second
		return () => clearInterval(interval)
	}, [gameId])

	const updateGameState = async (newState) => {
		await fetch(
			`https://your-api-id.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newState),
			}
		)
	}

	const handleCardClick = (index) => {
		if (disableClicks || cardFlipped[index]) return
		const newCardFlipped = [...cardFlipped]
		newCardFlipped[index] = true
		setCardFlipped(newCardFlipped)
		console.log(newCardFlipped, "cardflipped")
		console.log(`Flipped Card: ${cardDeck[index].species}`)

		if (firstCard === null) {
			setFirstCard(index)
		} else if (secondCard === null) {
			setSecondCard(index)
			setDisableClicks(true)
			if (cardDeck[firstCard].species === cardDeck[index].species) {
				// Update points logic here
				let newPlayers = { ...players }
				newPlayers.player1.points += 1 // Example point increment
				setPlayers(newPlayers)
				updateGameState({
					cardFlipped: newCardFlipped,
					player1: newPlayers.player1,
					player2: newPlayers.player2,
				})
				resetSelection()
			} else {
				setTimeout(() => {
					const resetFlipped = [...newCardFlipped]
					resetFlipped[firstCard] = false
					resetFlipped[index] = false
					setCardFlipped(resetFlipped)
					updateGameState({
						cardFlipped: resetFlipped,
						player1: players.player1,
						player2: players.player2,
					})
					resetSelection()
				}, 1000)
			}
		}
	}

	const resetSelection = () => {
		setFirstCard(null)
		setSecondCard(null)
		setDisableClicks(false)
	}

	return (
		<>
			<div
				className="game-bg"
				style={{ backgroundImage: `url(${background})` }}
			>
				<div className="card-container">
					{cardDeck.map((dino, index) => (
						<Card
							key={index}
							flipped={cardFlipped[index]}
							onClick={() => handleCardClick(index)}
							species={dino.species}
							image={dino.image}
						/>
					))}
				</div>
				<div className="game-name">
					{players.player1.name && (
						<p>
							Player 1: {players.player1.name} (Points:{" "}
							{players.player1.points})
						</p>
					)}
					{players.player2.name && (
						<p>
							Player 2: {players.player2.name} (Points:{" "}
							{players.player2.points})
						</p>
					)}
				</div>
			</div>
		</>
	)
}

export default Game
