import { copyFile } from "node:fs/promises";

await copyFile("src/main.js", "main.js");
console.log("Built main.js from src/main.js");
