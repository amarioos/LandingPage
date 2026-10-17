import { env } from 'cloudflare:workers';
import { defaults } from '../../../lib/config';
export const dynamic='force-dynamic';
const E=()=>env as any;
const uuid=(x:any)=>typeof x==='string'&&/^[a-zA-Z0-9-]{10,80}$/.test(x);
const clamp=(x:any,min:number,max:number)=>Math.min(max,Math.max(min,Number(x)||0));
const clean=(x:any,n=200)=>String(x||'').trim().slice(0,n);
function originOK(r:Request){return !r.headers.get('origin')||[new URL(r.url).origin,'https://amarioos.github.io'].includes(r.headers.get('origin')!)}
function reply(r:Request,data:any,status=200){const h:any={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};if(originOK(r)&&r.headers.get('origin'))h['Access-Control-Allow-Origin']=r.headers.get('origin');return new Response(JSON.stringify(data),{status,headers:h})}
function owner(r:Request){return !!r.headers.get('oai-authenticated-user-id')&&r.headers.get('oai-authenticated-user-email')?.toLowerCase()===String(E().ADMIN_EMAIL||'').toLowerCase()}
async function config(){const row=await E().DB.prepare('SELECT value FROM settings WHERE id=?').bind('config').first();try{return {...defaults,...JSON.parse(row?.value||'{}')}}catch{return defaults}}
export async function OPTIONS(r:Request){return new Response(null,{status:204,headers:originOK(r)?{'Access-Control-Allow-Origin':r.headers.get('origin')||new URL(r.url).origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}})}
export async function GET(r:Request,{params}:any){const {action}=await params;try{if(action==='config')return reply(r,await config());if(!owner(r))return reply(r,{error:'Accès administrateur requis.'},403);if(action!=='dashboard')return reply(r,{error:'Introuvable'},404);
 const u=new URL(r.url),demo=u.searchParams.get('demo')==='1'?1:0,days=clamp(u.searchParams.get('days')||30,1,365),since=Date.now()-days*86400000;
 const results=await E().DB.batch([
 E().DB.prepare('SELECT * FROM sessions WHERE demo=? AND started>=? ORDER BY started DESC LIMIT 10000').bind(demo,since),E().DB.prepare('SELECT * FROM leads WHERE demo=? AND created>=? ORDER BY created DESC LIMIT 5000').bind(demo,since),E().DB.prepare('SELECT * FROM clicks WHERE demo=? AND created>=? ORDER BY created DESC LIMIT 5000').bind(demo,since),E().DB.prepare('SELECT i.*,l.name,l.phone,l.city,l.address FROM invoices i LEFT JOIN leads l ON i.lead=l.id WHERE i.demo=? ORDER BY i.created DESC LIMIT 5000').bind(demo)]);
 return reply(r,{sessions:results[0].results,leads:results[1].results,clicks:results[2].results,invoices:results[3].results,config:await config(),now:Date.now(),truncated:results.some((x:any)=>x.results.length>=5000),email:r.headers.get('oai-authenticated-user-email')});
 }catch(e){console.error('Read failed',e);return reply(r,{error:'Service indisponible. Réessayez.'},503)}}
