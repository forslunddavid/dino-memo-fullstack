// components/MobileWarning.jsx
import React from "react"
import "./MobileWarning.css"

function MobileWarning({ isVisible, setShowWarning }) {
	// Changed to take setShowWarning directly
	if (!isVisible) return null

	const handleDismiss = () => {
		localStorage.setItem("hideWarning", "true")
		setShowWarning(false) // Directly set the state to false
	}

	return (
		<div className="mobile-warning" role="alert">
			<div className="mobile-warning-content">
				<svg
					className="warning-icon"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
				</svg>
				<h2>Desktop Recommended</h2>
				<p>
					This game is best experienced on a larger screen. Some
					features may not work correctly on mobile devices.
				</p>
				<button className="warning-button" onClick={handleDismiss}>
					I understand
				</button>
			</div>
		</div>
	)
}

export default MobileWarning
