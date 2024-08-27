import React, { useEffect, useState } from "react"
import { useParams, useLocation } from "react-router-dom"
import Card from "../components/Card"
import "./Game.css"
import background from "../assets/wood-background.jpg"

function Game() {
	const { gameId } = useParams()
	const { state } = useLocation()
	const [gameState, setGameState] = useState({
		cardFlipped: [],
		cardDeck: [],
		players: {
			player1: { name: "", points: 0 },
			player2: { name: "", points: 0 },
		},
		currentPlayer: "player1",
	})
	const [socket, setSocket] = useState(null)
	const [error, setError] = useState(null)
	const [localPlayer, setLocalPlayer] = useState(null)

	useEffect(() => {
		const fetchGameState = async () => {
			try {
				const response = await fetch(
					`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}`
				)
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}
				const data = await response.json()
				setGameState(data)
				if (state?.playerName === data.players.player1.name) {
					setLocalPlayer("player1")
				} else if (state?.playerName === data.players.player2.name) {
					setLocalPlayer("player2")
				}
			} catch (e) {
				console.error("Failed to fetch game state:", e)
				setError("Failed to load game. Please try again later.")
			}
		}

		fetchGameState()

		const ws = new WebSocket(
			`wss://zc8eahv77i.execute-api.eu-north-1.amazonaws.com/dev`
		)

		ws.onopen = () => {
			console.log("WebSocket Connected")
			ws.send(JSON.stringify({ action: "joinGame", gameId: gameId }))
		}

		ws.onmessage = (event) => {
			console.log("WebSocket Message Received:", event.data)
			try {
				const data = JSON.parse(event.data)
				if (data.type === "gameUpdate") {
					setGameState(data.gameState)
				}
			} catch (error) {
				console.error("Error parsing WebSocket message:", error)
			}
		}

		ws.onerror = (error) => {
			console.error("WebSocket Error:", error)
			setError("WebSocket connection error. Please try again.")
		}

		ws.onclose = () => {
			console.log("WebSocket Disconnected")
		}

		setSocket(ws)

		return () => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.close()
			}
		}
	}, [gameId, state])

	const handleCardClick = (index) => {
		if (
			gameState.currentPlayer !== localPlayer ||
			gameState.cardFlipped[index]
		)
			return

		const newCardFlipped = [...gameState.cardFlipped]
		newCardFlipped[index] = true

		const updatedGameState = {
			...gameState,
			cardFlipped: newCardFlipped,
		}

		setGameState(updatedGameState)
		socket.send(
			JSON.stringify({
				action: "updateGame",
				gameState: updatedGameState,
			})
		)
	}

	if (error) {
		return <div className="error-message">{error}</div>
	}

	if (!gameState.players) {
		return <div>Loading...</div>
	}

	return (
		<>
			<div
				className="game-bg"
				style={{ backgroundImage: `url(${background})` }}
			>
				<div className="card-container">
					{gameState.cardDeck.map((card, index) => (
						<Card
							key={index}
							flipped={gameState.cardFlipped[index]}
							onClick={() => handleCardClick(index)}
							species={card.species}
							image={card.image}
						/>
					))}
				</div>
				<div className="game-name">
					{gameState.players.player1.name && (
						<p>
							Player 1: {gameState.players.player1.name} (Points:{" "}
							{gameState.players.player1.points})
						</p>
					)}
					{gameState.players.player2.name && (
						<p>
							Player 2: {gameState.players.player2.name} (Points:{" "}
							{gameState.players.player2.points})
						</p>
					)}
				</div>
			</div>
		</>
		// <div className="game-container">
		// 	<h1>Game {gameId}</h1>
		// 	<div className="player-info">
		// 		<p>
		// 			Player 1: {gameState.players.player1.name} (Points:{" "}
		// 			{gameState.players.player1.points})
		// 		</p>
		// 		<p>
		// 			Player 2: {gameState.players.player2.name} (Points:{" "}
		// 			{gameState.players.player2.points})
		// 		</p>
		// 		<p>
		// 			Current Turn:{" "}
		// 			{gameState.currentPlayer === localPlayer
		// 				? "Your Turn"
		// 				: "Opponent's Turn"}
		// 		</p>
		// 	</div>
		// 	<div className="game-board">
		// 		{gameState.cardDeck.map((card, index) => (
		// 			<Card
		// 				key={index}
		// 				flipped={gameState.cardFlipped[index]}
		// 				onClick={() => handleCardClick(index)}
		// 				image={card.image}
		// 				species={card.species}
		// 			/>
		// 		))}
		// 	</div>
		// </div>
	)
}

export default Game
