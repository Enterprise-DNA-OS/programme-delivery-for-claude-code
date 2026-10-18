create table audit_log(id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, operation text not null, actor text not null, before_row jsonb, after_row jsonb, created_at timestamptz not null default now());
create function record_change() returns trigger language plpgsql as $$ begin
 insert into audit_log(entity,record_id,operation,actor,before_row,after_row) values(TG_TABLE_NAME,new.id,TG_OP,coalesce(nullif(current_setting('app.actor',true),''),'database'),case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new)); return new; end $$;
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create table programmes(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), jurisdiction text not null check(jurisdiction in ('NZ','AU')), acnc_registered boolean not null default false, owner text not null, status text not null default 'active' check(status in ('active','closed')), review_on date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger programmes_touch before update on programmes for each row execute function touch_updated();
create trigger programmes_audit after insert or update on programmes for each row execute function record_change();
alter table programmes enable row level security;
revoke all on programmes from public;
create table benefits(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), programme_id uuid not null references programmes(id), unit text not null, target_units numeric(12,2) not null check(target_units>0), status text not null default 'active' check(status in ('active','closed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger benefits_touch before update on benefits for each row execute function touch_updated();
create trigger benefits_audit after insert or update on benefits for each row execute function record_change();
alter table benefits enable row level security;
revoke all on benefits from public;
create index on benefits(programme_id);
create table participants(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), status text not null default 'active' check(status in ('active','inactive')), accuracy_checked_on date, accuracy_evidence text, retention_review_on date not null, owner text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger participants_touch before update on participants for each row execute function touch_updated();
create trigger participants_audit after insert or update on participants for each row execute function record_change();
alter table participants enable row level security;
revoke all on participants from public;
create table enrolments(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), programme_id uuid not null references programmes(id), participant_id uuid not null references participants(id), starts_on date not null, ends_on date, status text not null default 'active' check(status in ('active','closed')), outcome text, check(ends_on is null or ends_on>=starts_on), check(status<>'closed' or (ends_on is not null and nullif(btrim(outcome),'') is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger enrolments_touch before update on enrolments for each row execute function touch_updated();
create trigger enrolments_audit after insert or update on enrolments for each row execute function record_change();
alter table enrolments enable row level security;
revoke all on enrolments from public;
create index on enrolments(programme_id);
create index on enrolments(participant_id);
create table sessions(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), benefit_id uuid not null references benefits(id), scheduled_on date not null, capacity_units numeric(12,2) not null check(capacity_units>0), owner text not null, status text not null default 'planned' check(status in ('planned','completed','cancelled')), outcome text, check(status='planned' or nullif(btrim(outcome),'') is not null), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger sessions_touch before update on sessions for each row execute function touch_updated();
create trigger sessions_audit after insert or update on sessions for each row execute function record_change();
alter table sessions enable row level security;
revoke all on sessions from public;
create index on sessions(benefit_id);
create table deliveries(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), enrolment_id uuid not null references enrolments(id), session_id uuid not null references sessions(id), delivered_on date not null, units numeric(12,2) not null check(units>0), evidence text not null check(length(btrim(evidence))>0), retain_until date not null, status text not null default 'delivered' check(status in ('delivered','void')), outcome text, check(retain_until>=delivered_on), check(status<>'void' or nullif(btrim(outcome),'') is not null), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger deliveries_touch before update on deliveries for each row execute function touch_updated();
create trigger deliveries_audit after insert or update on deliveries for each row execute function record_change();
alter table deliveries enable row level security;
revoke all on deliveries from public;
create index on deliveries(enrolment_id);
create index on deliveries(session_id);
create table milestones(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), programme_id uuid not null references programmes(id), due_on date not null, owner text not null, status text not null default 'open' check(status in ('open','completed')), evidence text, completed_on date, check(status<>'completed' or (completed_on is not null and nullif(btrim(evidence),'') is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger milestones_touch before update on milestones for each row execute function touch_updated();
create trigger milestones_audit after insert or update on milestones for each row execute function record_change();
alter table milestones enable row level security;
revoke all on milestones from public;
create index on milestones(programme_id);
create table notes(id uuid primary key default gen_random_uuid(), source_id text not null unique check(length(btrim(source_id))>0), name text not null check(length(btrim(name))>0), programme_id uuid not null references programmes(id), recorded_on date not null, summary text not null check(length(btrim(summary))>0), owner text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger notes_touch before update on notes for each row execute function touch_updated();
create trigger notes_audit after insert or update on notes for each row execute function record_change();
alter table notes enable row level security;
revoke all on notes from public;
create index on notes(programme_id);
alter table audit_log enable row level security;
revoke all on audit_log from public;
create unique index one_active_enrolment on enrolments(programme_id,participant_id) where status='active';
create function validate_delivery() returns trigger language plpgsql as $$
declare s sessions%rowtype; e enrolments%rowtype; b benefits%rowtype; used numeric; begin
 select * into s from sessions where id=new.session_id for update;
 select * into e from enrolments where id=new.enrolment_id for update;
 select * into b from benefits where id=s.benefit_id;
 if e.programme_id is distinct from b.programme_id then raise exception 'Session and enrolment must belong to the same programme'; end if;
 if new.delivered_on<>s.scheduled_on then raise exception 'Delivery date must match the session date'; end if;
 if new.delivered_on>current_date then raise exception 'Cannot record future delivery'; end if;
 if new.delivered_on<e.starts_on or (e.ends_on is not null and new.delivered_on>e.ends_on) then raise exception 'Delivery outside enrolment dates'; end if;
 if new.status='delivered' then
  if s.status='cancelled' then raise exception 'Cannot deliver a cancelled session'; end if;
  select coalesce(sum(units),0) into used from deliveries where session_id=new.session_id and status='delivered' and id<>new.id;
  if used+new.units>s.capacity_units then raise exception 'Delivery exceeds session capacity'; end if;
 end if;
 if TG_OP='UPDATE' and (new.enrolment_id<>old.enrolment_id or new.session_id<>old.session_id or new.units<>old.units or new.delivered_on<>old.delivered_on) then raise exception 'Void and replace a delivery instead of changing its facts'; end if;
 return new; end $$;
create trigger deliveries_validate before insert or update on deliveries for each row execute function validate_delivery();
create function validate_session() returns trigger language plpgsql as $$ begin
 if new.status='completed' and new.scheduled_on>current_date then raise exception 'Cannot complete a future session'; end if;
 if exists(select 1 from deliveries where session_id=new.id and status='delivered') and (new.benefit_id<>old.benefit_id or new.scheduled_on<>old.scheduled_on or new.status='cancelled') then raise exception 'Void deliveries before changing the session'; end if;
 if new.capacity_units<(select coalesce(sum(units),0) from deliveries where session_id=new.id and status='delivered') then raise exception 'Capacity below delivered units'; end if;
 return new; end $$;
create trigger sessions_validate before insert or update on sessions for each row execute function validate_session();
create view v_benefit_capacity with (security_invoker=true) as
 select b.id,b.source_id,p.name as programme,b.name as benefit,b.unit,b.target_units,
 coalesce((select sum(d.units) from deliveries d join sessions s on s.id=d.session_id where s.benefit_id=b.id and d.status='delivered'),0) as delivered_units,
 coalesce((select sum(s.capacity_units) from sessions s where s.benefit_id=b.id and s.status='planned' and s.scheduled_on>=current_date),0) as future_capacity_units
 from benefits b join programmes p on p.id=b.programme_id;
create view v_session_roster with (security_invoker=true) as
 select s.id,s.source_id,p.name as programme,s.name as session,b.name as benefit,b.unit,s.scheduled_on,s.owner,s.status,s.capacity_units,
 coalesce(sum(d.units) filter(where d.status='delivered'),0) as delivered_units,
 count(distinct e.participant_id) filter(where d.status='delivered')::int as participants
 from sessions s join benefits b on b.id=s.benefit_id join programmes p on p.id=b.programme_id left join deliveries d on d.session_id=s.id left join enrolments e on e.id=d.enrolment_id group by s.id,p.name,b.name,b.unit;
create view v_delivery_ledger with (security_invoker=true) as
 select d.id,d.source_id,p.id as programme_id,p.name as programme,pt.name as participant,s.name as session,b.name as benefit,b.unit,d.delivered_on,d.units,d.evidence,d.retain_until,d.status
 from deliveries d join enrolments e on e.id=d.enrolment_id join participants pt on pt.id=e.participant_id join programmes p on p.id=e.programme_id join sessions s on s.id=d.session_id join benefits b on b.id=s.benefit_id;
create view v_attention with (security_invoker=true) as
 select source_id,name as item,'Programme review overdue'::text as issue,owner,review_on as due_on from programmes where status='active' and review_on<current_date
 union all select source_id,name,'Session needs reconciliation',owner,scheduled_on from sessions where status='planned' and scheduled_on<current_date
 union all select source_id,name,'Funder report overdue',owner,due_on from milestones where status='open' and due_on<current_date
 union all select p.source_id,p.name,'No recorded benefit in 30 days',p.owner,current_date from participants p where p.status='active' and exists(select 1 from enrolments e where e.participant_id=p.id and e.status='active' and e.starts_on<current_date-30) and not exists(select 1 from deliveries d join enrolments e on e.id=d.enrolment_id where e.participant_id=p.id and d.status='delivered' and d.delivered_on>=current_date-30);
create view v_compliance with (security_invoker=true) as
 select d.source_id,'ACNC-7Y'::text as rule,'Delivery retention date precedes seven-year minimum'::text as finding from deliveries d join enrolments e on e.id=d.enrolment_id join programmes p on p.id=e.programme_id where p.jurisdiction='AU' and p.acnc_registered and d.retain_until<(d.delivered_on+interval '7 years')::date
 union all select source_id,'PRIVACY-ACCURACY','Review personal record accuracy (90-day internal reminder)' from participants where status='active' and (accuracy_checked_on is null or accuracy_checked_on<current_date-90)
 union all select source_id,'PRIVACY-RETENTION','Review continued need and applicable legal holds; do not auto-delete' from participants where retention_review_on<=current_date;
revoke all on v_benefit_capacity,v_session_roster,v_delivery_ledger,v_attention,v_compliance from public;
