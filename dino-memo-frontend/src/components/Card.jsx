import "./Card.css"
import cardFront from "../assets/Dinosaur-card-front-image.png"

function Card({ species, image, flipped, onClick }) {
	const images = "https://dino-memory-card-images.s3.eu-north-1.amazonaws.com"
	// console.log("Original image:", image)
	const imageUrl = `${images}/${species}.webp`

	// console.log("Constructed imageUrl:", imageUrl)

	return (
		<>
			<div
				className={`card ${flipped ? "flipped" : ""}`}
				onClick={onClick}
			>
				<div className="card-inner">
					<div className="card-front">
						<img className="card-logo" src={cardFront} />
					</div>
					<div className="card-back">
						<img
							className="card-image"
							src={imageUrl}
							alt={species}
						/>
						<p className="species-text">{species}</p>
					</div>
				</div>
			</div>
		</>
	)
}

export default Card
