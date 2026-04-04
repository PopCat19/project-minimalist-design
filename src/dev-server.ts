// dev-server.ts
//
// Purpose: Serves the webui with live reload during development
//
// This module:
// - Serves static files from project root
// - Rebuilds TypeScript on request
// - Injects live-reload via SSE

const PORT = parseInt(Bun.env.PORT || "3000", 10);

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;

		if (path === "/") {
			return new Response(Bun.file("index.html"), {
				headers: { "Content-Type": "text/html" },
			});
		}

		if (path === "/dist/main.js") {
			const { $ } = await import("bun");
			await $`bun build src/ts/main.ts --outdir=dist --target=browser`.quiet();
			return new Response(Bun.file("dist/main.js"), {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		if (path.startsWith("/doc/")) {
			const file = Bun.file("." + path);
			if (await file.exists()) {
				return new Response(file, {
					headers: { "Content-Type": "text/plain" },
				});
			}
			return new Response("Not found", { status: 404 });
		}

		const file = Bun.file("." + path);
		if (await file.exists()) {
			return new Response(file);
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log(`Serving at http://localhost:${server.port}`);
