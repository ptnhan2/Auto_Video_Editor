			const jsonUrl = `${window.location.origin}/api/opencut/json/${episodeId}`;
			window.open(`http://localhost:3001/editor/new?import=${encodeURIComponent(jsonUrl)}`, "_blank");