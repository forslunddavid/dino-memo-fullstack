const AWS = require("aws-sdk")
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.connect = async (event) => {
	const connectionId = event.requestContext.connectionId

	await dynamoDB
		.put({
			TableName: process.env.CONNECTIONS_TABLE,
			Item: {
				connectionId: connectionId,
				gameId: event.queryStringParameters.gameId,
			},
		})
		.promise()

	return { statusCode: 200, body: "Connected." }
}

module.exports.disconnect = async (event) => {
	const connectionId = event.requestContext.connectionId

	await dynamoDB
		.delete({
			TableName: process.env.CONNECTIONS_TABLE,
			Key: {
				connectionId: connectionId,
			},
		})
		.promise()

	return { statusCode: 200, body: "Disconnected." }
}

module.exports.default = async (event) => {
	// Handle incoming WebSocket messages here
	return { statusCode: 200, body: "Message received." }
}
