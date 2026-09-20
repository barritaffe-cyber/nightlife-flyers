/** New plans have distinct ids so existing subscribers keep their purchased access. */
export function isBasicStudioPlan(plan: string | null | undefined): boolean {
  return String(plan ?? '').trim().toLowerCase() === 'basic' || String(plan ?? '').trim().toLowerCase() === 'one_flyer';
}

export const BASIC_STUDIO_RESTRICTION = 'Backgrounds, subjects and artwork uploads are included with Coco + Studio. Coco and One Flyer include logo uploads and flyer editing.';

export function studioCapabilities(plan: string | null | undefined, paid: boolean) {
  const normalized = String(plan ?? '').trim().toLowerCase();
  const basic = paid && isBasicStudioPlan(normalized);
  return {
    basic,
    savedProjects: paid && normalized !== 'one_flyer',
    rememberedBrand: paid && normalized !== 'one_flyer',
    templateRequests: paid && ['full', 'studio'].includes(normalized),
    logoUpload: paid,
    artworkUpload: paid && !basic,
    replaceScene: paid && !basic,
    replaceSubject: paid && !basic,
    aiTools: paid && !basic,
    expandedStudio: paid && ['full', 'studio'].includes(normalized),
  };
}
