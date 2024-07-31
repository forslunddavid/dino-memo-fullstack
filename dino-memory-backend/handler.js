const AWS = require("aws-sdk")
const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.createGame = async (event) => {
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

	return {
		statusCode: 200,
		body: JSON.stringify({ gameId, ...gameData }),
	}
}

module.exports.getGame = async (event) => {
	const { gameId } = event.pathParameters

	const params = {
		TableName: "Games",
		Key: { gameId },
	}

	const result = await dynamoDb.get(params).promise()

	if (!result.Item) {
		return {
			statusCode: 404,
			body: JSON.stringify({ error: "Game not found" }),
		}
	}

	return {
		statusCode: 200,
		body: JSON.stringify(result.Item),
	}
}

module.exports.updateGame = async (event) => {
	const { gameId } = event.pathParameters
	const { cardFlipped, player1, player2 } = JSON.parse(event.body)

	const params = {
		TableName: "Games",
		Key: { gameId },
		UpdateExpression: "set cardFlipped = :c, player1 = :p1, player2 = :p2",
		ExpressionAttributeValues: {
			":c": cardFlipped,
			":p1": player1,
			":p2": player2,
		},
		ReturnValues: "UPDATED_NEW",
	}

	const result = await dynamoDb.update(params).promise()

	return {
		statusCode: 200,
		body: JSON.stringify(result.Attributes),
	}
}

module.exports.joinGame = async (event) => {
	const { gameId } = event.pathParameters
	const { name } = JSON.parse(event.body)

	const getParams = {
		TableName: "Games",
		Key: { gameId },
	}

	const data = await dynamoDb.get(getParams).promise()
	const game = data.Item

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

	return {
		statusCode: 200,
		body: JSON.stringify(updateData.Attributes),
	}
}
