import { RELEASE_NOTES } from "../src/constants/releaseNotes/index.ts";
import fs from "fs";

const version = process.env.GITHUB_REF_NAME;

const found = RELEASE_NOTES.find((n) => n.version === version);

if (!found) {
	console.error("No release notes found for version", version);
	process.exit(1);
}

const body = found.changes.en.map((c) => `- ${c}`).join("\n");

fs.writeFileSync("release_body.txt", body);