export async function POST(r:Request,{params}:any){const {action}=await params;if(!originOK(r))return reply(r,{error:'Origine refusée'},403);if(Number(r.headers.get('content-length')||0)>20000)return reply(r,{error:'Requête trop volumineuse'},413);let b:any;try{const raw=await r.text();if(raw.length>20000)return reply(r,{error:'Requête trop volumineuse'},413);b=JSON.parse(raw)}catch{return reply(r,{error:'JSON invalide'},400)}
 try{const db=E().DB,now=Date.now();if(action==='session'){
 if(!uuid(b.id)||!uuid(b.visitor))return reply(r,{error:'Identifiant invalide'},400);const c=await config();if(!c.analytics)return reply(r,{disabled:true});
 await db.prepare('INSERT INTO sessions (id,visitor,started,seen,device,demo) VALUES(?,?,?,?,?,0) ON CONFLICT(id) DO NOTHING').bind(b.id,b.visitor,now,now,b.device==='mobile'?'mobile':'desktop').run();return reply(r,{ok:true});}
 if(action==='track'){
 if(!uuid(b.id))return reply(r,{error:'Identifiant invalide'},400);if(!(await config()).analytics)return reply(r,{disabled:true});
 const sess=await db.prepare('SELECT device,started FROM sessions WHERE id=? AND demo=0').bind(b.id).first();if(!sess)return reply(r,{error:'Session absente'},400);
 const statements=[db.prepare('UPDATE sessions SET seen=MAX(seen,?),depth=MAX(depth,?),form_viewed=MAX(form_viewed,?),form_started=MAX(form_started,?),cta=MAX(cta,?) WHERE id=? AND demo=0').bind(clamp(b.seen,sess.started,now),clamp(b.depth,0,100),b.formViewed?1:0,b.formStarted?1:0,b.cta?1:0,b.id)];
 for(const p of (Array.isArray(b.clicks)?b.clicks:[]).slice(0,20)){if(!/^(hero|problem|solution|benefits|details|comparison|steps|lifestyle|practical|faq|closing|order)$/.test(p.section))continue;statements.push(db.prepare('INSERT INTO clicks (id,session,section,x,y,device,created,demo) SELECT ?,?,?,?,?,?,?,0 WHERE (SELECT COUNT(*) FROM clicks WHERE session=?)<300').bind(crypto.randomUUID(),b.id,p.section,clamp(p.x,0,1),clamp(p.y,0,1),sess.device,now,b.id));}await db.batch(statements);return reply(r,{ok:true});}
 if(action==='lead'){
 if(b.website)return reply(r,{error:'Requête refusée'},400);if(!uuid(b.session))return reply(r,{error:'Session invalide'},400);
 const name=clean(b.name,100),phone=clean(b.phone,30).replace(/[\s().-]/g,''),city=clean(b.city,100),district=clean(b.district,100),address=clean(b.address,500),qty=Number(b.quantity);
 if(name.length<3||! /^(0[67][0-9]{8}|\+212[67][0-9]{8})$/.test(phone)||city.length<2||district.length<2||address.length<8||!Number.isInteger(qty)||qty<1||qty>10||b.consent!==true)return reply(r,{error:'راجع المعلومات: الاسم، رقم مغربي، المدينة، الحي والعنوان.'},400);
 const existing=await db.prepare('SELECT id FROM leads WHERE session=? AND demo=0').bind(b.session).first();if(existing)return reply(r,{ok:true,id:existing.id});
 const recent=await db.prepare('SELECT COUNT(*) AS n FROM leads WHERE phone=? AND demo=0 AND created>?').bind(phone,now-3600000).first();if(recent.n>=3)return reply(r,{error:'تسجلات طلبات بهاد الرقم مؤخرا. حاول من بعد.'},429);
 const id=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO leads (id,session,name,phone,city,district,address,quantity,notes,status,created,demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)').bind(id,b.session,name,phone,city,district,address,qty,clean(b.notes,1000),'Nouveau',now),db.prepare('UPDATE sessions SET submitted=1,form_viewed=1,form_started=1,seen=? WHERE id=? AND demo=0').bind(now,b.session)]);return reply(r,{ok:true,id});}
 if(!owner(r))return reply(r,{error:'Accès administrateur requis.'},403);
 if(action==='lead-status'){if(!['Nouveau','Contacté','Confirmé','Livré','Annulé'].includes(b.status))return reply(r,{error:'Statut invalide'},400);await db.prepare('UPDATE leads SET status=? WHERE id=?').bind(b.status,clean(b.id)).run();return reply(r,{ok:true})}
 if(action==='settings'){
 const c={...defaults,product:clean(b.product,150),price:b.price===''||b.price===null?null:clamp(b.price,0,1000000),tax:b.tax===''||b.tax===null?null:clamp(b.tax,0,100),analytics:!!b.analytics,notes:!!b.notes,images:(Array.isArray(b.images)?b.images:[]).slice(0,12).map((p:any)=>{const u=new URL(p.url);if(u.protocol!=='https:')throw new Error('HTTPS images only');return {url:u.href,label:clean(p.label,150),x:clamp(p.x,0,99),y:clamp(p.y,0,99),width:clamp(p.width,1,100),height:clamp(p.height,1,100)}})};
 await db.prepare('INSERT INTO settings(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('config',JSON.stringify(c)).run();return reply(r,{ok:true});}
 if(action==='invoice'){
 const l=await db.prepare('SELECT * FROM leads WHERE id=?').bind(clean(b.lead)).first();if(!l)return reply(r,{error:'Lead absent'},400);const c=await config();if(c.price===null)return reply(r,{error:'Configurez le prix avant de créer une facture.'},400);
 const id=crypto.randomUUID(),reference='DW-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+id.slice(0,8).toUpperCase();await db.prepare('INSERT INTO invoices(id,lead,reference,status,price,quantity,tax,created,demo) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,l.id,reference,'Brouillon',c.price,l.quantity,c.tax,now,l.demo).run();return reply(r,{ok:true});}
 if(action==='invoice-status'){if(!['Brouillon','Envoyée','Payée','Annulée'].includes(b.status))return reply(r,{error:'Statut invalide'},400);await db.prepare('UPDATE invoices SET status=? WHERE id=?').bind(b.status,clean(b.id)).run();return reply(r,{ok:true})}
 if(action==='clear-demo'){await db.batch(['invoices','clicks','leads','sessions'].map(t=>db.prepare(`DELETE FROM ${t} WHERE demo=1`)));return reply(r,{ok:true})}
 if(action==='demo'){
 const exists=await db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE demo=1').first();if(exists.n)return reply(r,{ok:true,already:true});const q=[];
 for(let i=0;i<120;i++){const id='demo-session-'+i,at=now-((i%14)+1)*86400000,started=i<46?1:0,submitted=i<22?1:0;
 q.push(db.prepare('INSERT INTO sessions(id,visitor,started,seen,depth,form_viewed,form_started,submitted,cta,device,demo) VALUES(?,?,?,?,?,?,?,?,?,?,1)').bind(id,'demo-visitor-'+(i%95),at,at+180000,[100,100,75,50,25][i%5],i<70?1:0,started,submitted,i<62?1:0,i%3?'mobile':'desktop'));
 if(submitted)q.push(db.prepare('INSERT INTO leads(id,session,name,phone,city,district,address,quantity,notes,status,created,demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,1)').bind('demo-lead-'+i,id,'Client démo '+(i+1),'DEMO-'+String(i+1).padStart(4,'0'),['Casablanca','Rabat','Tanger'][i%3],'Quartier démo','Adresse fictive — démonstration',i%3+1,'Donnée fictive',['Nouveau','Contacté','Confirmé'][i%3],at));
 for(let j=0;j<2;j++)q.push(db.prepare('INSERT INTO clicks(id,session,section,x,y,device,created,demo) VALUES(?,?,?,?,?,?,?,1)').bind(crypto.randomUUID(),id,j?'order':'hero',.25+(i%12)*.04,.65+(i%6)*.04,i%3?'mobile':'desktop',at));}
 for(let i=0;i<q.length;i+=80)await db.batch(q.slice(i,i+80));return reply(r,{ok:true});}
 return reply(r,{error:'Action inconnue'},404);
 }catch(e){console.error('Write failed',e);return reply(r,{error:'ما تسجلش الطلب. عاود المحاولة. / Enregistrement impossible.'},503)}}
