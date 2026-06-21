import { execSync } from "child_process";
import { writeFileSync } from "fs";
import https from "https";
import zlib from "zlib";

const buildId = process.argv[2] || "7d634587-fc13-4f6b-87f7-41586fa93ad6";
const out = execSync(`npx eas-cli build:view ${buildId} --json`, {
  encoding: "utf8",
  cwd: "apps/mobile",
  stdio: ["pipe", "pipe", "pipe"],
});
const data = JSON.parse(out.slice(out.indexOf("{")));
const url = data.logFiles[0];

const buf = await new Promise((resolve, reject) => {
  const chunks = [];
  https
    .get(url, (res) => {
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    })
    .on("error", reject);
});

const log = zlib.brotliDecompressSync(buf).toString("utf8");
writeFileSync("eas-log.txt", log, "utf8");

const lines = log.split("\n").filter(Boolean);
const entries = lines.map((l) => {
  try {
    return JSON.parse(l);
  } catch {
    return { msg: l };
  }
});

const gradle = entries.filter(
  (e) =>
    e.phase === "RUN_GRADLEW" ||
    String(e.msg || "").match(/gradle|FAILURE|What went wrong|BUILD FAILED/i),
);

for (const e of gradle.slice(-80)) {
  const t = e.time ? `[${e.time}] ` : "";
  const p = e.phase ? `(${e.phase}) ` : "";
  console.log(`${t}${p}${e.msg ?? JSON.stringify(e)}`);
}

const failures = entries.filter((e) =>
  String(e.msg || e.level === 50 || e.level === 60).match(
    /FAILURE|failed|error|What went wrong/i,
  ),
);
console.log("\n--- failure lines ---\n");
for (const e of failures.slice(-30)) {
  console.log(e.msg ?? JSON.stringify(e));
}
