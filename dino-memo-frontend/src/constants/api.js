const API_BASE_URL =
	"https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev"

export async function joinGame(gameId, player2Name) {
	const response = await fetch(`${API_BASE_URL}/game/${gameId}/join`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ player2Name }),
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(errorData.error || "Failed to join game")
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
