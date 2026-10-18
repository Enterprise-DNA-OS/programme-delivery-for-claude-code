import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {REPO_ROOT} from './db.mjs';
export const entities=JSON.parse(readFileSync(new URL('./entities.json',import.meta.url),'utf8'));
export const reads={
 'programme-review':`select p.source_id,p.name,p.owner,p.review_on,(select count(*) from enrolments e where e.programme_id=p.id and e.status='active')::int as active_enrolments,(select count(*) from milestones m where m.programme_id=p.id and m.status='open' and m.due_on<current_date)::int as overdue_reports from programmes p where status='active' order by p.name`,
 'benefit-capacity':`select source_id,programme,benefit,unit,target_units,delivered_units,future_capacity_units,greatest(target_units-delivered_units-future_capacity_units,0) as unplanned_units from v_benefit_capacity order by programme,benefit`,
 'session-roster':`select source_id,programme,session,scheduled_on,owner,status,unit,capacity_units,delivered_units,participants from v_session_roster order by scheduled_on,source_id`,
 'delivery-ledger':`select source_id,programme,participant,session,delivered_on,units,unit,status,evidence from v_delivery_ledger order by delivered_on,source_id`,
 'reporting-due':`select m.source_id,p.name as programme,m.name as report,m.owner,m.due_on from milestones m join programmes p on p.id=m.programme_id where m.status='open' order by due_on,m.source_id`,
 'participants':`select source_id,name,status,owner,accuracy_checked_on,retention_review_on from participants order by name`,
 'enrolments':`select e.source_id,p.name as programme,pt.name as participant,e.starts_on,e.ends_on,e.status from enrolments e join programmes p on p.id=e.programme_id join participants pt on pt.id=e.participant_id order by p.name,pt.name`,
 'attention':`select * from v_attention order by due_on,source_id,issue`,
 'compliance':`select * from v_compliance order by rule,source_id`,
 'notes':`select n.source_id,p.name as programme,n.recorded_on,n.summary,n.owner from notes n join programmes p on p.id=n.programme_id order by recorded_on desc,n.source_id`,
 'history':`select entity,record_id,operation,actor,created_at from audit_log order by created_at desc,id limit 100`
};
export const questions=[
 ['Which benefits have a delivery target that future sessions cannot cover?',`select source_id,programme,benefit,unit,target_units-delivered_units-future_capacity_units as gap from v_benefit_capacity where target_units>delivered_units+future_capacity_units order by source_id`],
 ['Which past sessions still need reconciliation?',`select source_id,session,scheduled_on,delivered_units,unit from v_session_roster where status='planned' and scheduled_on<current_date order by source_id`],
 ['Which programmes have overdue reports and unreconciled sessions?',`select p.source_id,p.name from programmes p where exists(select 1 from milestones m where m.programme_id=p.id and m.status='open' and m.due_on<current_date) and exists(select 1 from sessions s join benefits b on b.id=s.benefit_id where b.programme_id=p.id and s.status='planned' and s.scheduled_on<current_date) order by p.source_id`],
 ['Which active participants have no recorded benefit in thirty days?',`select source_id,item as participant from v_attention where issue='No recorded benefit in 30 days' order by source_id`],
 ['Which delivery records need their ACNC retention date reviewed?',`select source_id,finding from v_compliance where rule='ACNC-7Y' order by source_id`],
 ['Which people received benefits after their last accuracy check became stale?',`select distinct p.source_id,p.name from participants p join enrolments e on e.participant_id=p.id join deliveries d on d.enrolment_id=e.id where d.status='delivered' and (p.accuracy_checked_on is null or d.delivered_on>p.accuracy_checked_on+90) order by p.source_id`],
 ['Which past sessions have no recorded deliveries?',`select source_id,session,scheduled_on from v_session_roster where scheduled_on<current_date and status<>'cancelled' and delivered_units=0 order by source_id`],
 ['How many distinct participants received each benefit, without adding unlike units?',`select b.source_id,b.name,b.unit,count(distinct e.participant_id)::int as participants,coalesce(sum(d.units),0) as delivered_units from benefits b left join sessions s on s.benefit_id=b.id left join deliveries d on d.session_id=s.id and d.status='delivered' left join enrolments e on e.id=d.enrolment_id group by b.id order by b.source_id`],
 ['Which closed enrolments still have delivery evidence to retain?',`select e.source_id,p.name as participant,max(d.retain_until) as retain_until from enrolments e join participants p on p.id=e.participant_id join deliveries d on d.enrolment_id=e.id where e.status='closed' and d.retain_until>=current_date group by e.id,p.name order by e.source_id`],
 ['Which staff own both an overdue programme review and an overdue report?',`select distinct p.owner from programmes p join milestones m on m.programme_id=p.id and m.owner=p.owner where p.status='active' and p.review_on<current_date and m.status='open' and m.due_on<current_date order by p.owner`]
];
export async function read(db,command){
 if(reads[command]) return db.query(reads[command]);
 if(command==='weekly-review'){const out={};for(const c of ['programme-review','benefit-capacity','attention'])out[c]=await read(db,c);return out;}
 if(command==='insights'){const out=[];for(const [question,sql] of questions)out.push({question,rows:await db.query(sql)});return out;}
 throw Error('Unknown command '+command);
}
export function normalise(entity,input){
 const s=entities[entity];if(!s)throw Error('Unknown entity '+entity);
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('Record must be an object');
 const out={};for(const [key,value] of Object.entries(input)){
  if(!s.fields.includes(key))throw Error('Unsupported field '+key);
  const v=typeof value==='string'?value.trim():value;
  if(v===null||v===''){out[key]=null;continue;}
  if(s.numbers.includes(key)){if(!/^\d+(\.\d{1,2})?$/.test(String(v))||!Number.isFinite(Number(v))||Number(v)<=0)throw Error(key+' must be positive, with at most two decimals');out[key]=Number(v);continue;}
  if(s.bools.includes(key)){if(!['true','false'].includes(String(v)))throw Error(key+' must be true or false');out[key]=String(v)==='true';continue;}
  if(typeof v!=='string')throw Error(key+' must be text');
  if(s.dates.includes(key)&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw Error(key+' must be a real YYYY-MM-DD date');
  out[key]=v;
 }
 return out;
}
export async function resolve(db,entity,needle,{lock=false}={}){
 if(!entities[entity])throw Error('Unknown entity '+entity);
 if(!needle?.trim())throw Error('Provide a source ID, UUID prefix or name');
 let rows=await db.query(`select * from ${entity} where source_id=$1 or id::text=$1${lock?' for update':''}`,[needle]);
 if(rows.length===1)return rows[0];
 rows=await db.query(`select * from ${entity} where starts_with(lower(id::text),lower($1)) or position(lower($1) in lower(name))>0 order by source_id${lock?' for update':''}`,[needle]);
 if(rows.length!==1)throw Error((rows.length?'Ambiguous':'No matching')+' '+entity+': '+needle+'\n'+rows.map(r=>r.source_id+' | '+r.name+' | '+r.id).join('\n'));
 return rows[0];
}
export async function transaction(db,fn,actor='operator'){
 if(!actor?.trim())throw Error('Actor must be nonempty');
 await db.exec('begin');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const out=await fn();await db.exec('commit');return out;}catch(e){await db.exec('rollback');throw e;}
}
export async function insert(db,entity,input){
 const data=normalise(entity,input),s=entities[entity];
 for(const k of s.required)if(data[k]==null||data[k]==='')throw Error('Missing '+entity+'.'+k);
 for(const [k,t]of Object.entries(s.refs))if(data[k])data[k]=(await resolve(db,t,data[k])).id;
 const keys=Object.keys(data);return(await db.query(`insert into ${entity}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(data)))[0];
}
export async function programmeDetails(db,needle){
 const programme=await resolve(db,'programmes',needle),id=programme.id;
 return {programme,benefits:await db.query('select * from benefits where programme_id=$1 order by source_id',[id]),enrolments:await db.query('select * from enrolments where programme_id=$1 order by source_id',[id]),deliveries:await db.query('select * from v_delivery_ledger where programme_id=$1 order by source_id',[id]),milestones:await db.query('select * from milestones where programme_id=$1 order by source_id',[id]),notes:await db.query('select * from notes where programme_id=$1 order by recorded_on desc',[id])};
}
export async function workflow(db,cmd,needle,flags){
 const date=(await db.query('select current_date::text as date'))[0].date;
 const entity={'complete-session':'sessions','record-report':'milestones','void-delivery':'deliveries','close-enrolment':'enrolments','review-participant':'participants','review-programme':'programmes','retain-delivery':'deliveries'}[cmd];
 const row=await resolve(db,entity,needle,{lock:true});
 const evidence=flags.evidence?.trim();if(!evidence)throw Error('Provide --evidence for the recorded action');
 if(cmd==='complete-session'){
  if(row.status!=='planned')throw Error('Session is not planned');
  return(await db.query("update sessions set status='completed',outcome=$1 where id=$2 returning *",[evidence,row.id]))[0];
 }
 if(cmd==='record-report'){
  if(row.status!=='open')throw Error('Report already completed');
  return(await db.query("update milestones set status='completed',evidence=$1,completed_on=current_date where id=$2 returning *",[evidence,row.id]))[0];
 }
 if(cmd==='void-delivery'){
  if(row.status!=='delivered')throw Error('Delivery already void');
  return(await db.query("update deliveries set status='void',outcome=$1 where id=$2 returning *",[evidence,row.id]))[0];
 }
 if(cmd==='close-enrolment'){
  if(row.status!=='active')throw Error('Enrolment already closed');
  if(row.starts_on>date)throw Error('Enrolment has not started');
  return(await db.query("update enrolments set status='closed',ends_on=current_date,outcome=$1 where id=$2 returning *",[evidence,row.id]))[0];
 }
 if(cmd==='review-participant')return(await db.query('update participants set accuracy_checked_on=current_date,accuracy_evidence=$2 where id=$1 returning *',[row.id,evidence]))[0];
 if(cmd==='review-programme'){
  const next=normalise('programmes',{review_on:flags.next}).review_on;
  if(!next||next<=date)throw Error('Next review must be in the future');
  await insert(db,'notes',{source_id:randomUUID(),name:'Programme review',programme_id:row.id,recorded_on:date,summary:evidence,owner:flags.actor||'operator'});
  return(await db.query('update programmes set review_on=$1 where id=$2 returning *',[next,row.id]))[0];
 }
 if(cmd==='retain-delivery'){
  const next=normalise('deliveries',{retain_until:flags.until}).retain_until;
  if(!next||next<row.retain_until)throw Error('Retention can only be extended');
  return(await db.query('update deliveries set retain_until=$1,outcome=$2 where id=$3 returning *',[next,evidence,row.id]))[0];
 }
}
export async function exportData(db){const out={format:'programme-delivery-v1'};for(const t of [...Object.keys(entities),'audit_log'])out[t]=await db.query(`select * from ${t} order by ${t==='audit_log'?'id':'source_id'}`);return out;}
export function saveArtifact(dir,prefix,data){const folder=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);mkdirSync(folder,{recursive:true});const file=path.join(folder,prefix+'-'+randomUUID()+'.json');writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});return {file};}
export async function draft(db,kind,needle){
 const facts=kind==='weekly-review'?await read(db,'weekly-review'):kind==='funder-report'?await programmeDetails(db,needle):kind==='session-reconciliation'?await resolve(db,'sessions',needle):null;
 if(!facts)throw Error('Unknown draft type');
 return saveArtifact('drafts',kind,{status:'DRAFT: operator review required; nothing sent',generated_at:new Date().toISOString(),facts});
}
