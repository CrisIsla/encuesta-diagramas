// Serves the survey and receives its answers, so participants send nothing by
// hand. Node 18 or later, no dependencies:
//   node server.js              the survey at http://localhost:3000
//   PORT=8080 node server.js
// Each answer goes to datos/<survey id>/<participant id>.json (or under the
// folder in DATOS). The researcher's page, /admin?clave=…, counts them and
// gives the CSV; its key is SURVEY_KEY, or datos/clave.txt, written on the
// first start and printed below.
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const core = require("./app.js");

const ROOT = __dirname;
const DATA = path.resolve(process.env.DATOS || path.join(ROOT, "datos"));
const PORT = Number(process.env.PORT ?? 3000);
const LIMIT = 2 * 1024 * 1024; // bytes an answer may take
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2",
};
// what participants may fetch: the page and what it loads, nothing else
const PUBLIC = ["/index.html", "/app.js", "/questions.js", "/styles.css", "/img/", "/fonts/"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

fs.mkdirSync(DATA, { recursive: true });
let KEY = process.env.SURVEY_KEY;
if (!KEY) {
  const keyFile = path.join(DATA, "clave.txt");
  if (!fs.existsSync(keyFile)) fs.writeFileSync(keyFile, crypto.randomBytes(9).toString("base64url"), { mode: 0o600 });
  KEY = fs.readFileSync(keyFile, "utf8").trim();
}
const authorized = (key) => typeof key === "string" && key.length === KEY.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(KEY));

const send = (res, status, body, type = "text/plain; charset=utf-8", headers = {}) => {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", ...headers });
  res.end(body);
};
const json = (res, status, value, headers = {}) => send(res, status, JSON.stringify(value), "application/json; charset=utf-8", headers);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > LIMIT) {
        reject(new Error("too large"));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// ------------------------------------------------------------- the answers

const validSession = (s) =>
  Boolean(s) && typeof s === "object" && ID.test(s.survey || "") && ID.test(s.participant || "")
  && Array.isArray(s.steps) && Boolean(s.answers) && typeof s.answers === "object";

/** Writes an answer whole or not at all; a second copy from the same participant replaces the first. */
function saveSession(s) {
  const file = path.join(DATA, s.survey, `${s.participant}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ ...s, receivedAt: new Date().toISOString() }));
  fs.renameSync(tmp, file);
}

/** Every answer received, newest first. */
function sessions() {
  const out = [];
  for (const survey of fs.readdirSync(DATA)) {
    const dir = path.join(DATA, survey);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      try {
        out.push(JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")));
      } catch {
        // a file still being written is left for next time
      }
    }
  }
  return out.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
}
const finished = (list) => list.filter((s) => s.finishedAt);

const rowsOf = (s) => {
  try {
    return core.rowsOf(s);
  } catch {
    return []; // an answer the current app can't read is left out of the CSV, but stays in the JSON
  }
};

// ---------------------------------------------------- the researcher's page

const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function adminPage(list) {
  const done = finished(list).length;
  const pending = list.length - done;
  const minutes = (s) => (s.finishedAt ? ((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60000).toFixed(1) : "–");
  const when = (s) => (s.receivedAt || "").replace("T", " ").slice(0, 16);
  const screen = (s) => `${s.device?.width ?? "?"}×${s.device?.height ?? "?"}${s.device?.touch ? " táctil" : ""}`;
  const rows = list.map((s) => `<tr><td>${escape(s.participant)}</td><td>${escape(s.survey)}</td><td>${escape(when(s))}</td><td>${minutes(s)}</td>`
    + `<td>${s.finishedAt ? "Terminada" : "Incompleta"}</td><td>${escape(screen(s))}</td></tr>`).join("");
  const link = (file) => `/admin/${file}?clave=${encodeURIComponent(KEY)}`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Respuestas recibidas</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<main>
<section class="page narrow wide">
<h1>Respuestas recibidas</h1>
<p><strong>${plural(done, "encuesta terminada", "encuestas terminadas")}</strong>${pending ? ` y ${plural(pending, "incompleta", "incompletas")}` : ""}.</p>
${list.length
    ? `<div class="table-wrap"><table><thead><tr><th>Id</th><th>Encuesta</th><th>Recibida (UTC)</th><th>Minutos</th><th>Estado</th><th>Pantalla</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : "<p>Todavía no llega ninguna.</p>"}
<div class="row">
<a class="button primary" href="${link("respuestas.csv")}">Descargar todo (CSV)</a>
<a class="button" href="${link("respuestas.json")}">Descargar todo (JSON)</a>
</div>
</section>
</main>
</body>
</html>
`;
}

// ------------------------------------------------------------------ routes

function serveFile(req, res, pathname) {
  let file;
  try {
    file = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    return send(res, 404, "No existe");
  }
  const allowed = PUBLIC.some((p) => (p.endsWith("/") ? file.startsWith(p) && !file.slice(p.length).includes("/") : file === p));
  const abs = path.join(ROOT, path.normalize(file));
  if (!allowed || !abs.startsWith(ROOT + path.sep)) return send(res, 404, "No existe");
  fs.stat(abs, (error, stat) => {
    if (error || !stat.isFile()) return send(res, 404, "No existe");
    res.writeHead(200, { "Content-Type": TYPES[path.extname(abs)] || "application/octet-stream", "Content-Length": stat.size, "Cache-Control": "no-cache" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(abs).pipe(res);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;
  if (p === "/api/respuestas") {
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain", CORS);
    if (req.method !== "POST") return send(res, 405, "Solo POST", "text/plain; charset=utf-8", CORS);
    let s;
    try {
      s = JSON.parse(await readBody(req));
    } catch (error) {
      return json(res, error.message === "too large" ? 413 : 400, { ok: false, error: "respuesta inválida" }, CORS);
    }
    if (!validSession(s)) return json(res, 400, { ok: false, error: "respuesta inválida" }, CORS);
    saveSession(s);
    return json(res, 200, { ok: true, n: finished(sessions()).length }, CORS);
  }
  if (p === "/admin" || p.startsWith("/admin/")) {
    if (!authorized(url.searchParams.get("clave"))) return send(res, 403, "Falta la clave: /admin?clave=…");
    const list = sessions();
    const stamp = new Date().toISOString().slice(0, 10);
    if (p === "/admin") return send(res, 200, adminPage(list), "text/html; charset=utf-8");
    if (p === "/admin/respuestas.csv") {
      return send(res, 200, core.toCSV(list.flatMap(rowsOf)), "text/csv; charset=utf-8", { "Content-Disposition": `attachment; filename="respuestas-${stamp}.csv"` });
    }
    if (p === "/admin/respuestas.json") {
      return send(res, 200, JSON.stringify(list, null, 1), "application/json; charset=utf-8", { "Content-Disposition": `attachment; filename="respuestas-${stamp}.json"` });
    }
    return send(res, 404, "No existe");
  }
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Solo GET");
  serveFile(req, res, p);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) send(res, 500, "Error");
  });
});
server.listen(PORT, () => {
  const { port } = server.address();
  console.log(`Encuesta en http://localhost:${port}/ — respuestas en ${DATA}`);
  console.log(`Página del investigador: http://localhost:${port}/admin?clave=${KEY}`);
});
