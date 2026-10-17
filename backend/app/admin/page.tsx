import {getChatGPTUser,chatGPTSignInPath} from '../chatgpt-auth';
import {env} from 'cloudflare:workers';
import Admin from './ui';
export const dynamic='force-dynamic';
export default async function AdminPage(){const user=await getChatGPTUser();if(!user)return <main className="login"><div className="brand">DogWalk <b>MAROC</b></div><h1>Votre espace de pilotage.</h1><p>Commandes, parcours visiteurs et factures au même endroit.</p><a className="btn" href={chatGPTSignInPath('/admin')} target="_top">Se connecter avec ChatGPT →</a></main>;if(user.email.toLowerCase()!==String((env as any).ADMIN_EMAIL||'').toLowerCase())return <main className="login"><h1>Accès réservé au propriétaire.</h1><p>Ce compte ne peut pas accéder aux données clients.</p><a href="/signout-with-chatgpt?return_to=/admin">Changer de compte</a></main>;return <Admin/>}
