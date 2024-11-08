const AWS = require("aws-sdk")
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Credentials": true,
}

const respond = (statusCode, body) => {
	return {
		statusCode,
		headers,
		body: JSON.stringify(body),
	}
}

const sendMessageToClient = async (connectionId, payload) => {
	const apigwManagementApi = new AWS.ApiGatewayManagementApi({
		apiVersion: "2018-11-29",
		endpoint: process.env.WEBSOCKET_ENDPOINT,
	})

	try {
		await apigwManagementApi
			.postToConnection({
				ConnectionId: connectionId,
				Data: JSON.stringify(payload),
			})
			.promise()
	} catch (error) {
		console.error("Error sending message to client:", error)
		if (error.statusCode === 410) {
			console.log("Stale connection, deleting:", connectionId)
			await dynamoDb
				.delete({
					TableName: process.env.CONNECTIONS_TABLE,
					Key: { connectionId },
				})
				.promise()
		}
	}
}

// WebSocket handlers
exports.websocketConnect = async (event) => {
	const connectionId = event.requestContext.connectionId
	const gameId = event.queryStringParameters.gameId

	await dynamoDb
		.put({
			TableName: process.env.CONNECTIONS_TABLE,
			Item: {
				connectionId,
				gameId,
			},
		})
		.promise()

	return { statusCode: 200, body: "Connected." }
}

exports.websocketDisconnect = async (event) => {
	const connectionId = event.requestContext.connectionId

	await dynamoDb
		.delete({
			TableName: process.env.CONNECTIONS_TABLE,
			Key: {
				connectionId,
			},
		})
		.promise()

	return { statusCode: 200, body: "Disconnected." }
}

exports.websocketDefault = async (event) => {
	const connectionId = event.requestContext.connectionId
	const body = JSON.parse(event.body)

	if (body.action === "updateGame") {
		const { gameId, gameState } = body

		// Update the game state in DynamoDB
		await dynamoDb
			.update({
				TableName: process.env.GAMES_TABLE,
				Key: { gameId },
				UpdateExpression:
					"SET cardFlipped = :cf, currentPlayer = :cp, players = :p",
				ExpressionAttributeValues: {
					":cf": gameState.cardFlipped,
					":cp": gameState.currentPlayer,
					":p": gameState.players,
				},
			})
			.promise()

		// Get all connections for this game
		const connections = await dynamoDb
			.query({
				TableName: process.env.CONNECTIONS_TABLE,
				IndexName: "GameIdIndex",
				KeyConditionExpression: "gameId = :gameId",
				ExpressionAttributeValues: {
					":gameId": gameId,
				},
			})
			.promise()

		// Send the updated game state to all connected clients
		const apigwManagementApi = new AWS.ApiGatewayManagementApi({
			apiVersion: "2018-11-29",
			endpoint: process.env.WEBSOCKET_ENDPOINT,
		})

		const postCalls = connections.Items.map(async ({ connectionId }) => {
			try {
				await apigwManagementApi
					.postToConnection({
						ConnectionId: connectionId,
						Data: JSON.stringify({
							type: "gameUpdate",
							gameState,
							players: gameState.players,
						}),
					})
					.promise()
			} catch (e) {
				if (e.statusCode === 410) {
					console.log(
						`Found stale connection, deleting ${connectionId}`
					)
					await dynamoDb
						.delete({
							TableName: process.env.CONNECTIONS_TABLE,
							Key: { connectionId },
						})
						.promise()
				} else {
					throw e
				}
			}
		})

		try {
			await Promise.all(postCalls)
		} catch (e) {
			console.error("Error sending updates to clients:", e)
			return {
				statusCode: 500,
				body: JSON.stringify({ error: "Failed to update all clients" }),
			}
		}
	}

	return { statusCode: 200, body: "Message received." }
}

