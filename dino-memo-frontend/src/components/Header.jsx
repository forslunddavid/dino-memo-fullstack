import "./Header.css"
import headerLogo from "../assets/header-logo.svg"

function Header() {
	return (
		<>
			<div className="header">
				<a href="/">
					<img
						className="header-logo"
						src={headerLogo}
						alt="Header Logo"
					/>
				</a>
			</div>
		</>
	)
}

export default Header
