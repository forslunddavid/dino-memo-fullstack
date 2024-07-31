import "./Button.css"

function Button({ onClick, children }) {
	return (
		<button onClick={onClick} className="button">
			<p>{children}</p>
		</button>
	)
}

export default Button
