// dev-server.ts
//
// Purpose: Development server with auto-rebuild and live reload
//
// This module:
// - Serves static files from project root
// - Watches src/ts/ and index.html for changes
// - Rebuilds TypeScript on source changes
// - Pushes live-reload to connected browsers via SSE

import { readdirSync, statSync } from "node:fs";

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
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="1" y="3" width="18" height="12" rx="4" fill="#9B7EB5" opacity="0.5"/><rect x="7" y="8" width="18" height="12" rx="4" fill="#DBBFEC" opacity="0.7"/><rect x="13" y="13" width="18" height="12" rx="4" fill="#FFFFFF"/></svg>`;

function injectLivereload(html: string): string {
	const script = `<script>(()=>{const e=new EventSource("${SSE_PATH}");e.onmessage=()=>location.reload();e.onerror=()=>{setTimeout(()=>{try{e.close()}catch{}},500)}})()</script>`;
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

		if (path === "/favicon.ico" || path === "/favicon.svg") {
			return new Response(FAVICON_SVG, {
				headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
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

// ── Polling-based file watcher (fs.watch broken on Bun/Linux) ──
const WATCH_PATHS = ["src/ts/", "index.html"];
const POLL_MS = 500;

function collectFiles(root: string, files: string[] = []): string[] {
	try {
		for (const entry of readdirSync(root, { withFileTypes: true })) {
			const full = `${root}${entry.name}`;
			if (entry.isDirectory()) {
				collectFiles(`${full}/`, files);
			} else if (entry.isFile()) {
				files.push(full);
			}
		}
	} catch {}
	return files;
}

const mtimes = new Map<string, number>();
for (const p of WATCH_PATHS) {
	if (p.endsWith("/")) {
		for (const f of collectFiles(p)) {
			try { mtimes.set(f, statSync(f).mtimeMs); } catch {}
		}
	} else {
		try { mtimes.set(p, statSync(p).mtimeMs); } catch {}
	}
}

const pollTimer = setInterval(async () => {
	let changed = false;
	let rebuildNeeded = false;

	for (const p of WATCH_PATHS) {
		if (p.endsWith("/")) {
			const files = collectFiles(p);
			// Check new/deleted files too
			const current = new Set(files);
			for (const old of mtimes.keys()) {
				if (old.startsWith(p) && !current.has(old)) {
					mtimes.delete(old);
					changed = true;
					rebuildNeeded = true;
				}
			}
			for (const f of files) {
				try {
					const mtime = statSync(f).mtimeMs;
					if (mtimes.get(f) !== mtime) {
						mtimes.set(f, mtime);
						changed = true;
						rebuildNeeded = true;
						console.log(`Changed: ${f}`);
					}
				} catch {}
			}
		} else {
			try {
				const mtime = statSync(p).mtimeMs;
				if (mtimes.get(p) !== mtime) {
					mtimes.set(p, mtime);
					changed = true;
					console.log(`Changed: ${p}`);
				}
			} catch {}
		}
	}

	if (rebuildNeeded) {
		const ok = await rebuild();
		if (ok) notifyReload();
	} else if (changed) {
		notifyReload();
	}
}, POLL_MS);

process.on("SIGINT", () => {
	clearInterval(pollTimer);
	server.stop();
	process.exit(0);
});

