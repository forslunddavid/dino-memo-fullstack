import "./Card.css"
function Card({ species, image, flipped, onClick }) {
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
							src="../src/assets/Dinosaur-card-front-image.png"
							alt=""
						/>
					</div>
					<div className="card-back">
						<img className="card-image" src={image} alt={species} />
						<p className="species-text">{species}</p>
					</div>
				</div>
			</div>
		</>
	)
}

export default Card
