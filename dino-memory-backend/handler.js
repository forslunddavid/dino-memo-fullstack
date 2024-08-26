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
	const { player1Name } = JSON.parse(event.body)
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

	const params = {
		TableName: process.env.GAMES_TABLE,
		Item: {
			gameId: gameId,
			cardDeck: cardDeck,
			cardFlipped: Array(cardDeck.length).fill(false),
			player1: { name: player1Name, points: 0 },
			player2: { name: null, points: 0 },
		},
	}

	try {
		await dynamoDb.put(params).promise()
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ gameId: gameId }),
		}
	} catch (error) {
		console.log(error)
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ error: "Could not create game" }),
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
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify(result.Attributes),
		}
	} catch (error) {
		console.log(error)
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": true,
			},
			body: JSON.stringify({ error: "Could not join game" }),
		}
	}
}

// Add this new handler for OPTIONS requests
module.exports.options = async (event) => {
	return respond(200, {})
}
