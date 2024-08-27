import "./Header.css"

function Header() {
	return (
		<>
			<div className="header">
				<a href="/">
					<img
						className="header-logo"
						src={"../src/assets/header-logo.svg"}
						alt="Header Logo"
					/>
				</a>
			</div>
		</>
	)
}

export default Header
