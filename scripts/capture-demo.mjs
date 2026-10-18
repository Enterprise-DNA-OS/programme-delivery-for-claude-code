import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {questions} from './lib/domain.mjs';
const temp=mkdtempSync(path.join(os.tmpdir(),'programme-capture-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(temp,'db');
let db;
try{
 db=await getDb();await migrate(db);await seed(db);await db.close();db=null;
 const examples=[['Benefit capacity','Which benefits need more capacity?','benefit-capacity'],['Weekly attention','Which programme work needs attention today?','attention'],['Evidence review','Which retention and accuracy records need checking?','compliance']];
 const screens=examples.map(([title,ask,cmd])=>{const p=spawnSync(process.execPath,['scripts/programmes.mjs',cmd],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr);return {title,ask,command:'npm run programmes -- '+cmd,output:p.stdout.trimEnd()};});
 const result={captured_at:new Date().toISOString(),fixture:'supabase/seed.sql (fictional records)',screens,questions:questions.map(([q])=>q)};
 const file=path.resolve(process.argv[2]||path.join(REPO_ROOT,'docs/demo-output.json'));writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(file);
}finally{if(db)await db.close();rmSync(temp,{recursive:true,force:true});}
