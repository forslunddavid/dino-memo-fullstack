import "./Card.css"
import cardFront from "../assets/Dinosaur-card-front-image.png"
import PropTypes from "prop-types"

function Card({ species, image, flipped, onClick }) {
	const images = "https://dino-memory-card-images.s3.eu-north-1.amazonaws.com"
	const sanitizedSpecies = species.replace(/\s+/g, "-")
	const imageUrl = `${images}/${sanitizedSpecies}.webp`

	return (
		<>
			<div
				className={`card ${flipped ? "flipped" : ""}`}
				onClick={onClick}
			>
				<div className="card-inner">
					<div className="card-front">
						<img
							className="card-logo"
							src={cardFront}
							alt="playing card"
						/>
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

Card.propTypes = {
	species: PropTypes.string.isRequired,
	image: PropTypes.string.isRequired,
	flipped: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
}

export default Card
