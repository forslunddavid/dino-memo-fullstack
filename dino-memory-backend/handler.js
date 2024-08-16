const AWS = require("aws-sdk")
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const headers = {
	"Access-Control-Allow-Origin": "*", // Replace with your frontend URL in production
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

module.exports.createGame = async (event) => {
	try {
		const gameId = Math.random().toString(36).substring(2, 8)
		const gameData = {
			gameId,
			cardDeck: [],
			cardFlipped: [],
			player1: { name: null, points: 0 },
			player2: { name: null, points: 0 },
		}

		const params = {
			TableName: "Games",
			Item: gameData,
		}

		await dynamoDb.put(params).promise()

		return respond(200, { gameId, ...gameData })
	} catch (error) {
		console.error(error)
		return respond(500, { error: "Internal server error" })
	}
}

module.exports.getGame = async (event) => {
	try {
		const { gameId } = event.pathParameters

		const params = {
			TableName: "Games",
			Key: { gameId },
		}

		const result = await dynamoDb.get(params).promise()

		if (!result.Item) {
			return respond(404, { error: "Game not found" })
		}

		return respond(200, result.Item)
	} catch (error) {
		console.error(error)
		return respond(500, { error: "Internal server error" })
	}
}

module.exports.updateGame = async (event) => {
	try {
		const { gameId } = event.pathParameters
		const { cardFlipped, player1, player2 } = JSON.parse(event.body)

		const params = {
			TableName: "Games",
			Key: { gameId },
			UpdateExpression:
				"set cardFlipped = :c, player1 = :p1, player2 = :p2",
			ExpressionAttributeValues: {
				":c": cardFlipped,
				":p1": player1,
				":p2": player2,
			},
			ReturnValues: "UPDATED_NEW",
		}

		const result = await dynamoDb.update(params).promise()

		return respond(200, result.Attributes)
	} catch (error) {
		console.error(error)
		return respond(500, { error: "Internal server error" })
	}
}

module.exports.joinGame = async (event) => {
	try {
		const { gameId } = event.pathParameters
		const { name } = JSON.parse(event.body)

		const getParams = {
			TableName: "Games",
			Key: { gameId },
		}

		const data = await dynamoDb.get(getParams).promise()
		const game = data.Item

		if (!game) {
			return respond(404, { error: "Game not found" })
		}

		const params = {
			TableName: "Games",
			Key: { gameId },
			UpdateExpression: "set player1 = :p1, player2 = :p2",
			ExpressionAttributeValues: {
				":p1": game.player1.name ? game.player1 : { name, points: 0 },
				":p2": game.player1.name ? { name, points: 0 } : game.player2,
			},
			ReturnValues: "UPDATED_NEW",
		}

		const updateData = await dynamoDb.update(params).promise()

		return respond(200, updateData.Attributes)
	} catch (error) {
		console.error(error)
		return respond(500, { error: "Internal server error" })
	}
}

// Add this new handler for OPTIONS requests
module.exports.options = async (event) => {
	return respond(200, {})
}
