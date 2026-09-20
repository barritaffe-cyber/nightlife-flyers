import {readFile} from 'node:fs/promises';
// Isolate browser artwork QA from real accounts, billing and allowance writes.
export async function mockLocalFullStudio(context) {
 const env=await readFile('.env.local','utf8');
 const url=env.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\s"']+)/m)?.[1];
 const key=`sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
 await context.addInitScript(key=>localStorage.setItem(key,JSON.stringify({access_token:'local-artwork-test',refresh_token:'local-artwork-test',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'local-artwork-test',email:'artwork@example.test',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}})),key);
 await context.route('**/auth/v1/**',r=>r.fulfill({json:{id:'local-artwork-test',email:'artwork@example.test'}}));
 await context.route('**/api/auth/status',r=>r.fulfill({json:{status:'active',plan:'full',generation_limit:180,generation_used:0,generation_remaining:180}}));
 await context.route('**/api/auth/profile-bootstrap',r=>r.fulfill({json:{ok:true}}));
 await context.route('**/api/flyers/allowance',r=>r.fulfill({json:{allowed:true,monthly_remaining:20,credits:0}}));
 await context.route('**/api/analytics/**',r=>r.fulfill({json:{ok:true}}));
}
