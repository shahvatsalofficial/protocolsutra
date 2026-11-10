import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
export function createReportServer({reportPath,token}){
 if(typeof token!=='string'||token.length<16)throw new Error('Set PROTOCOLSUTRA_TOKEN with at least 16 characters');
 const constantEq=(left,right)=>{const a=Buffer.from(left),b=Buffer.from(right);return a.length===b.length&&timingSafeEqual(a,b)};
 return http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(!constantEq(req.headers.authorization||'',`Bearer ${token}`)){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'unauthorized'}));return;}
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok',scope:'localhost'}));return;}
  if(req.url!=='/report'){res.writeHead(404);res.end();return;}
  try{const content=await readFile(resolve(reportPath),'utf8');const parsed=JSON.parse(content);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(parsed));}
  catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'report not available'}));}
 });
}
