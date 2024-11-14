import "./Card.css"
import cardFront from "../assets/Dinosaur-card-front-image.png"
import PropTypes from "prop-types"

function Card({ species, image, flipped, onClick }) {
	const apiEndpoint =
		"https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev"
	const imageUrl = image
		? `${apiEndpoint}/images/${
				image.includes("/") ? image.split("/").pop() : image
		  }`
		: ""

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
Card.propTypes = {
	species: PropTypes.string.isRequired,
	image: PropTypes.string.isRequired,
	flipped: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
}

export default Card
