import { readFileSync, writeFileSync } from "fs";

const raw = readFileSync("w3up-client.json", "utf8");
const data = JSON.parse(raw);

const delegations = data.delegations["$map"].map(([cid, value]) => ({
  cid,
  delegation: value
}));

writeFileSync("proofs.json", JSON.stringify(delegations, null, 2));

console.log("✅ proofs.json generato!");