module.exports.createGame = async (event) => {
	const { player1Name, isSinglePlayer } = JSON.parse(event.body)
	console.log(
		"Creating game for player:",
		player1Name,
		"Single player:",
		isSinglePlayer
	)
	const gameId = Math.random().toString(36).substring(2, 8)

	// Fetch dinosaurs
	const dinosaursParams = {
		TableName: process.env.DINOSAURS_TABLE,
	}
	const dinosaursResult = await dynamoDb.scan(dinosaursParams).promise()
	const dinosaurs = dinosaursResult.Items

	// Create card deck
	const shuffledDinosaurs = shuffleArray([...dinosaurs])
	const selectedCards = shuffledDinosaurs.slice(0, 12)
	const cardDeck = shuffleArray([...selectedCards, ...selectedCards])

	const gameData = {
		gameId: gameId,
		cardDeck: cardDeck,
		cardFlipped: Array(cardDeck.length).fill(false),
		players: {
			player1: { name: player1Name, points: 0 },
			player2: isSinglePlayer ? null : { name: null, points: 0 },
		},
		currentPlayer: "player1",
		isSinglePlayer: isSinglePlayer,
	}

	const params = {
		TableName: process.env.GAMES_TABLE,
		Item: gameData,
	}

	try {
		await dynamoDb.put(params).promise()
		console.log(
			"Game created successfully:",
			JSON.stringify(gameData, null, 2)
		)
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ gameId: gameId, gameState: gameData }),
		}
	} catch (error) {
		console.log("Error in createGame:", error)
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({
				error: "Could not create game",
				details: error.message,
			}),
		}
	}
}

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array
}

module.exports.getGame = async (event) => {
	const { gameId } = event.pathParameters

	const params = {
		TableName: process.env.GAMES_TABLE,
		Key: { gameId },
	}

	try {
		const result = await dynamoDb.get(params).promise()

		if (!result.Item) {
			return {
				statusCode: 404,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Credentials": true,
				},
				body: JSON.stringify({ error: "Game not found" }),
			}
		}

		// Ensure the game state has the correct structure
		const gameState = {
			cardFlipped: result.Item.cardFlipped || [],
			cardDeck: result.Item.cardDeck || [],
			players: {
				player1: result.Item.players.player1 || { name: "", points: 0 },
				player2: result.Item.players.player2 || { name: "", points: 0 },
			},
			currentPlayer: result.Item.currentPlayer || "player1",
			gameId: result.Item.gameId,
		}

		console.log("Game state retrieved:", JSON.stringify(gameState, null, 2))

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify(gameState),
		}
	} catch (error) {
		console.error("Error in getGame:", error)
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ error: "Could not retrieve game" }),
		}
	}
}

module.exports.updateGame = async (event) => {
	try {
		const { gameId } = event.pathParameters
		const updateData = JSON.parse(event.body)

		// Fetch the current game state
		const currentGameState = await dynamoDb
			.get({
				TableName: process.env.GAMES_TABLE,
				Key: { gameId },
			})
			.promise()

		if (!currentGameState.Item) {
			return respond(404, { error: "Game not found" })
		}

		let updateExpression = "set"
		let expressionAttributeValues = {}
		let expressionAttributeNames = {}

		if (updateData.cardFlipped !== undefined) {
			updateExpression += " #cf = :cf,"
			expressionAttributeValues[":cf"] = updateData.cardFlipped
			expressionAttributeNames["#cf"] = "cardFlipped"
		}
		if (updateData.currentPlayer !== undefined) {
			updateExpression += " #cp = :cp,"
			expressionAttributeValues[":cp"] = updateData.currentPlayer
			expressionAttributeNames["#cp"] = "currentPlayer"
		}
		if (updateData.players !== undefined) {
			updateExpression += " #p = :p,"
			expressionAttributeValues[":p"] = {
				...currentGameState.Item.players,
				...updateData.players,
			}
			expressionAttributeNames["#p"] = "players"
		}

		updateExpression = updateExpression.slice(0, -1)

		const params = {
			TableName: process.env.GAMES_TABLE,
			Key: { gameId },
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: expressionAttributeValues,
			ExpressionAttributeNames: expressionAttributeNames,
			ReturnValues: "ALL_NEW",
		}

		const result = await dynamoDb.update(params).promise()

		await sendGameUpdate(gameId, result.Attributes)

		return respond(200, result.Attributes)
	} catch (error) {
		console.error("Error in updateGame:", error)
		return respond(500, {
			error: "Internal server error",
			details: error.message,
		})
	}
}

