// constants/api.js
const API_BASE_URL =
	"https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev"
const WS_URL = "wss://zc8eahv77i.execute-api.eu-north-1.amazonaws.com/dev"

export async function joinGame(gameId, player2Name) {
	const response = await fetch(`${API_BASE_URL}/game/${gameId}/join`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ player2Name }),
	})

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}

export async function createGame(player1Name, isSinglePlayer) {
	const response = await fetch(`${API_BASE_URL}/game`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ player1Name, isSinglePlayer }),
	})

	if (!response.ok) {
		const errorData = await response.text()
		throw new Error(
			`Failed to create game: ${response.status} ${errorData}`
		)
	}

	return response.json()
}

export async function getGameState(gameId) {
	const response = await fetch(`${API_BASE_URL}/game/${gameId}`)

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}

	return response.json()
}

export function createWebSocketConnection(gameId, onMessage, onClose, onError) {
	const ws = new WebSocket(`${WS_URL}?gameId=${gameId}`)

	ws.onopen = () => {
		console.log("WebSocket connected")
	}

	ws.onmessage = onMessage
	ws.onclose = onClose
	ws.onerror = onError

	return ws
}
