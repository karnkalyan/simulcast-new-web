import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(), missing=[];let checked=0;
function walk(d){for(const entry of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,entry.name);if(entry.isDirectory())walk(f);else if(/\.tsx?$/.test(entry.name)){const src=fs.readFileSync(f,'utf8');for(const m of src.matchAll(/['"`](\/(?:visuals|brand|media)\/[^'"`]+)['"`]/g)){checked++;if(!fs.existsSync(path.join(root,'public',m[1])))missing.push(`${f}: ${m[1]}`)}}}}
walk(path.join(root,'src'));
if(missing.length){console.error('Missing image assets:\n'+missing.join('\n'));process.exit(1)}
console.log(`Asset paths OK. ${checked} static references verified.`);
