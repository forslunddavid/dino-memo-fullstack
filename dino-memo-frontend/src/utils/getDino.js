export async function getDino() {
	const baseUrl = "http://"
	const params = new URLSearchParams({})

	try {
		const response = await fetch(`${baseUrl}?${params.toString()}`)
		if (response.ok) {
			const data = await response.json()
			const dinosaurs = data.records.map((taxon) => taxon.name)
			return dinosaurs
		} else {
			console.error("Failed to fetch data")
			return []
		}
	} catch (error) {
		console.error("Error fetching data:", error)
		return []
	}
}
