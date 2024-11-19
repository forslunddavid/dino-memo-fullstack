const PlayerInfo = ({ player, label, waiting = "Unknown" }) => (
	<p>
		{label}: {player?.name || waiting} Points: {player?.points || 0}
	</p>
)

export default PlayerInfo
