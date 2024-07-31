import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Start from "./routes/Start"
import JoinGame from "./routes/JoinGame"
import CreateGame from "./routes/CreateGame"
import Game from "./routes/Game"
import ErrorPage from "./error-page"
import Root from "./routes/Root"

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />, // Use Root as the parent component
		errorElement: <ErrorPage />,
		children: [
			{
				path: "",
				element: <Start />,
			},
			{
				path: "join-game",
				element: <JoinGame />,
			},
			{
				path: "create-game",
				element: <CreateGame />,
			},
			{
				path: "game/:gameId",
				element: <Game />,
			},
		],
	},
])

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)
