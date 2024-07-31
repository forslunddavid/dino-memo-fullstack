import { useRouteError } from "react-router-dom"
import "./error-page.css"

export default function ErrorPage() {
	const error = useRouteError()
	console.error(error)

	return (
		<div id="error-page">
			<h1>Oops!</h1>
			<pre className="dino">
				{`
                 __
                / _)  "Oh no..."
       _.----._/ /
      /         /
     / (  |  (  |
    /___|___|___|
            `}
			</pre>
			<p>Sorry, an unexpected error has occurred.</p>
			<p>
				<i>
					{error.status
						? `${error.status} - ${error.statusText}`
						: error.message}
				</i>
			</p>
		</div>
	)
}
