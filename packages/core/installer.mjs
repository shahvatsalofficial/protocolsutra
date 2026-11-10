import {stat,lstat,mkdir,readdir,readFile,writeFile,realpath} from 'node:fs/promises';
import {join,resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const hostPaths={claude:'.claude/skills',cursor:'.cursor/skills',codex:'.agents/skills',gemini:'.gemini/skills',copilot:'.github/skills',generic:'.agents/skills'};
// Refuse symlinks anywhere BELOW the (realpath-resolved) project root. OS-level aliases above the root
// (for example macOS /var -> /private/var) are the user's own choice of target and are resolved first.
async function safeDir(destination,root){
 let current=resolve(destination);const parts=[];
 while(true){const rel=relative(root,current);if(rel===''||rel.startsWith('..')||isAbsolute(rel))break;parts.push(current);const parent=dirname(current);if(parent===current)break;current=parent;}
 for(const p of parts){try{if((await lstat(p)).isSymbolicLink())throw new Error(`Refusing to write through symlink: ${p}`);}catch(error){if(error?.code!=='ENOENT')throw error;}}
 await mkdir(destination,{recursive:true});
}
export async function installSkills({host='generic',target='.',force=false}){
 const subdir=hostPaths[host];if(!subdir)throw new Error(`Unsupported host ${host}; use ${Object.keys(hostPaths).join(', ')}`);
 await mkdir(resolve(target),{recursive:true});const root=await realpath(resolve(target)),skillDir=join(base,'skills');const dest=join(root,subdir);await safeDir(dest,root);
 const skillNames=(await readdir(skillDir,{withFileTypes:true})).filter(d=>d.isDirectory()).map(d=>d.name).sort();
 const installed=[],skipped=[];
 for(const name of skillNames){
  const source=join(skillDir,name,'SKILL.md');
  try{await stat(source)}catch{continue;}
  const outputDir=join(dest,name),output=join(outputDir,'SKILL.md');
  await safeDir(outputDir,root);
  let exists=false;try{await lstat(output);exists=true}catch(e){if(e.code!=='ENOENT')throw e;}
  if(exists&&!force){skipped.push(name);continue;}
  if(exists&&(await lstat(output)).isSymbolicLink())throw new Error(`Refusing symlink target: ${output}`);
  await writeFile(output,await readFile(source));installed.push(name);
 }
 return {host,projectRoot:root,skillsPath:dest,installed,skipped,notes:'Files copied locally; this does not confirm IDE skill activation or host support.'};
}
