import type { SupabaseClient } from '@supabase/supabase-js';
export type FlyerAllowance = {
  has_one_flyer_purchase: boolean; allowed: boolean; monthly_limit: number | null; monthly_used: number;
  monthly_remaining: number | null; credits: number; one_flyer_access: boolean; cycle_end: string | null;
};
export async function getFlyerAllowance(admin: SupabaseClient, userId: string, action: 'status' | 'check' | 'consume' = 'status', projectId?: string): Promise<FlyerAllowance> {
  const {data,error} = await admin.rpc('coco_flyer_allowance', {p_user_id:userId,p_action:action,p_project_id:projectId ?? null});
  if(error || !data) throw new Error('Flyer allowance is unavailable. Please try again.');
  return data as FlyerAllowance;
}
