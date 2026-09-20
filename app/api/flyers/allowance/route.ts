import {NextResponse} from 'next/server';
import {supabaseAuth} from '../../../../lib/supabase/auth';
import {supabaseAdmin} from '../../../../lib/supabase/admin';
import {getFlyerAllowance} from '../../../../lib/billing/flyerAllowance';
export async function POST(req: Request) {
  try {
    const token=req.headers.get('authorization')?.replace(/^Bearer /,'');
    if(!token) return NextResponse.json({error:'Please sign in.'},{status:401});
    const {data,error}=await supabaseAuth().auth.getUser(token);
    if(error || !data.user) return NextResponse.json({error:'Please sign in.'},{status:401});
    const body=await req.json();
    if(!['check','consume'].includes(body.action) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.projectId ?? ''))
      return NextResponse.json({error:'A valid flyer project is required.'},{status:400});
    const quota=await getFlyerAllowance(supabaseAdmin(),data.user.id,body.action,body.projectId);
    return NextResponse.json({...quota,...(!quota.allowed?{error:'Your flyer allowance is used. Buy One Flyer for $5, or choose a subscription at Pricing.'}:{})},{status:quota.allowed?200:402});
  }catch {return NextResponse.json({error:'Could not verify your flyer allowance. Please retry.'},{status:503});}
}
