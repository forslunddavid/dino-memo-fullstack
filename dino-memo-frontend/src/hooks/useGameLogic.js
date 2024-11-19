// hooks/useGameLogic.js
import { useState, useCallback, useEffect } from "react"

export const useGameLogic = (
	gameState,
	setGameState,
	localPlayer,
	socket,
	gameId,
	isSinglePlayer
) => {
	const [flippedCards, setFlippedCards] = useState([])
	const [isClickable, setIsClickable] = useState(true)
	const [winner, setWinner] = useState(null)
	const [showEndGamePopup, setShowEndGamePopup] = useState(false)
	const CARD_FLIP_DELAY = 5000

	const processGameState = useCallback(
		(updatedState) => {
			setGameState(updatedState)
			if (!isSinglePlayer && socket?.readyState === WebSocket.OPEN) {
				socket.send(
					JSON.stringify({
						action: "updateGame",
						gameId,
						gameState: updatedState,
					})
				)
			}
		},
		[socket, gameId, isSinglePlayer, setGameState]
	)

	const handleCardClick = useCallback(
		(index) => {
			if (!gameState || !localPlayer || !isClickable) return
			if (!isSinglePlayer && gameState.currentPlayer !== localPlayer)
				return
			if (gameState.cardFlipped[index]) return
			if (flippedCards.includes(index)) return

			const newFlippedCards = [...flippedCards, index]
			setFlippedCards(newFlippedCards)

			const newCardFlipped = [...gameState.cardFlipped]
			newCardFlipped[index] = true

			let updatedGameState = {
				...gameState,
				cardFlipped: newCardFlipped,
			}

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
			processGameState,
		]
	)

	useEffect(() => {
		if (gameState?.cardFlipped) {
			const allCardsFlipped = gameState.cardFlipped.every(
				(card) => card === true
			)
			if (allCardsFlipped) {
				const player1Points = gameState.players.player1?.points || 0
				const player2Points = gameState.players.player2?.points || 0
				const player1Name = gameState.players.player1?.name
				const player2Name = gameState.players.player2?.name

				let winnerName
				if (player1Points > player2Points) winnerName = player1Name
				else if (player2Points > player1Points) winnerName = player2Name
				else winnerName = null

				setWinner(winnerName)
				setShowEndGamePopup(true)
			}
		}
	}, [gameState])

	return {
		handleCardClick,
		isClickable,
		flippedCards,
		winner,
		showEndGamePopup,
		setShowEndGamePopup,
	}
}
