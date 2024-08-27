const AWS = require("aws-sdk")
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Credentials": true,
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT",
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

	await apigwManagementApi
		.postToConnection({
			ConnectionId: connectionId,
			Data: JSON.stringify(payload),
		})
		.promise()
}

// WebSocket handlers
module.exports.websocketConnect = async (event) => {
	console.log("WebSocket Connect:", JSON.stringify(event))
	const connectionId = event.requestContext.connectionId
	console.log("Client connected:", connectionId)

	try {
		await dynamoDb
			.put({
				TableName: process.env.CONNECTIONS_TABLE,
				Item: { connectionId },
			})
			.promise()

		return { statusCode: 200, body: "Connected." }
	} catch (error) {
		console.error("WebSocket Connect Error:", error)
		return { statusCode: 500, body: "Failed to connect." }
	}
}

module.exports.websocketDisconnect = async (event) => {
	console.log("WebSocket Disconnect:", JSON.stringify(event))
	const connectionId = event.requestContext.connectionId
	console.log("Client disconnected:", connectionId)

	try {
		await dynamoDb
			.delete({
				TableName: process.env.CONNECTIONS_TABLE,
				Key: { connectionId },
			})
			.promise()

		return { statusCode: 200, body: "Disconnected." }
	} catch (error) {
		console.error("WebSocket Disconnect Error:", error)
		return { statusCode: 500, body: "Failed to disconnect." }
	}
}

module.exports.websocketDefault = async (event) => {
	console.log("WebSocket Default:", JSON.stringify(event))

	const connectionId = event.requestContext.connectionId
	const body = JSON.parse(event.body)
	const { action, gameId, gameState } = body

	try {
		switch (action) {
			case "joinGame":
				// Store the connection ID with the game ID
				await dynamoDb
					.put({
						TableName: process.env.CONNECTIONS_TABLE,
						Item: {
							connectionId,
							gameId,
						},
					})
					.promise()
				break

			case "updateGame":
				// Update the game state in DynamoDB
				await dynamoDb
					.update({
						TableName: process.env.GAMES_TABLE,
						Key: { gameId },
						UpdateExpression:
							"SET cardFlipped = :cf, players = :p, currentPlayer = :cp",
						ExpressionAttributeValues: {
							":cf": gameState.cardFlipped,
							":p": gameState.players,
							":cp": gameState.currentPlayer,
						},
					})
					.promise()

				// Fetch all connections for this game
				const connectionsResult = await dynamoDb
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
				const updatePromises = connectionsResult.Items.map(
					(connection) =>
						sendMessageToClient(connection.connectionId, {
							type: "gameUpdate",
							gameState,
						})
				)

				await Promise.all(updatePromises)
				break

			default:
				console.log(`Unhandled action: ${action}`)
		}

		return { statusCode: 200, body: "Message processed." }
	} catch (error) {
		console.error("Error:", error)
		return {
			statusCode: 500,
			body: JSON.stringify({ error: "Failed to process message" }),
		}
	}
}

// Existing game handlers
module.exports.createGame = async (event) => {
	console.log(
		"CreateGame function invoked with event:",
		JSON.stringify(event)
	)
	try {
		const { player1Name } = JSON.parse(event.body)
		console.log("Player1Name:", player1Name)

		// Log environment variables
		console.log("GAMES_TABLE:", process.env.GAMES_TABLE)
		console.log("DINOSAURS_TABLE:", process.env.DINOSAURS_TABLE)

		// Fetch dinosaurs
		console.log("Fetching dinosaurs...")
		const dinosaursParams = {
			TableName: process.env.DINOSAURS_TABLE,
		}
		const dinosaursResult = await dynamoDb.scan(dinosaursParams).promise()
		console.log("Dinosaurs fetched:", dinosaursResult.Items.length)

		// Create card deck
		console.log("Creating card deck...")
		const shuffledDinosaurs = shuffleArray([...dinosaursResult.Items])
		const selectedCards = shuffledDinosaurs.slice(0, 12)
		const cardDeck = shuffleArray([...selectedCards, ...selectedCards])

		// Create game
		console.log("Creating game in DynamoDB...")
		const gameId = Math.random().toString(36).substring(2, 8)
		const params = {
			TableName: process.env.GAMES_TABLE,
			Item: {
				gameId: gameId,
				cardDeck: cardDeck,
				cardFlipped: Array(cardDeck.length).fill(false),
				player1: { name: player1Name, points: 0 },
				player2: { name: null, points: 0 },
				currentPlayer: "player1",
			},
		}

		await dynamoDb.put(params).promise()
		console.log("Game created successfully with ID:", gameId)

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ gameId: gameId }),
		}
	} catch (error) {
		console.error("Error in createGame:", error)
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
				player1: result.Item.player1 || { name: "", points: 0 },
				player2: result.Item.player2 || { name: "", points: 0 },
			},
			currentPlayer: result.Item.currentPlayer || "player1",
			gameId: result.Item.gameId,
		}

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify(gameState),
		}
	} catch (error) {
		console.error(error)
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

		let updateExpression = "set"
		let expressionAttributeValues = {}

		if (updateData.cardFlipped !== undefined) {
			updateExpression += " cardFlipped = :c,"
			expressionAttributeValues[":c"] = updateData.cardFlipped
		}
		if (updateData.player1 !== undefined) {
			updateExpression += " player1 = :p1,"
			expressionAttributeValues[":p1"] = updateData.player1
		}
		if (updateData.player2 !== undefined) {
			updateExpression += " player2 = :p2,"
			expressionAttributeValues[":p2"] = updateData.player2
		}
		if (updateData.currentPlayer !== undefined) {
			updateExpression += " currentPlayer = :cp,"
			expressionAttributeValues[":cp"] = updateData.currentPlayer
		}

		updateExpression = updateExpression.slice(0, -1)

		const params = {
			TableName: process.env.GAMES_TABLE,
			Key: { gameId },
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: expressionAttributeValues,
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
	const { name } = JSON.parse(event.body)

	const params = {
		TableName: process.env.GAMES_TABLE,
		Key: { gameId: gameId },
		UpdateExpression: "set player2 = :player2",
		ExpressionAttributeValues: {
			":player2": { name: name, points: 0 },
		},
		ReturnValues: "ALL_NEW",
	}

	try {
		const result = await dynamoDb.update(params).promise()
		await sendGameUpdate(gameId, result.Attributes)
		return respond(200, result.Attributes)
	} catch (error) {
		console.log(error)
		return respond(500, { error: "Could not join game" })
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
