import { readFileSync } from "node:fs";
const source=readFileSync("src/lib/database.types.ts","utf8").trimStart();
if(!source.startsWith("export type Json")) throw new Error("database.types.ts is not raw generated TypeScript");
if(source.startsWith('{"types"') || !source.includes("export type Database")) throw new Error("invalid generated Supabase types");
console.log("Generated Supabase types format OK");
