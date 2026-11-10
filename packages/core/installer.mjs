import {stat,lstat,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const hostPaths={claude:'.claude/skills',cursor:'.cursor/skills',codex:'.agents/skills',gemini:'.gemini/skills',copilot:'.github/skills',generic:'.agents/skills'};
async function safeDir(destination){
 let current=resolve(destination),pathParts=[];
 // Validate existing ancestors, including the destination, to prevent symlinked output locations.
 while(true){pathParts.push(current);let parent=dirname(current);if(parent===current)break;current=parent;}
 for(const p of pathParts){try{if((await lstat(p)).isSymbolicLink())throw new Error(`Refusing to write through symlink: ${p}`);}catch(error){if(error?.code!=='ENOENT')throw error;}}
 await mkdir(destination,{recursive:true});
}
export async function installSkills({host='generic',target='.',force=false}){
 const subdir=hostPaths[host];if(!subdir)throw new Error(`Unsupported host ${host}; use ${Object.keys(hostPaths).join(', ')}`);
 const root=resolve(target),skillDir=join(base,'skills');const dest=join(root,subdir);await safeDir(dest);
 const skillNames=(await readdir(skillDir,{withFileTypes:true})).filter(d=>d.isDirectory()).map(d=>d.name).sort();
 const installed=[],skipped=[];
 for(const name of skillNames){
  const source=join(skillDir,name,'SKILL.md');
  try{await stat(source)}catch{continue;}
  const outputDir=join(dest,name),output=join(outputDir,'SKILL.md');
  await safeDir(outputDir);
  let exists=false;try{await lstat(output);exists=true}catch(e){if(e.code!=='ENOENT')throw e;}
  if(exists&&!force){skipped.push(name);continue;}
  if(exists&&(await lstat(output)).isSymbolicLink())throw new Error(`Refusing symlink target: ${output}`);
  await writeFile(output,await readFile(source));installed.push(name);
 }
 return {host,projectRoot:root,skillsPath:dest,installed,skipped,notes:'Files copied locally; this does not confirm IDE skill activation or host support.'};
}
