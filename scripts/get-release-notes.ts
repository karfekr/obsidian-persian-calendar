import { RELEASE_NOTES } from "../src/constants/releaseNotes/index";
import { writeFileSync } from "fs";

const version = process.env.GITHUB_REF_NAME;
if (!version) {
	console.error("No GITHUB_REF_NAME found");
	process.exit(1);
}

const found = RELEASE_NOTES.find((n) => n.version === version);
if (!found) {
	console.error("No release notes found for version", version);
	process.exit(1);
}

const body = found.changes.en.map((c) => `- ${c}`).join("\n");
writeFileSync("release_body.txt", body, "utf-8");
