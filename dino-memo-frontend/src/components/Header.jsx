import React from "react"
import "./Header.css"

function Header() {
	return (
		<>
			<div className="header">
				<img
					className="header-logo"
					src={"../src/assets/header-logo.svg"}
					alt="Header Logo"
				/>
			</div>
		</>
	)
}

export default Header
