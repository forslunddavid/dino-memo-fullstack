import Card from "./Card"
const GameBoard = ({ gameState, handleCardClick, isClickable }) => (
	<div className="card-container">
		{gameState.cardDeck.map((card, index) => (
			<Card
				key={index}
				flipped={gameState.cardFlipped[index]}
				onClick={() => isClickable && handleCardClick(index)}
				species={card.species}
				image={card.imageUrl}
			/>
		))}
	</div>
)

export default GameBoard
