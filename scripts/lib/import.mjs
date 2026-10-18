import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {parseCsv} from './csv.mjs';
import {entities,normalise,resolve,insert} from './domain.mjs';
export async function importSalesforce(db,folder,{dry=false,mapping={},actor='import'}={}){
 if(!actor.trim())throw Error('Actor must be nonempty');
 const files=Object.keys(entities).filter(t=>existsSync(path.join(folder,t+'.csv')));if(!files.length)throw Error('No supported CSV files in '+folder);
 const results=[];await db.exec('begin');
 try {
  await db.query("select set_config('app.actor',$1,true)",[actor]);
  for(const t of files){
   const rows=parseCsv(readFileSync(path.join(folder,t+'.csv'),'utf8')),seen=new Set(),ignored=new Set();let inserted=0,unchanged=0;
   for(const [i,row]of rows.entries()){
    const raw={};
    for(const [label,value]of Object.entries(row)){
     const mapped=mapping[t]?.[label]??label;
     if(!entities[t].fields.includes(mapped)){ignored.add(label);continue;}
     if(Object.hasOwn(raw,mapped))throw Error(t+': duplicate mapping for '+mapped);
     raw[mapped]=value;
    }
    const data=normalise(t,raw);
    for(const key of entities[t].required)if(data[key]==null)throw Error(t+' row '+(i+2)+': missing '+key);
    if(seen.has(data.source_id))throw Error(t+': duplicate source ID '+data.source_id);seen.add(data.source_id);
    for(const [col,entity]of Object.entries(entities[t].refs))if(data[col])data[col]=(await resolve(db,entity,data[col])).id;
    const old=(await db.query(`select * from ${t} where source_id=$1 for update`,[data.source_id]))[0];
    if(old){for(const [k,v]of Object.entries(data))if(entities[t].numbers.includes(k) ? Number(old[k])!==Number(v) : String(old[k]??'')!==String(v??''))throw Error(t+' '+data.source_id+' changed '+k+': reconcile before importing');unchanged++;}
    else {await insert(db,t,data);inserted++;}
   }
   results.push({entity:t,rows:rows.length,inserted,unchanged,ignored_columns:[...ignored]});
  }
  await db.exec(dry?'rollback':'commit');return {dry_run:dry,results};
 }catch(e){await db.exec('rollback');throw e;}
}
