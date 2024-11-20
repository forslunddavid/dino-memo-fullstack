// components/MobileWarning.jsx
import React from "react"
import "./MobileWarning.css"
import { AiOutlineExclamationCircle } from "react-icons/ai"

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
				<AiOutlineExclamationCircle className="warning-icon" />
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
