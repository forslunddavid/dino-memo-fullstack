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
	const CARD_FLIP_DELAY = 5000
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

	useEffect(() => {
		if (gameState && gameState.cardFlipped) {
			const allCardsFlipped = gameState.cardFlipped.every(
				(card) => card === true
			)
			if (allCardsFlipped) {
				console.log("Game completed - checking winner")
				const player1Points = gameState.players.player1?.points || 0
				const player2Points = gameState.players.player2?.points || 0
				const player1Name = gameState.players.player1?.name
				const player2Name = gameState.players.player2?.name

				console.log(
					`Final points - ${player1Name}: ${player1Points}, ${player2Name}: ${player2Points}`
				)

				let winnerName
				if (player1Points > player2Points) {
					winnerName = player1Name
				} else if (player2Points > player1Points) {
					winnerName = player2Name
				} else {
					winnerName = null // For ties
				}

				setWinner(winnerName)
				setShowEndGamePopup(true)
			}
		}
	}, [gameState])

	// WebSocket message handler useEffect
	useEffect(() => {
		console.log("Setting up WebSocket message handler")
		if (socket) {
			socket.onmessage = (event) => {
				const data = JSON.parse(event.data)
				console.log("Received WebSocket message:", data)

				if (data.type === "gameUpdate") {
					setGameState((prevState) => ({
						...prevState,
						...data.gameState,
						players: {
							...prevState?.players,
							...data.gameState.players,
						},
					}))
				}
			}
		}
	}, [socket])

	// Initial setup useEffect
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

	const handleCardClick = useCallback(
		(index) => {
			console.log("Card clicked:", index)
			console.log("Current game state:", gameState)
			console.log("Local player:", localPlayer)
			console.log("Current flipped cards:", flippedCards)

			// Basic checks
			if (!gameState || !localPlayer || !isClickable) return
			if (!isSinglePlayer && gameState.currentPlayer !== localPlayer)
				return
			if (gameState.cardFlipped[index]) return
			if (flippedCards.includes(index)) return

			const processGameState = (updatedState) => {
				setGameState(updatedState)
				if (
					!isSinglePlayer &&
					socket &&
					socket.readyState === WebSocket.OPEN
				) {
					socket.send(
						JSON.stringify({
							action: "updateGame",
							gameId: gameId,
							gameState: updatedState,
						})
					)
				}
			}

			// Update flipped cards array
			const newFlippedCards = [...flippedCards, index]
			setFlippedCards(newFlippedCards)

			// Update game state with new flipped card
			const newCardFlipped = [...gameState.cardFlipped]
			newCardFlipped[index] = true

			let updatedGameState = {
				...gameState,
				cardFlipped: newCardFlipped,
			}

			// If this is the second card
			if (newFlippedCards.length === 2) {
				const [firstCard, secondCard] = newFlippedCards
				const isMatch =
					gameState.cardDeck[firstCard].species ===
					gameState.cardDeck[secondCard].species

				if (isMatch) {
					updatedGameState = {
						...updatedGameState,
						players: {
							...updatedGameState.players,
							[localPlayer]: {
								...updatedGameState.players[localPlayer],
								points:
									(updatedGameState.players[localPlayer]
										.points || 0) + 1,
							},
						},
					}

					setFlippedCards([])
					processGameState(updatedGameState)
				} else {
					processGameState(updatedGameState)
					setTimeout(() => {
						const noMatchState = {
							...gameState,
							cardFlipped: gameState.cardFlipped.map((val, idx) =>
								idx === firstCard || idx === secondCard
									? false
									: val
							),
							currentPlayer:
								localPlayer === "player1"
									? "player2"
									: "player1",
						}

						setFlippedCards([])
						processGameState(noMatchState)
					}, CARD_FLIP_DELAY)
				}
			} else {
				processGameState(updatedGameState)
			}
		},
		[
			gameState,
			localPlayer,
			socket,
			gameId,
			flippedCards,
			isSinglePlayer,
			isClickable,
		]
	)

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
					{console.log("Full gameState:", gameState)}
					{console.log("cardDeck:", gameState.cardDeck)}
					{gameState.cardDeck.map((card, index) => (
						<Card
							key={index}
							flipped={gameState.cardFlipped[index]}
							onClick={() =>
								isClickable && handleCardClick(index)
							}
							species={card.species}
							image={card.imageUrl}
						/>
					))}
				</div>
				<div className="game-info">
					<p>Game ID: {gameId}</p>
					{isSinglePlayer ? (
						<p>Points: {gameState.players?.player1?.points || 0}</p>
					) : (
						<>
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
