// dev-server.ts
//
// Purpose: Development server with auto-rebuild and live reload
//
// This module:
// - Serves static files from project root
// - Watches src/ts/ and index.html for changes
// - Rebuilds TypeScript on source changes
// - Pushes live-reload to connected browsers via SSE

import { watch } from "node:fs";

function tryPort(start: number, maxTries = 20): number {
	for (let p = start; p < start + maxTries; p++) {
		try {
			const test = Bun.serve({
				port: p,
				fetch: () => new Response("ok"),
			});
			test.stop();
			return p;
		} catch {}
	}
	throw new Error(`No free port in range ${start}–${start + maxTries - 1}`);
}

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const encoder = new TextEncoder();

function notifyReload() {
	const msg = encoder.encode("data: reload\n\n");
	for (const ctrl of clients) {
		try {
			ctrl.enqueue(msg);
		} catch {
			clients.delete(ctrl);
		}
	}
}

const SSE_PATH = "/__pmd_reload";

function injectLivereload(html: string): string {
	const script = `<script>(()=>{const e=new EventSource("${SSE_PATH}");e.onmessage=()=>location.reload()})()</script>`;
	if (html.includes("</body>")) {
		return html.replace("</body>", `${script}\n</body>`);
	}
	return html + script;
}

async function rebuild(): Promise<boolean> {
	const proc = Bun.spawn(
		["bun", "build", "src/ts/main.ts", "--outdir=dist", "--target=browser"],
		{
			stdout: "pipe",
			stderr: "pipe",
		},
	);
	await proc.exited;
	if (proc.exitCode !== 0) {
		const err = await new Response(proc.stderr).text();
		console.error(`Build failed:\n${err.split("\n").slice(0, 5).join("\n")}`);
		return false;
	}
	console.log("Rebuilt dist/main.js");
	return true;
}

const port = tryPort(parseInt(Bun.env.PORT || "3000", 10));

const server = Bun.serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;

		if (path === SSE_PATH) {
			let ctrl: ReadableStreamDefaultController<Uint8Array> | null = null;
			const stream = new ReadableStream({
				start(c) {
					ctrl = c;
					c.enqueue(encoder.encode(": connected\n\n"));
				},
				cancel() {
					if (ctrl) clients.delete(ctrl);
				},
			});
			if (ctrl) clients.add(ctrl);
			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
			});
		}

		if (path === "/") {
			const file = Bun.file("index.html");
			let html = await file.text();
			html = injectLivereload(html);
			return new Response(html, {
				headers: { "Content-Type": "text/html" },
			});
		}

		if (path === "/dist/main.js") {
			return new Response(Bun.file("dist/main.js"), {
				headers: { "Content-Type": "application/javascript" },
			});
		}

		const file = Bun.file(`.${path}`);
		if (await file.exists()) {
			return new Response(file);
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log(`http://localhost:${server.port}`);

if (typeof watch === "function") {
	watch("src/ts/", { recursive: true }, async (_event, filename) => {
		console.log(`Changed: ${filename}`);
		const ok = await rebuild();
		if (ok) notifyReload();
	});

	watch("index.html", (_event, _filename) => {
		console.log("Changed: index.html");
		notifyReload();
	});
} else {
	console.warn("fs.watch unavailable — auto-rebuild disabled");
}

process.on("SIGINT", () => {
	server.stop();
	process.exit(0);
});
