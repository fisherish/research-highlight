import { copyFile, readFile } from "node:fs/promises";

const source = new URL("./src/main.js", import.meta.url);
const target = new URL("./main.js", import.meta.url);

const manifest = JSON.parse(await readFile(new URL("./manifest.json", import.meta.url), "utf8"));
if (manifest.id !== "research-highlight-dashboard") {
  throw new Error("Unexpected manifest id");
}

await copyFile(source, target);
console.log(`Built ${manifest.name} ${manifest.version}`);
