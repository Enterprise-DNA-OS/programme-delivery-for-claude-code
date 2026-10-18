import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {seed} from './seed.mjs';
import {read,reads,entities,resolve,insert,transaction,workflow,exportData} from './lib/domain.mjs';
import {parseCsv} from './lib/csv.mjs';
import {importSalesforce} from './lib/import.mjs';
let checks=0;function ok(v,m){assert.ok(v,m);checks++;}function eq(a,b){assert.deepEqual(a,b);checks++;}
async function rejects(fn,re){await assert.rejects(fn,re);checks++;}
const tmp=mkdtempSync(path.join(os.tmpdir(),'programme test '));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=tmp;
let db;
function cli(args,{fail=false,json=true}={}){
 const c=spawnSync(process.execPath,['scripts/programmes.mjs',...args,...(json?['--json']:[])],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});
 if(fail){eq(c.status,1);return c.stderr;}
 if(c.status!==0)throw Error(args.join(' ')+': '+c.stderr);checks++;return json?JSON.parse(c.stdout):c.stdout;
}
try{
 db=await getDb();eq((await migrate(db)).ran.length,1);eq((await migrate(db)).ran.length,0);
 await seed(db);const auditCount=(await db.query('select count(*)::int as n from audit_log'))[0].n;await seed(db);eq((await db.query('select count(*)::int as n from audit_log'))[0].n,auditCount);
 const capacity=await read(db,'benefit-capacity');eq(Number(capacity.find(r=>r.source_id==='ben11').delivered_units),5);eq(Number(capacity.find(r=>r.source_id==='ben11').unplanned_units),130);
 eq((await read(db,'compliance')).filter(r=>r.rule==='ACNC-7Y').length,1);
 for(const q of await read(db,'insights'))ok(q.rows.length>0,q.question);
 eq((await resolve(db,'programmes','cOMMUNITY')).source_id,'pro1');
 eq((await resolve(db,'programmes','00000000-0000-0000-0000-000000000001')).source_id,'pro1');
 await rejects(()=>resolve(db,'participants','Participant'),/Ambiguous.*participants/s);
 await rejects(()=>resolve(db,'programmes','absent'),/No matching/);
 await rejects(()=>transaction(db,()=>insert(db,'programmes',{source_id:'bad',name:'Bad date',jurisdiction:'NZ',owner:'A',review_on:'2026-02-30'})),/real YYYY/);
 const base={source_id:'new-delivery',name:'Test delivery',enrolment_id:'enr31',session_id:'ses41',delivered_on:(await resolve(db,'sessions','ses41')).scheduled_on,units:1,evidence:'Signed register',retain_until:'2036-01-01'};
 await rejects(()=>transaction(db,()=>insert(db,'deliveries',{...base,enrolment_id:'enr34'})),/same programme/);
 await rejects(()=>transaction(db,()=>insert(db,'deliveries',{...base,units:99})),/exceeds session capacity/);
 await rejects(()=>transaction(db,()=>insert(db,'deliveries',{...base,units:-1})),/positive/);
 await rejects(()=>transaction(db,()=>insert(db,'deliveries',{...base,units:'1.234'})),/two decimals/);
 await rejects(()=>transaction(db,()=>insert(db,'deliveries',{...base,evidence:'  '})),/Missing/);
 await rejects(()=>transaction(db,()=>workflow(db,'complete-session','ses42',{evidence:'Not happened'})),/future session/);
 await rejects(()=>transaction(db,()=>workflow(db,'record-report','mil61',{})),/evidence/);
 const mapping=JSON.parse(readFileSync(path.join(REPO_ROOT,'examples/salesforce/mapping.json'),'utf8'));
 const folder=path.join(REPO_ROOT,'examples/salesforce');
 let im=await importSalesforce(db,folder,{mapping,dry:true});eq(im.results.length,8);eq((await db.query("select count(*)::int as n from programmes where source_id='sf-p1'"))[0].n,0);
 im=await importSalesforce(db,folder,{mapping});eq(im.results.reduce((a,r)=>a+r.inserted,0),8);
 im=await importSalesforce(db,folder,{mapping});eq(im.results.reduce((a,r)=>a+r.unchanged,0),8);
 const badDir=path.join(tmp,'bad import');mkdirSync(badDir);
 writeFileSync(path.join(badDir,'programmes.csv'),'source_id,name,jurisdiction,owner,review_on\nrollback,Rollback,NZ,Alex,2027-01-01\n');
 writeFileSync(path.join(badDir,'benefits.csv'),'source_id,name,programme_id,unit,target_units\nbad,Bad,missing,visits,10\n');
 await rejects(()=>importSalesforce(db,badDir),/No matching/);
 eq((await db.query("select count(*)::int as n from programmes where source_id='rollback'"))[0].n,0);
 writeFileSync(path.join(badDir,'programmes.csv'),'source_id,name,jurisdiction,owner,review_on\nsf-p1,Changed,NZ,Alex,2027-01-01\n');
 await rejects(()=>importSalesforce(db,badDir),/changed name/);
 // Deny access for an unrelated database role, including views.
 await db.exec('create role smoke_reader; grant usage on schema public to smoke_reader; set role smoke_reader');
 await rejects(()=>db.query('select * from participants'),/permission denied/);
 await rejects(()=>db.query('select * from v_delivery_ledger'),/permission denied/);
 await db.exec('reset role');
 eq(parseCsv('\ufeffA,B\r\n"x,y","quote ""yes""\nnext"\r\n')[0],{A:'x,y',B:'quote "yes"\nnext'});
 assert.throws(()=>parseCsv('A,A\n1,2'),/unique/);checks++;
 assert.throws(()=>parseCsv('A,B\n1'),/expected/);checks++;
 await db.close();db=null;
 for(const cmd of [...Object.keys(reads),'weekly-review','insights']){const result=cli([cmd]);ok(result,cmd);}
 ok(cli(['help'],{json:false}).includes('benefit-capacity'));
 ok(cli(['attention'],{json:false}).includes('overdue'));
 eq(cli(['programme','cOMMUNITY pantry']).programme.source_id,'pro1');
 eq(cli(['participant','par21']).participant.name,'Participant A');
 ok(cli(['participant','Participant'],{fail:true}).includes('Ambiguous'));
 ok(cli(['bad-command'],{fail:true}).includes('Unknown command'));
 ok(cli(['attention','--nonsense'],{fail:true}).includes('Unknown flag'));
 ok(cli(['attention','extra'],{fail:true}).includes('Wrong arguments'));
 ok(cli(['attention','--json=no'],{fail:true,json:false}).includes('Invalid value'));
 const addfile=path.join(tmp,'delivery.json');writeFileSync(addfile,JSON.stringify(base));eq(cli(['add','deliveries','--file='+addfile,'--actor=smoke']).source_id,'new-delivery');
 eq(cli(['log','pro1','--text=Reconciled the register','--actor=smoke']).summary,'Reconciled the register');
 eq(cli(['complete-session','ses41','--evidence=Signed register reconciled']).status,'completed');
 eq(cli(['record-report','mil61','--evidence=Internal report filed']).status,'completed');
 eq(cli(['void-delivery','new-delivery','--evidence=Duplicate attendance']).status,'void');
 eq(cli(['close-enrolment','enr32','--evidence=Participant finished']).status,'closed');
 eq(cli(['review-participant','par21','--evidence=Checked with participant']).accuracy_evidence,'Checked with participant');
 eq(cli(['review-programme','pro1','--evidence=Board review','--next=2099-01-01']).review_on,'2099-01-01');
 eq(cli(['retain-delivery','del53','--evidence=ACNC record policy','--until=2099-01-01']).retain_until,'2099-01-01');
 ok(cli(['void-delivery','new-delivery','--evidence=Duplicate'],{fail:true}).includes('already void'));
 for(const [cmd,args] of [['draft-weekly-review',[]],['draft-funder-report',['pro1']],['draft-session-reconciliation',['ses41']]]){
  const file=cli([cmd,...args]).file;ok(JSON.parse(readFileSync(file,'utf8')).status.startsWith('DRAFT'));
 }
 const exported=JSON.parse(readFileSync(cli(['export']).file,'utf8'));eq(exported.format,'programme-delivery-v1');ok(exported.audit_log.some(r=>r.actor==='smoke'&&r.after_row));
 eq(cli(['import','salesforce',folder,'--mapping='+path.join(folder,'mapping.json'),'--dry-run']).dry_run,true);
 eq(cli(['import','salesforce',folder,'--mapping='+path.join(folder,'mapping.json')]).results.length,8);
 for(const s of ['view','docs']){const c=spawnSync(process.execPath,['scripts/'+s+'.mjs'],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});eq(c.status,0);}
 ok(readFileSync(path.join(tmp,'views/attention.html'),'utf8').includes('Record checks'));
 ok(readdirSync(path.join(tmp,'docs-out/funder-report')).length>=3);
 const sessionDoc=readFileSync(path.join(tmp,'docs-out/session-register',readdirSync(path.join(tmp,'docs-out/session-register'))[0]),'utf8');ok(sessionDoc.includes('Recorded deliveries'));
 // Rendering treats stored markup as text.
 const {table:htmlTable}=await import('./lib/render.mjs');ok(htmlTable([{name:'<script>alert(1)</script>'}]).includes('&lt;script&gt;'));
 console.log('PASS '+checks+' checks: domain, imports, rollback, access, audit, CLI, documents and views.');
}finally{if(db)await db.close();rmSync(tmp,{recursive:true,force:true});}
