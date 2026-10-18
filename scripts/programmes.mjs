#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {getDb} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {reads,read,insert,resolve,transaction,workflow,programmeDetails,exportData,saveArtifact,draft} from './lib/domain.mjs';
import {importSalesforce} from './lib/import.mjs';
export const workflows=['complete-session','record-report','void-delivery','close-enrolment','review-participant','review-programme','retain-delivery'];
const args=process.argv.slice(2),pos=[],flags={};
function output(value){
 if(flags.json)console.log(JSON.stringify(value,null,2));
 else if(Array.isArray(value)){if(value[0]?.question){for(const q of value){console.log('\n'+q.question);output(q.rows);}}else console.log(table(value,Object.keys(value[0]||{}).map(key=>({key,label:key.replaceAll('_',' ')}))));}
 else for(const [key,v]of Object.entries(value)){if(Array.isArray(v)){console.log('\n'+key);output(v);}else console.log(key+': '+(typeof v==='object'?JSON.stringify(v):v));}
}
let db;
try{
 for(const a of args){if(a.startsWith('--')){const [k,...v]=a.slice(2).split('=');if(Object.hasOwn(flags,k))throw Error('Repeated flag '+k);flags[k]=v.length?v.join('='):true;}else pos.push(a);}
 const [cmd,...rest]=pos;
 const allowed={add:['file','actor'],log:['text','date','actor'],import:['mapping','dry-run','actor'],...Object.fromEntries(workflows.map(c=>[c,['evidence','actor',...(c==='review-programme'?['next']:c==='retain-delivery'?['until']:[])]]))};
 for(const key of Object.keys(flags))if(!['json',...(allowed[cmd]||[])].includes(key))throw Error('Unknown flag --'+key+' for '+cmd);
 for(const [k,v]of Object.entries(flags))if(['json','dry-run'].includes(k)?v!==true:typeof v!=='string'||!v.trim())throw Error('Invalid value for --'+k);
 const counts={add:1,log:1,import:2,programme:1,participant:1,'draft-funder-report':1,'draft-session-reconciliation':1,...Object.fromEntries(workflows.map(c=>[c,1]))};
 if(rest.length!==(counts[cmd]||0))throw Error('Wrong arguments for '+cmd);
 if(cmd==='help'||!cmd){console.log('programmes: '+[...Object.keys(reads),'weekly-review','insights','programme','participant','add','log',...workflows,'draft-weekly-review','draft-funder-report','draft-session-reconciliation','import salesforce <folder>','export'].join(', '));process.exit(0);}
 db=await getDb();let result;const actor=flags.actor||'operator';
 if(reads[cmd]||['weekly-review','insights'].includes(cmd))result=await read(db,cmd);
 else if(cmd==='programme')result=await programmeDetails(db,rest[0]);
 else if(cmd==='participant'){const p=await resolve(db,'participants',rest[0]);result={participant:p,enrolments:await db.query('select * from enrolments where participant_id=$1 order by source_id',[p.id]),deliveries:await db.query('select d.* from deliveries d join enrolments e on e.id=d.enrolment_id where e.participant_id=$1 order by d.delivered_on',[p.id])};}
 else if(cmd==='add'){if(!flags.file)throw Error('Provide --file=<record.json>');result=await transaction(db,()=>insert(db,rest[0],JSON.parse(readFileSync(flags.file,'utf8'))),actor);}
 else if(workflows.includes(cmd))result=await transaction(db,()=>workflow(db,cmd,rest[0],flags),actor);
 else if(cmd==='log')result=await transaction(db,async()=>insert(db,'notes',{source_id:randomUUID(),programme_id:rest[0],name:'Programme note',recorded_on:flags.date||(await db.query('select current_date::text as d'))[0].d,summary:flags.text,owner:actor}),actor);
 else if(cmd?.startsWith('draft-'))result=await draft(db,cmd.slice(6),rest[0]);
 else if(cmd==='export')result=saveArtifact('exports','programmes',await transaction(db,()=>exportData(db),actor));
 else if(cmd==='import'){if(rest[0]!=='salesforce')throw Error('Supported import: salesforce');result=await importSalesforce(db,rest[1],{dry:!!flags['dry-run'],actor,mapping:flags.mapping?JSON.parse(readFileSync(flags.mapping,'utf8')):{}});}
 else throw Error('Unknown command '+cmd);
 output(result);
}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
