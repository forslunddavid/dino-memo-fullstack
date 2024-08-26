const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb")
const { marshall } = require("@aws-sdk/util-dynamodb")

const S3_BUCKET_URL = "https://dino-memory-card-images.s3.amazonaws.com/"

const dynamoDb = new DynamoDBClient({ region: "eu-north-1" })

const dinosaurs = [
	{
		species: "Tyrannosaurus Rex",
		image: S3_BUCKET_URL + "Tyrannosaurus-Rex.webp",
	},
	{ species: "Albertosaurus", image: S3_BUCKET_URL + "Albertosaurus.webp" },
	{ species: "Allosaurus", image: S3_BUCKET_URL + "Allosaurus.webp" },
	{ species: "Ankylosaurus", image: S3_BUCKET_URL + "Ankylosaurus.webp" },
	{ species: "Apatosaurus", image: S3_BUCKET_URL + "Apatosaurus.webp" },
	{ species: "Archaeopteryx", image: S3_BUCKET_URL + "Archaeopteryx.webp" },
	{
		species: "Argentinosaurus",
		image: S3_BUCKET_URL + "Argentinosaurus.webp",
	},
	{ species: "Baryonyx", image: S3_BUCKET_URL + "Baryonyx.webp" },
	{ species: "Brachiosaurus", image: S3_BUCKET_URL + "Brachiosaurus.webp" },
	{ species: "Carnotaurus", image: S3_BUCKET_URL + "Carnotaurus.webp" },
	{ species: "Coelophysis", image: S3_BUCKET_URL + "Coelophysis.webp" },
	{ species: "Compsognathus", image: S3_BUCKET_URL + "Compsognathus.webp" },
	{ species: "Dilophosaurus", image: S3_BUCKET_URL + "Dilophosaurus.webp" },
	{ species: "Diplodocus", image: S3_BUCKET_URL + "Diplodocus.webp" },
	{ species: "Giganotosaurus", image: S3_BUCKET_URL + "Giganotosaurus.webp" },
	{ species: "Iguanodon", image: S3_BUCKET_URL + "Iguanodon.webp" },
	{ species: "Kentrosaurus", image: S3_BUCKET_URL + "Kentrosaurus.webp" },
	{ species: "Megalosaurus", image: S3_BUCKET_URL + "Megalosaurus.webp" },
	{ species: "Oviraptor", image: S3_BUCKET_URL + "Oviraptor.webp" },
	{
		species: "Pachycephalosaurus",
		image: S3_BUCKET_URL + "Pachycephalosaurus.webp",
	},
	{
		species: "Parasaurolophus",
		image: S3_BUCKET_URL + "Parasaurolophus.webp",
	},
	{ species: "Plateosaurus", image: S3_BUCKET_URL + "Plateosaurus.webp" },
	{ species: "Protoceratops", image: S3_BUCKET_URL + "Protoceratops.webp" },
	{ species: "Pteranodon", image: S3_BUCKET_URL + "Pteranodon.webp" },
	{
		species: "Sinosauropteryx",
		image: S3_BUCKET_URL + "Sinosauropteryx.webp",
	},
	{ species: "Spinosaurus", image: S3_BUCKET_URL + "Spinosaurus.webp" },
	{ species: "Stegosaurus", image: S3_BUCKET_URL + "Stegosaurus.webp" },
	{
		species: "Therizinosaurus",
		image: S3_BUCKET_URL + "Therizinosaurus.webp",
	},
	{ species: "Triceratops", image: S3_BUCKET_URL + "Triceratops.webp" },
	{ species: "Velociraptor", image: S3_BUCKET_URL + "Velociraptor.webp" },
]

async function populateDinosaursTable() {
	for (const dino of dinosaurs) {
		const params = {
			TableName: "Dinosaurs",
			Item: marshall(dino),
		}

		try {
			await dynamoDb.send(new PutItemCommand(params))
			console.log(`Added ${dino.species} to the table.`)
		} catch (error) {
			console.error(`Failed to add ${dino.species}:`, error)
		}
	}
}

populateDinosaursTable()

populateDinosaursTable()
