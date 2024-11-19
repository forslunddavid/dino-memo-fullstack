import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import {
	getGameState,
	joinGame,
	createWebSocketConnection,
} from "../constants/api"
import GameBoard from "../components/GameBoard"
import GameInfo from "../components/GameInfo"
import GameEndPopup from "../components/GameEndPopup"
import Loader from "../components/Loader"
import { useGameLogic } from "../hooks/useGameLogic.js"
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
	const isSinglePlayer = state?.isSinglePlayer
	const [isLoading, setIsLoading] = useState(true)

	const { handleCardClick, isClickable, winner, showEndGamePopup } =
		useGameLogic(
			gameState,
			setGameState,
			localPlayer,
			socket,
			gameId,
			isSinglePlayer
		)

	const updatePlayer2Name = useCallback(
		async (playerName) => {
			try {
				const updatedGameState = await joinGame(gameId, playerName)
				setGameState(updatedGameState)
			} catch (e) {
				console.error("Failed to update player2 name:", e)
			}
		},
		[gameId]
	)

	const fetchGameState = useCallback(async () => {
		setIsLoading(true)
		try {
			const data = await getGameState(gameId)
			setGameState(data)

			const playerName = state?.playerName
			if (playerName === data.players?.player1?.name) {
				setLocalPlayer("player1")
			} else if (playerName === data.players?.player2?.name) {
				setLocalPlayer("player2")
			} else if (!data.players?.player2?.name) {
				setLocalPlayer("player2")
				await updatePlayer2Name(playerName)
			} else {
				setLocalPlayer(null)
			}
		} catch (e) {
			setError(`Failed to load game. Error: ${e.message}`)
		} finally {
			setIsLoading(false)
		}
	}, [gameId, state, updatePlayer2Name])

	const connectWebSocket = useCallback(() => {
		const handleMessage = (event) => {
			const data = JSON.parse(event.data)
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

		const handleClose = () => {
			setSocket(null)
			if (reconnectAttempts.current < maxReconnectAttempts) {
				reconnectAttempts.current++
				setTimeout(connectWebSocket, 3000)
			} else {
				setError("WebSocket connection lost. Please refresh the page.")
			}
		}

		const ws = createWebSocketConnection(
			gameId,
			handleMessage,
			handleClose,
			(error) => console.error("WebSocket error:", error)
		)

		setSocket(ws)
		return ws
	}, [gameId])

	useEffect(() => {
		fetchGameState()
		const ws = connectWebSocket()
		return () => ws?.close()
	}, [fetchGameState, connectWebSocket])

	if (error)
		return (
			<div className="error-message">
				{error}
				<button onClick={() => window.location.reload()}>
					Refresh Page
				</button>
			</div>
		)

	if (isLoading) return <Loader />

	if (!gameState) return <div>No game state available. Please try again.</div>

	return (
		<>
			<div
				className="game-bg"
				style={{ backgroundImage: `url(${background})` }}
			>
				<GameBoard
					gameState={gameState}
					handleCardClick={handleCardClick}
					isClickable={isClickable}
				/>
				<GameInfo
					gameId={gameId}
					gameState={gameState}
					isSinglePlayer={isSinglePlayer}
					localPlayer={localPlayer}
					socket={socket}
				/>
			</div>
			{showEndGamePopup && <GameEndPopup winner={winner} />}
		</>
	)
}

export default Game
