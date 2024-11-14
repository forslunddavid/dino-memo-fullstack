import "./Card.css"
import cardFront from "../assets/Dinosaur-card-front-image.png"
const apiEndpoint =
	"https://2zyyqrsoik.execute-api.eu-north-1.amazonaws.com/dev"
const imageUrl = `${apiEndpoint}/images/${image.split("/").pop()}`

function Card({ species, imageUrl, flipped, onClick }) {
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
