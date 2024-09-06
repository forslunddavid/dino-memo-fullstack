import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import Card from "../components/Card"
import "./Game.css"
import background from "../assets/wood-background.jpg"

function Game() {
	const { gameId } = useParams()
	const { state } = useLocation()
	const [gameState, setGameState] = useState(null)
	const [socket, setSocket] = useState(null)
	const [error, setError] = useState(null)
	const [localPlayer, setLocalPlayer] = useState(null)
	const reconnectAttempts = useRef(0)
	const maxReconnectAttempts = 5
	const [flippedCards, setFlippedCards] = useState([])
	const isSinglePlayer = state?.isSinglePlayer
	const CARD_FLIP_DELAY = 1000

	const fetchGameState = useCallback(async () => {
		try {
			console.log("Fetching game state for gameId:", gameId)
			const response = await fetch(
				`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}`
			)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			const data = await response.json()
			console.log("Fetched game state:", JSON.stringify(data, null, 2))
			setGameState(data)

			const playerName = state?.playerName
			console.log("Player name from state:", playerName)
			console.log("Player 1 name:", data.players?.player1?.name)
			console.log("Player 2 name:", data.players?.player2?.name)

			if (playerName === data.players?.player1?.name) {
				console.log("Setting local player to player1")
				setLocalPlayer("player1")
			} else if (playerName === data.players?.player2?.name) {
				console.log("Setting local player to player2")
				setLocalPlayer("player2")
			} else if (!data.players?.player2?.name) {
				console.log("Setting local player to player2 (joining)")
				setLocalPlayer("player2")
			} else {
				console.log("Local player not found in game state")
				setLocalPlayer(null)
			}
		} catch (e) {
			console.error("Failed to fetch game state:", e)
			setError(`Failed to load game. Error: ${e.message}`)
		}
	}, [gameId, state])

	const connectWebSocket = useCallback(() => {
		const ws = new WebSocket(
			`wss://zc8eahv77i.execute-api.eu-north-1.amazonaws.com/dev?gameId=${gameId}`
		)

		ws.onopen = () => {
			console.log("WebSocket connected")
			setSocket(ws)
			reconnectAttempts.current = 0
		}

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data)
			if (data.type === "gameUpdate") {
				setGameState((prevState) => ({
					...prevState,
					...data.gameState,
					players: {
						...prevState.players,
						...data.gameState.players,
					},
				}))
			}
		}

		ws.onerror = (error) => {
			console.error("WebSocket error:", error)
		}

		ws.onclose = () => {
			console.log("WebSocket disconnected")
			setSocket(null)

			if (reconnectAttempts.current < maxReconnectAttempts) {
				reconnectAttempts.current++
				setTimeout(connectWebSocket, 3000)
			} else {
				setError("WebSocket connection lost. Please refresh the page.")
			}
		}

		return ws
	}, [gameId])

	const handleCardClick = useCallback(
		(index) => {
			console.log("Card clicked:", index)
			console.log("Current game state:", gameState)
			console.log("Local player:", localPlayer)

			if (!gameState || !localPlayer) return
			if (!isSinglePlayer && gameState.currentPlayer !== localPlayer)
				return
			if (gameState.cardFlipped[index]) return

			const newFlippedCards = [...flippedCards, index]
			setFlippedCards(newFlippedCards)

			const newCardFlipped = [...gameState.cardFlipped]
			newCardFlipped[index] = true

			const updatedGameState = {
				...gameState,
				cardFlipped: newCardFlipped,
			}

			if (newFlippedCards.length === 2) {
				const [firstCard, secondCard] = newFlippedCards
				if (
					gameState.cardDeck[firstCard].species ===
					gameState.cardDeck[secondCard].species
				) {
					// Match found
					updatedGameState.players[localPlayer].points += 1
					// Don't change turn on a match
				} else {
					// No match, flip cards back after a delay
					setTimeout(() => {
						setGameState((prevState) => {
							const resetCardFlipped = [...prevState.cardFlipped]
							resetCardFlipped[firstCard] = false
							resetCardFlipped[secondCard] = false
							const newState = {
								...prevState,
								cardFlipped: resetCardFlipped,
								currentPlayer:
									localPlayer === "player1"
										? "player2"
										: "player1",
							}

							// Send update to other player
							if (
								!isSinglePlayer &&
								socket &&
								socket.readyState === WebSocket.OPEN
							) {
								socket.send(
									JSON.stringify({
										action: "updateGame",
										gameId: gameId,
										gameState: newState,
									})
								)
							}

							return newState
						})
						setFlippedCards([])
					}, CARD_FLIP_DELAY)
				}
				if (
					!isSinglePlayer &&
					!updatedGameState.players[localPlayer].points
				) {
					updatedGameState.currentPlayer =
						localPlayer === "player1" ? "player2" : "player1"
				}
				setFlippedCards([])
			}

			setGameState(updatedGameState)

			if (
				!isSinglePlayer &&
				socket &&
				socket.readyState === WebSocket.OPEN
			) {
				console.log("Sending update via WebSocket")
				socket.send(
					JSON.stringify({
						action: "updateGame",
						gameId: gameId,
						gameState: updatedGameState,
					})
				)
			}
		},
		[gameState, localPlayer, socket, gameId, flippedCards, isSinglePlayer]
	)

	useEffect(() => {
		fetchGameState()
		const ws = connectWebSocket()

		return () => {
			if (ws) {
				ws.close()
			}
		}
	}, [fetchGameState, connectWebSocket])

	if (error) {
		return (
			<div className="error-message">
				{error}
				<button onClick={() => window.location.reload()}>
					Refresh Page
				</button>
			</div>
		)
	}

	if (!gameState) {
		return <div>Loading... (GameId: {gameId})</div>
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
				<div className="game-info">
					<p>Game ID: {gameId}</p>
					<p>Your Name: {state?.playerName}</p>
					{isSinglePlayer ? (
						<p>Points: {gameState.players?.player1?.points || 0}</p>
					) : (
						<>
							<p>
								You are:{" "}
								{localPlayer === "player1"
									? "Player 1"
									: localPlayer === "player2"
									? "Player 2"
									: "Spectator"}
							</p>
							<p>
								Player 1:{" "}
								{gameState.players?.player1?.name || "Unknown"}{" "}
								(Points:{" "}
								{gameState.players?.player1?.points || 0})
							</p>
							<p>
								Player 2:{" "}
								{gameState.players?.player2?.name ||
									"Waiting for player 2"}{" "}
								(Points:{" "}
								{gameState.players?.player2?.points || 0})
							</p>
							<p>
								Current Turn:{" "}
								{gameState.currentPlayer === localPlayer
									? "Your Turn"
									: "Opponent's Turn"}
							</p>
							<p>
								Connection Status:{" "}
								{socket ? "Connected" : "Disconnected"}
							</p>
						</>
					)}
				</div>
			</div>
		</>
	)
}

export default Game