module.exports.joinGame = async (event) => {
	const { gameId } = event.pathParameters
	const { player2Name } = JSON.parse(event.body)

	console.log(`Joining game ${gameId} with player name ${player2Name}`)

	try {
		// First get current game state
		const result = await dynamoDb
			.get({
				TableName: process.env.GAMES_TABLE,
				Key: { gameId },
			})
			.promise()

		if (!result.Item) {
			return {
				statusCode: 404,
				headers,
				body: JSON.stringify({ error: "Game not found" }),
			}
		}

		// Update the game state with player 2
		const updatedGameState = {
			...result.Item,
			players: {
				...result.Item.players,
				player2: {
					name: player2Name,
					points: 0,
				},
			},
		}

		// Put the entire updated state back
		await dynamoDb
			.put({
				TableName: process.env.GAMES_TABLE,
				Item: updatedGameState,
			})
			.promise()

		// Get all connections to notify them
		const connections = await dynamoDb
			.query({
				TableName: process.env.CONNECTIONS_TABLE,
				IndexName: "GameIdIndex",
				KeyConditionExpression: "gameId = :gameId",
				ExpressionAttributeValues: {
					":gameId": gameId,
				},
			})
			.promise()

		// Notify all connected clients
		const apigwManagementApi = new AWS.ApiGatewayManagementApi({
			apiVersion: "2018-11-29",
			endpoint: process.env.WEBSOCKET_ENDPOINT,
		})

		await Promise.all(
			connections.Items.map(({ connectionId }) =>
				apigwManagementApi
					.postToConnection({
						ConnectionId: connectionId,
						Data: JSON.stringify({
							type: "gameUpdate",
							gameState: updatedGameState,
						}),
					})
					.promise()
					.catch((e) => {
						if (e.statusCode === 410) {
							return dynamoDb
								.delete({
									TableName: process.env.CONNECTIONS_TABLE,
									Key: { connectionId },
								})
								.promise()
						}
						throw e
					})
			)
		)

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify(updatedGameState),
		}
	} catch (error) {
		console.error("Error joining game:", error)
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: "Could not join game",
				details: error.message,
			}),
		}
	}
}

module.exports.options = async (event) => {
	return respond(200, {})
}

// Helper functions
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array
}

async function sendGameUpdate(gameId, gameState) {
	const connections = await dynamoDb
		.query({
			TableName: process.env.CONNECTIONS_TABLE,
			IndexName: "GameIdIndex",
			KeyConditionExpression: "gameId = :gameId",
			ExpressionAttributeValues: {
				":gameId": gameId,
			},
		})
		.promise()

	const apigwManagementApi = new AWS.ApiGatewayManagementApi({
		apiVersion: "2018-11-29",
		endpoint: process.env.WEBSOCKET_ENDPOINT,
	})

	const postCalls = connections.Items.map(async ({ connectionId }) => {
		try {
			await apigwManagementApi
				.postToConnection({
					ConnectionId: connectionId,
					Data: JSON.stringify(gameState),
				})
				.promise()
		} catch (e) {
			if (e.statusCode === 410) {
				console.log(`Found stale connection, deleting ${connectionId}`)
				await dynamoDb
					.delete({
						TableName: process.env.CONNECTIONS_TABLE,
						Key: { connectionId },
					})
					.promise()
			} else {
				throw e
			}
		}
	})

	await Promise.all(postCalls)
}

module.exports.test = async (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify({ message: "Hello from Lambda!" }),
	}
}
