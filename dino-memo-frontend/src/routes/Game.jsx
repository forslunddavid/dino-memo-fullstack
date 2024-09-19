import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import Card from "../components/Card"
import GameEndPopup from "../components/GameEndPopup"

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
	const CLICK_DELAY = 1000
	const [isLoading, setIsLoading] = useState(true)
	const [showEndGamePopup, setShowEndGamePopup] = useState(false)
	const [winner, setWinner] = useState(null)
	const [isClickable, setIsClickable] = useState(true)

	console.log("Rendering Game component", { isLoading, error, gameState })

	const updatePlayer2Name = useCallback(
		async (playerName) => {
			try {
				const response = await fetch(
					`https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev/game/${gameId}/join`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ player2Name: playerName }),
					}
				)
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}
				const updatedGameState = await response.json()
				setGameState(updatedGameState)
			} catch (e) {
				console.error("Failed to update player2 name:", e)
			}
		},
		[gameId, state]
	)

	const fetchGameState = useCallback(async () => {
		setIsLoading(true)
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
				await updatePlayer2Name(playerName)
			} else {
				console.log("Local player not found in game state")
				setLocalPlayer(null)
			}
		} catch (e) {
			console.error("Failed to fetch game state:", e)
			setError(`Failed to load game. Error: ${e.message}`)
		} finally {
			setIsLoading(false)
		}
	}, [gameId, state, updatePlayer2Name])

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

	const checkGameEnd = useCallback(() => {
		console.log("Checking game end")
		if (!gameState || !gameState.players) {
			console.log("Game state or players not available")
			return false
		}

		const totalCards = gameState.cardDeck.length
		console.log("Total cards:", totalCards)
		const flippedCards = gameState.cardFlipped.filter(Boolean).length
		console.log(
			`Flipped cards: ${flippedCards}, Total cards: ${totalCards}`
		)

		if (flippedCards >= totalCards - 1) {
			console.log("All cards flipped, game end")
			const player1Points = gameState.players.player1?.points || 0
			const player2Points = gameState.players.player2?.points || 0
			console.log(
				`Player 1 points: ${player1Points}, Player 2 points: ${player2Points}`
			)

			if (player1Points > player2Points) {
				setWinner(gameState.players.player1.name)
			} else if (player2Points > player1Points) {
				setWinner(gameState.players.player2.name)
			} else {
				setWinner(null) // It's a tie
			}

			setShowEndGamePopup(true)
			return true
		}

		console.log("Game not ended yet")
		return false
	}, [gameState])

	const handleCardClick = useCallback(
		(index) => {
			console.log("Card clicked:", index)
			console.log("Current game state:", gameState)
			console.log("Local player:", localPlayer)

			if (!gameState || !localPlayer || !isClickable) return
			if (!isSinglePlayer && gameState.currentPlayer !== localPlayer)
				return
			if (gameState.cardFlipped[index]) return

			setIsClickable(false) // Disable clicking

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
						setIsClickable(true) // Re-enable clicking after cards are flipped back
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
			} else {
				// If only one card is flipped, re-enable clicking after the delay
				setTimeout(() => {
					setIsClickable(true)
				}, CLICK_DELAY)
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

			setTimeout(() => {
				checkGameEnd()
			}, 0)
		},
		[
			gameState,
			localPlayer,
			socket,
			gameId,
			flippedCards,
			isSinglePlayer,
			checkGameEnd,
			isClickable,
		]
	)

	useEffect(() => {
		console.log("useEffect triggered")
		fetchGameState()
		const ws = connectWebSocket()

		return () => {
			console.log("Cleaning up effect")
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

	if (isLoading) {
		return (
			<div className="loader-container">
				<div className="loader"></div>
			</div>
		)
	}

	if (!gameState) {
		return <div>No game state available. Please try again.</div>
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
							onClick={() =>
								isClickable && handleCardClick(index)
							}
							species={card.species}
							image={card.image}
						/>
					))}
				</div>
				<div className="game-info">
					<p>Game ID: {gameId}</p>
					{/* <p>Your Name: {state?.playerName}</p> */}
					{isSinglePlayer ? (
						<p>Points: {gameState.players?.player1?.points || 0}</p>
					) : (
						<>
							{/* <p>
								You are:{" "}
								{localPlayer === "player1"
									? "Player 1"
									: localPlayer === "player2"
									? "Player 2"
									: "Spectator"}
							</p> */}
							<p>
								Player 1:{" "}
								{gameState.players?.player1?.name || "Unknown"}{" "}
								Points:{" "}
								{gameState.players?.player1?.points || 0}
							</p>
							<p>
								Player 2:{" "}
								{gameState.players?.player2?.name ||
									"Waiting for player 2"}{" "}
								Points:{" "}
								{gameState.players?.player2?.points || 0}
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
			<>{showEndGamePopup && <GameEndPopup winner={winner} />}</>
		</>
	)
}

export default Game
