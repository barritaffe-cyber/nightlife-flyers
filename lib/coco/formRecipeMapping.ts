import { cocoFormObjectContract } from './formObjectContracts.ts';
import { cocoNativeSocialSamples } from './socialRecipeAssets.ts';
import { COCO_EVENT_FIELD_LABELS, COCO_EVENT_FIELD_GROUPS, type CocoEventBriefInput, type CocoEventTextField, type CocoRecipeFieldBinding } from './eventBriefFields.ts';
import { cocoQrCode } from './qrCode.ts';
import { cocoHeadlineAssignments, cocoHeadlineOwners, cocoHeadlineConnectorId } from './recipeCompatibility.ts';
import { authoredFormText, authoredStackedDate, authoredTime, cocoDisplayDate } from './authoredFormText.ts';
import { cocoAuthoredFieldValue, cocoInputLine } from './formFieldLayout.ts';
import { compiledObjectValue, compiledPreviewFields } from './compiledPreview.ts';
type TextOwner = {
    id: string;
    kind?: string;
    semanticRole?: string;
    text?: string;
    binding?: {
        text?: string;
        enabled?: string;
        size?: string;
    };
    bounds?: {
        width: number;
        height: number;
    };
    typography?: {
        fontSizePx?: number;
        letterSpacingEm?: number;
        lineHeight?: number;
    };
};
type DateParts = {
    day: string;
    month: string;
    weekday: string;
};
type SourceKey = CocoEventTextField | 'experienceFeatures';
// Resolve the meaning of the authored object, never the historical editor field
// name ("details" can mean hosts, genres, or an offer in different recipes).
function meaning(o: TextOwner, recipe: string): string {
    const id = o.id.replace(/[-_]/g, '').toLowerCase();
    const role = (o.semanticRole ?? '').toLowerCase();
    const contract = cocoFormObjectContract(recipe, o.id);
    if (contract?.role) return contract.role;
    // A complete admission price beats generic IDs such as details or offer.
    // Mixed blocks (entry plus bottle service, for example) need a reviewed question.
    const copy = String(o.text ?? '').trim().replace(/\s+/g, ' ');
    if (/^(?:(?:tickets?|entry|admission|cover)(?: fee| price| charge)?\s*:?\s*(?:[$€£¥]\s*)?\d+(?:[.,]\d+)?|(?:free\s+(?:entry|admission)|(?:entry|admission)\s+free))$/i.test(copy)) return 'entryFee';
    // These are authored atmosphere/decorative copy, not event facts. Only
    // preserve existing owners; never synthesize these objects for a design.
    const designRole = /^(mood|moodline|motto|feeling|feelings|vibes|presents|presentslabel)$/;
    if (designRole.test(id) || designRole.test(role.replace(/[-_]/g, '')) ||
        ['views', 'napkin'].includes(id) || (recipe === 'glow-in-the-dark' && id === 'bucket') ||
        /^presents$/i.test(String(o.text ?? '').replace(/\s/g, ''))) return 'designCopy';
    if (recipe === 'glow-in-the-dark' && id === 'genres') return 'dressCode';
    if (recipe === 'glow-in-the-dark' && id === 'bucket') return 'eventDetails';
    if (['beat-therapy', 'bad-girls'].includes(recipe) && id === 'tables') return 'eventDetails';
    if (recipe === 'reggae-jams' && id === 'year') return 'month';
    if (id === 'ordinal')
        return 'ordinal';
    if (id === 'website')
        return 'website';
    if (/^(hosts?|hype)$/.test(id))
        return 'hosts';
    if (/^(genres|genre\d+|musicpolicy|styles)$/.test(id))
        return 'musicPolicy';
    if (/^(dress|dresscode|attire)$/.test(id))
        return 'dressCode';
    if (/^(responsible|legal)$/.test(id))
        return 'responsibleDrinking';
    if (/^(age|agerestriction|compliance)$/.test(id))
        return 'ageRequirement';
    if (/^(weekday)$/.test(id))
        return 'weekday';
    if (/^(offer|offers|discount|callout|prices|price\d+|item\d+|offer(one|two|three)(price|copy))$/.test(id))
        return 'offers';
    if (/^(dj\d+|djlineup|lineup|djs|djenvy|djkash)$/.test(id))
        return 'djs';
    if (/^(rsvp|reservation|reserve|reservationvalue|contact|ticketvalue)$/.test(id))
        return 'contacts';
    if (/^(mood|motto|description|invitation|footer|footermessage|features|experience|attractions|slogan|recurrence|band|guest|corporate|special)$/.test(id))
        return 'eventDetails';
    if (/^(tagline|subtag)$/.test(id))
        return 'tagline';
    if (id === 'offertime')
        return 'promotionDeadline';
    if (/^(drinks?|cocktails)$/.test(id))
        return 'drinkSpecials';
    if (/^hookah$/.test(id))
        return 'hookahSpecials';
    if (/^(bucket|vip)$/.test(id))
        return 'bottleSpecials';
    if (/^(entry|cost)$/.test(id))
        return 'entryFee';
    if (id === 'entrynote')
        return 'freeEntryCondition';
    if (id === 'dressnote')
        return 'entryRestrictions';
    if (/^(handle|socialhandle)$/.test(id))
        return 'socials';
    if (/^(qr.*|.*label|presents|musicby|featuring|sounds|timeto|onwards)$/.test(id))
        return 'label';
    const roles: Record<string, string> = { headline: 'headline', headline2: 'headline2', presenter: 'presenterName', venue: 'venueName', address: 'address', date: 'date', day: 'day', weekday: 'weekday', month: 'month', eventmonth: 'month', year: 'year', time: 'time', hours: 'time', eventhours: 'time', hoursinfo: 'time', endtime: 'endTime', meridiem: 'meridiem', dateordinal: 'ordinal', djlineup: 'djs', hostmc: 'hosts', details: 'eventDetails', footerdetails: 'eventDetails', price: 'entryFee', compliance: 'ageRequirement', social: 'socials', rsvp: 'contacts', reservationinfo: 'contacts', subtag: 'tagline' };
    return roles[role] ?? '';
}
export function mapCocoFormToRecipe(recipeId: string, source: Record<string, any>, eventName: string, brief: CocoEventBriefInput, date: DateParts) {
    brief = cocoBriefForFormat(brief, source.format ?? source.cocoCompositionSystem?.compiledDocument?.format);
    if (!brief.date) date = { day: '', month: '', weekday: '' };
    const preserveAuthored = Boolean(brief.recipeFieldBindings || brief.theme || source.cocoEventBrief?.theme);
    const originalSystem = source.cocoCompositionSystem;
    // Rush is the one authored recipe still rendered through legacy text slots.
    const legacyObjects: TextOwner[] = [
        ['headline', 'headline', 'headline'], ['subtitle', 'headline2', 'head2line'], ['presenter', 'presenter', 'presenter'],
        ['date', 'date', 'date'], ['time', 'time', 'time'], ['venue', 'venue', 'venue'], ['address', 'address', 'venueAddress'],
        ['genres', 'details', 'details'], ['lineup', 'djLineup', 'details2'], ['entry', 'price', 'price'],
        ['offer', 'subtag', 'subtag'], ['description', 'footerDetails', 'rightRail'], ['contact', 'rsvp', 'leftRail'],
        ['age', 'compliance', 'compliance'], ['handle', 'social', 'cocoSocialHandle'],
    ].map(([id, semanticRole, key]) => ({ id, kind: 'text', semanticRole, binding: { text: key, enabled: key === 'head2line' ? 'head2Enabled' : key + 'Enabled' } }));
    const system = originalSystem?.compiledDocument ? originalSystem : { ...originalSystem, compiledDocument: { objects: legacyObjects } };
    const objects: TextOwner[] = (system?.compiledDocument?.objects ?? []).filter((o: TextOwner) => o.kind === 'text' && !/^coco-form-(detail|qr)/.test(o.id));
    const meanings = new Map(objects.map(o => [o.id, meaning({ ...o, text: authoredText(source, o) }, recipeId)]));
    const available = (o: TextOwner) => !system.compiledObjectOverrides?.[o.id]?.removed && cocoTextBackdropAvailable(o, system);
    const groups = (key: string) => objects.filter(o => meanings.get(o.id) === key && available(o));
    const fields: Record<string, any> = {};
    // Clear native slots too: some older masters include enabled text outside
    // the compiled document. New event facts must never inherit that copy.
    for (const key of ['headline','head2line','head2','presenter','date','time','venue','venueAddress','details','details2','subtag','compliance','price','leftRail','rightRail','cocoSocialHandle','detailsLabel','djLineupLabel','timeLabel','priceLabel','leftRailLabel','rightRailLabel']) {
        fields[key] = '';
        fields[key + 'Enabled'] = false;
    }
    const freshGuidedBuild = preserveAuthored && source.cocoFormMappingVersion !== 1;
    const overrides = { ...system?.compiledObjectOverrides };
    const savedControls = compiledPreviewFields(source);
    // These saved moves predate City Nights' reference export and move its title
    // away from the compiled master. New creations follow that reference; later
    // user positioning remains authoritative.
    if (freshGuidedBuild && recipeId === 'city-nights') {
        for (const id of ['headline', 'headline2', 'date', 'doors', 'music-policy']) {
            if (!overrides[id]) continue;
            overrides[id] = { ...overrides[id] };
            for (const key of ['left', 'top', 'x', 'y']) delete overrides[id][key];
        }
    }
    for (const [id, edit] of Object.entries(overrides) as [string, any][]) {
        if (edit.cocoDetailsHidden) overrides[id] = { ...edit, removed: false, cocoDetailsHidden: false };
        if (edit.cocoFormBackdropHidden) overrides[id] = { ...overrides[id], removed: false, cocoFormBackdropHidden: false };
    }
    const placed = new Set<SourceKey>();
    const fitWarnings: string[] = [];
    const assigned = new Set<string>();
    const text = (key: SourceKey) => Array.isArray(brief[key]) ? (brief[key] as string[]).join(' • ') : String(brief[key] ?? '').trim();
    const write = (o: TextOwner, value: string, sourceFields?: string[]) => {
        if (sourceFields?.includes('date')) value = cocoDisplayDate(value);
        const designCopy = meanings.get(o.id) === 'designCopy';
        const editorLabel = ['label', 'boundLabel', 'designCopy'].includes(meanings.get(o.id) ?? '') && overrides[o.id]?.cocoEditorText;
        // Also ignore stale form bindings from projects saved before these
        // blocks became automatic. Their saved wording remains authoritative.
        if (designCopy) {
            const saved = overrides[o.id];
            const alreadyAutomatic = source.cocoFormMappingVersion === 1 && Array.isArray(saved?.cocoFormFields) && saved.cocoFormFields.length === 0;
            value = alreadyAutomatic ? String(saved.text ?? authoredText(source, o)) : authoredText(source, o);
            sourceFields = [];
        }
        if (editorLabel) value = String(overrides[o.id].text ?? '');
        if (!designCopy && !editorLabel && preserveAuthored && !sourceFields?.some(key => ['eventName', 'date', 'startTime', 'endTime'].includes(key))) value = cocoAuthoredFieldValue(authoredText(source, o), value, meanings.get(o.id) === 'dressCode');
        if (!designCopy && !editorLabel && preserveAuthored) value = authoredFormText(authoredText(source, o), value);
        assigned.add(o.id);
        if (o.binding?.text)
            fields[o.binding.text] = value;
        if (o.binding?.enabled)
            fields[o.binding.enabled] = Boolean(value);
        const prior = overrides[o.id];
        const savedSize = compiledObjectValue(overrides, savedControls, o, 'size', o.typography?.fontSizePx ?? 0);
        const undoAutoFit = prior?.cocoFormAutoSize !== undefined && prior.size === prior.cocoFormAutoSize;
        const font = Number(preserveAuthored
            ? (undoAutoFit ? prior.cocoFormBaseSize ?? savedSize : savedSize)
            : prior?.cocoFormBaseSize ?? prior?.size ?? o.typography?.fontSizePx ?? 0);
        const lines = value.split('\n');
        const tracking = Number(o.typography?.letterSpacingEm ?? 0);
        const measure = (line: string) => Array.from(line).reduce((sum, ch) => sum + (/[ilI1.,' ]/.test(ch) ? 0.3 : /[MW@]/.test(ch) ? 0.95 : 0.65) + tracking, 0);
        const widthEm = Math.max(...lines.map(measure), 1);
        const canvasHeight = source.format === 'story' ? 960 : 540;
        const availableWidth = (o.bounds?.width ?? 100) * 5.4;
        const availableHeight = (o.bounds?.height ?? 100) * canvasHeight / 100;
        // The authored lettering is the sizing reference: several templates use
        // condensed/glyph fonts whose ink extends beyond a CSS line box. A generic
        // font estimate must not shrink even the original wording.
        const originalLines = String(o.text ?? '').split('\n');
        const originalWidth = Math.max(...originalLines.map(measure), 1);
        const fitted = font ? (o.text
            ? font * Math.min(1, originalWidth / widthEm, originalLines.length / Math.max(1, lines.length))
            : Math.min(font, availableWidth / widthEm, availableHeight / (Math.max(1, lines.length) * Number(o.typography?.lineHeight ?? 1.2)))) : 0;
        // Auto fitting belongs to the new form flow. An explicit Fine Tune size
        // override remains the user's authority on later edits.
        const mayFit = !preserveAuthored && font > 0 && (source.cocoFormMappingVersion !== 1 || prior?.size === undefined || prior?.cocoFormAutoSize === prior.size);
        overrides[o.id] = { ...prior, text: value, ...(sourceFields ? { cocoFormFields: sourceFields } : {}), ...(mayFit ? { size: fitted, cocoFormAutoSize: fitted, cocoFormBaseSize: font } : {}) };
        // New guided builds keep the master's font size. Undo only our previous
        // automatic fit, never an explicit user edit.
        if (preserveAuthored && font > 0) {
            overrides[o.id] = { ...overrides[o.id], size: font, cocoFormAutoSize: undefined };
            // Use the same saved size as the canvas, including native control
            // edits made after compilation. Keep both control paths in sync.
            if (o.binding?.size) fields[o.binding.size] = font;
        }
        if (value && mayFit && fitted < 7)
            fitWarnings.push(o.id);
    };
    const put = (group: string, keys: SourceKey[], labelled = false) => {
        if (brief.recipeFieldBindings) return;
        const owners = groups(group).filter(o => !assigned.has(o.id)).sort((a,b)=>(b.bounds?.width??0)-(a.bounds?.width??0));
        if (!owners.length)
            return;
        const supplied = keys.filter(k => text(k));
        const lines = supplied.map(k => ({ key: k, value: labelled && supplied.length > 1 ? `${({ rsvpContact: 'RSVP', bookingContact: 'Tables', email: 'Email', ticketLink: 'Tickets', website: 'Web' } as Record<string, string>)[k] ?? COCO_EVENT_FIELD_LABELS[k as CocoEventTextField] ?? 'Experience'}: ${text(k)}` : text(k) }));
        const value = lines.map(l => l.value).join('\n');
        write(owners[0], value, lines.map(l => l.key));
        lines.forEach(l => placed.add(l.key));
    };
    // Use every provided act. The last slot takes remaining lines instead of
    // silently dropping the fourth DJ from a three-slot design.
    const distribute = (group: string, key: SourceKey) => {
        if (brief.recipeFieldBindings) return;
        const owners = groups(group);
        if (!owners.length)
            return;
        const lines = text(key).split(/\r?\n|\s*[|;]\s*/).filter(Boolean);
        owners.forEach((o, i) => write(o, i === owners.length - 1 ? lines.slice(i).join('\n') : lines[i] ?? '', [key]));
        if (lines.length)
            placed.add(key);
    };
    if (preserveAuthored) {
        const title = cocoHeadlineAssignments(recipeId, source, eventName);
        for (const o of objects) if (title[o.id] !== undefined) write(o, title[o.id], ['eventName']);
        // Linked decorative/ghost titles follow their actual title owner.
        for (const o of objects.filter(o => !assigned.has(o.id))) {
            const owner = objects.find(candidate => title[candidate.id] !== undefined && candidate.binding?.text && candidate.binding.text === o.binding?.text);
            if (owner) write(o, title[owner.id], ['eventName']);
        }
        // A subtitle may use a separate tagline slot, never an event-name word.
        put('headline2', ['subtitle']);
        if (!placed.has('subtitle')) put('tagline', ['subtitle']);
    } else {
    let primary = eventName.trim(), secondary = text('subtitle');
    const secondaryOwners = groups('headline2');
    if (secondaryOwners.length && !secondary) {
        const words = primary.split(/\s+/);
        if (words.length > 1) {
            secondary = words.pop()!;
            primary = words.join(' ');
        }
    }
    if (recipeId === 'glow-in-the-dark' && /^glow in the dark$/i.test(eventName.trim()) && !text('subtitle')) {
        primary = 'Glow';
        secondary = 'Dark';
        const c = objects.find(o => o.id === 'connector');
        if (c)
            write(c, 'IN THE');
    }
    groups('headline').forEach(o => {
        const originalLines = String(o.text ?? '').split('\n').length;
        const words = primary.split(/\s+/);
        const title = originalLines > 1 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')].join('\n') : primary;
        write(o, title, ['eventName']);
    });
    secondaryOwners.forEach(o => write(o, secondary, [text('subtitle') ? 'subtitle' : 'eventName']));
    // Decorative copies must follow the headline as well.
    objects.filter(o => o.binding?.text === 'headline' && !assigned.has(o.id)).forEach(o => write(o, primary));
    if (text('subtitle') && secondaryOwners.length)
        placed.add('subtitle');
    if (!placed.has('subtitle'))
        put('tagline', ['subtitle']);
    }
    const hasMonth = groups('month').length > 0;
    const numericDay = groups('day').length > 0 && (groups('weekday').length > 0 || !groups('date').length);
    const displayDateInput = cocoDisplayDate(String(brief.date ?? '').trim());
    for (const o of objects) {
        if (!available(o)) continue;
        const m = meanings.get(o.id);
        const dateValue = m === 'month' ? date.month : m === 'weekday' ? date.weekday.slice(0, 3) : m === 'day' ? (numericDay ? date.day : date.weekday.slice(0, 3)) : m === 'year' ? '' : m === 'ordinal' ? (date.day ? (['11', '12', '13'].includes(date.day) ? 'TH' : ({ 1: 'ST', 2: 'ND', 3: 'RD' } as Record<string, string>)[date.day.slice(-1)] ?? 'TH') : '') : m === 'date' ? (hasMonth && date.day && date.month ? date.day : displayDateInput) : null;
        if (dateValue !== null) {
            const original = authoredText(source, o);
            const displayDate = preserveAuthored && /^0\d$/.test(original.trim()) && /^\d$/.test(dateValue) ? dateValue.padStart(2, '0') : dateValue;
            write(o, preserveAuthored && m === 'date' && !hasMonth ? authoredStackedDate(original, displayDate, date) : displayDate, ['date']);
            if (text('date'))
                placed.add('date');
        }
    }
    const hasEnd = groups('endTime').length > 0;
    const hasMeridiem = groups('meridiem').length > 0;
    put('time', hasEnd || hasMeridiem ? ['startTime'] : ['startTime', 'endTime']);
    if (preserveAuthored && !hasMeridiem) {
        for (const o of groups('time')) write(o, authoredTime(String(o.text ?? ''), String(overrides[o.id]?.text ?? '')), overrides[o.id]?.cocoFormFields);
    }
    if (hasMeridiem) {
        const value = text('startTime');
        groups('time').forEach(o => write(o, value.replace(/\s*([AP]M)$/i, '')));
        groups('meridiem').forEach(o => write(o, value.match(/([AP]M)$/i)?.[1] ?? ''));
    }
    put('endTime', ['endTime']);
    distribute('djs', 'djs');
    distribute('musicPolicy', 'musicPolicy');
    for (const key of ['presenterName', 'venueName', 'address', 'hosts', 'performers', 'dressCode', 'entryFee', 'ageRequirement', 'responsibleDrinking', 'socials', 'website', 'drinkSpecials', 'hookahSpecials', 'bottleSpecials', 'freeEntryCondition', 'entryRestrictions', 'promotionDeadline'] as SourceKey[])
        put(key, [key]);
    put('contacts', ['rsvpContact', 'bookingContact', 'email', 'ticketLink', ...(!placed.has('website') ? ['website' as const] : [])], true);
    put('offers', (['mainPromotion', 'bottleSpecials', 'drinkSpecials', 'foodSpecials', 'hookahSpecials', 'promotionDeadline', 'additionalOffers', 'freeEntryCondition'] as SourceKey[]).filter(k => !placed.has(k)));
    // A general information block can accommodate supplied supporting facts; keep
    // semantic labels so a host never appears under “Music by”.
    put('eventDetails', (['eventDetails', 'hosts', 'performers', 'additionalActs', 'musicPolicy', 'dressCode', 'mainPromotion', 'bottleSpecials', 'drinkSpecials', 'foodSpecials', 'hookahSpecials', 'promotionDeadline', 'additionalOffers', 'freeEntryCondition', 'entryRestrictions', 'responsibleDrinking', 'experienceFeatures'] as SourceKey[]).filter(k => !placed.has(k)), true);
    // Guided forms have exact destinations. Never merge distinct objects or
    // move an answer to a generic block based on a guessed semantic category.
    for (const [key, binding] of Object.entries(brief.recipeFieldBindings ?? {})) {
        if (binding.kind !== 'text' && binding.kind !== 'lines') continue;
        const ids = binding.targets[source.format as CocoFormFormat] ?? [];
        for (const [index, id] of ids.entries()) {
            const o = objects.find(o => o.id === id);
            if (!o || !available(o)) continue;
            const input = text(key as SourceKey);
            // A saved single-line lineup can use separators as visible copy
            // (e.g. Disco Story). Do not turn those into unrequested new lines.
            const singleLineOwner = ids.length === 1 && !authoredText(source, o).includes('\n');
            const lines = input.split(singleLineOwner ? /\r?\n/ : /\r?\n|\s*[|;]\s*/);
            const offset = ids.slice(0, index).reduce((sum, priorId) => sum + authoredText(source, objects.find(owner => owner.id === priorId)!).split('\n').length, 0);
            const count = authoredText(source, o).split('\n').length;
            const value = binding.kind === 'lines' ? (index === ids.length - 1 ? lines.slice(offset).join('\n') : lines.slice(offset, offset + count).join('\n'))
                : key === 'startTime' ? authoredTime(authoredText(source, o), hasMeridiem ? input.replace(/\s*([AP]M)$/i, '') : input) : input;
            write(o, value, [key]);
            if (value) placed.add(key as SourceKey);
        }
    }
    for (const o of groups('boundLabel')) {
        const ownerId = cocoFormObjectContract(recipeId, o.id)?.labelFor;
        write(o, ownerId && overrides[ownerId]?.text ? authoredText(source, o) : '');
        overrides[o.id] = { ...overrides[o.id], cocoFormIsLabel: true };
    }
    // Static labels are only visible when their corresponding facts exist.
    const hasGroupText = (key: string) => groups(key).some(o => Boolean(overrides[o.id]?.text));
    for (const o of groups('label')) {
        const id = o.id.toLowerCase();
        let value = '';
        if (id.includes('present'))
            value = text('presenterName') ? 'PRESENTS' : '';
        else if (/music|lineup|sounds/.test(id))
            value = hasGroupText('djs') ? 'MUSIC BY' : '';
        else if (/host|hype/.test(id))
            value = hasGroupText('hosts') ? 'HOSTED BY' : '';
        else if (/rsvp|contact|reservation|ticket/.test(id))
            value = groups('contacts').some(c => overrides[c.id]?.text) ? 'CONTACT / RESERVATIONS' : '';
        else if (/doors|time|boarding/.test(id))
            value = text('startTime') ? 'DOORS' : '';
        else if (/entry|price/.test(id))
            value = text('entryFee') ? 'ENTRY' : '';
        else if (id.includes('venue'))
            value = text('venueName') ? 'VENUE' : '';
        else if (/details/.test(id))
            value = hasGroupText('musicPolicy') ? 'MUSIC' : '';
        if (preserveAuthored && value) value = String(o.text ?? value);
        const labelFields = /music|lineup|sounds/.test(id) ? ['djs'] : /host|hype/.test(id) ? ['hosts'] : /rsvp|contact|reservation|ticket/.test(id) ? ['rsvpContact', 'bookingContact', 'email', 'ticketLink'] : /present/.test(id) ? ['presenterName'] : /doors|time|boarding/.test(id) ? ['startTime'] : /entry|price/.test(id) ? ['entryFee'] : id.includes('venue') ? ['venueName'] : [];
        write(o, value, labelFields.filter(key => text(key as SourceKey)));
        overrides[o.id] = { ...overrides[o.id], cocoFormIsLabel: true };
    }
    // Clear unused sample facts. write() retains existing built-in design copy.
    for (const o of objects)
        if (!assigned.has(o.id))
            write(o, '');
    for (const key of Object.keys(fields).filter(key=>key.endsWith('Enabled'))) {
        const textField=key.slice(0,-'Enabled'.length);
        fields[key]=Boolean(fields[textField]) || objects.some(o=>o.binding?.enabled===key && Boolean(overrides[o.id]?.text));
    }
    fields.head2Enabled = Boolean(fields.head2line);
    fields.head2 = fields.head2line ?? '';
    fields.headline2Enabled = Boolean(fields.head2);
    // A saved caption only needs canvas space when there is a QR to label.
    // Keep invalid requests applicable so QR validation still reports them.
    const hasQr = Boolean(source.qrImageUrl || cocoQrCode(brief));
    const unplacedFields = [...new Set([...Object.keys(COCO_EVENT_FIELD_LABELS), ...Object.keys(brief.recipeFieldBindings ?? {})])].filter(k => text(k as SourceKey) && !placed.has(k as SourceKey) && (k !== 'qrLabel' || hasQr));
    if (brief.experienceFeatures?.length && !placed.has('experienceFeatures'))
        unplacedFields.push('experienceFeatures');
    if (brief.socialPlatforms?.length)
        unplacedFields.push('socialPlatforms');
    // Sample QR artwork does not encode the user's link. The details pass adds
    // generated QR artwork separately; preserve the native uploaded QR flag.
    fields.qrEnabled = Boolean(source.qrImageUrl);
    const hiddenObjects = (system?.compiledDocument?.objects ?? []).filter((o: any) => o.kind !== 'text' && !String(o.id).startsWith('coco-form-') && /qr/i.test(`${o.id} ${o.assetRole ?? ''}`));
    hiddenObjects.forEach((o: any) => { overrides[o.id] = { ...overrides[o.id], cocoFormQrWasRemoved: overrides[o.id]?.cocoFormQrWasRemoved ?? Boolean(overrides[o.id]?.removed), removed: true }; });
    // Reviewed frames/rules belong to their content, just like text labels.
    // Hide empty decorations during selection and restore them once filled.
    for (const asset of system?.compiledDocument?.objects ?? []) {
        if (asset.kind === 'text' || overrides[asset.id]?.removed) continue;
        const ownerId = cocoFormObjectContract(recipeId, asset.id)?.labelFor;
        if (ownerId && !String(overrides[ownerId]?.text ?? '').trim()) {
            overrides[asset.id] = { ...overrides[asset.id], removed: true, cocoFormBackdropHidden: true };
        }
    }
    if (preserveAuthored) for (const asset of system?.compiledDocument?.objects ?? []) {
        if (asset.kind === 'text' || !/(brush|banner|plate|ribbon|panel)/i.test(asset.id) || overrides[asset.id]?.removed) continue;
        const dependents = objects.filter(o => textInsideBackdrop(o, asset));
        if (dependents.length && dependents.every(o => !String(overrides[o.id]?.text ?? o.text ?? '').trim())) {
            overrides[asset.id] = { ...overrides[asset.id], removed: true, cocoFormBackdropHidden: true };
        }
    }
    return { fields, system: originalSystem?.compiledDocument ? { ...system, compiledObjectOverrides: overrides } : originalSystem, report: { fitWarnings, mappedFields: [...placed], unplacedFields, unplacedLabels: unplacedFields.map(k => brief.recipeFieldBindings?.[k]?.label ?? COCO_EVENT_FIELD_LABELS[k as CocoEventTextField] ?? (k === 'socialPlatforms' ? 'Social icons' : 'Experience features')) } };
}
/** Prefer layouts that have actual owners for the facts the user supplied. */
export function cocoFormRecipeCost(recipeId: string, source: Record<string, any>, eventName: string, brief: CocoEventBriefInput) {
    const result = mapCocoFormToRecipe(recipeId, source, eventName, brief, { day: '1', month: 'DEC', weekday: 'TUE' });
    const essential = new Set(['venueName', 'address', 'date', 'startTime', 'endTime', 'djs', 'rsvpContact', 'entryFee']);
    return result.report.unplacedFields.reduce((cost, key) => cost + (essential.has(key) ? 8 : 1), 0) + result.report.fitWarnings.length;
}

export type CocoFormFormat = 'square' | 'story';
export type CocoFormLimit = { maxLength: number; maxLines: number };
export type CocoRecipeFormCapabilities = {
    fields: string[];
    limits: Record<string, CocoFormLimit>;
    fieldFormats: Record<string, CocoFormFormat[]>;
    byFormat: Record<CocoFormFormat, Record<string, CocoFormLimit>>;
    bindings: Record<string, CocoRecipeFieldBinding>;
};

function authoredText(source: Record<string, any>, o: TextOwner): string {
    return String(source.cocoAuthoredText?.[o.id] ?? (source.cocoCompositionSystem?.compiledObjectOverrides?.[o.id]?.text ?? o.text) ?? '');
}

/** Keep the complete brief in the project; only route applicable facts to paint. */
export function cocoBriefForFormat(brief: CocoEventBriefInput, format: unknown): CocoEventBriefInput {
    if (!brief.fieldFormats || (format !== 'square' && format !== 'story')) return brief;
    const scoped = { ...brief };
    for (const [field, targets] of Object.entries(brief.fieldFormats)) {
        if (!targets.includes(format)) delete (scoped as Record<string, unknown>)[field];
    }
    const socialFormats = brief.fieldFormats.socialPlatforms ?? brief.fieldFormats.socials;
    if (socialFormats && !socialFormats.includes(format)) scoped.socialPlatforms = [];
    return scoped;
}

/** A new selection cannot inherit unsupported facts from another recipe. */
export function cocoBriefForCapabilities(brief: CocoEventBriefInput, capabilities: CocoRecipeFormCapabilities): CocoEventBriefInput {
    const clean = { ...brief, fieldFormats: capabilities.fieldFormats, recipeFieldBindings: capabilities.bindings };
    for (const field of [...Object.keys(COCO_EVENT_FIELD_LABELS), ...Object.keys(brief).filter(k => k.startsWith('recipe:'))]) {
        if (!capabilities.fields.includes(field)) (clean as Record<string, unknown>)[field] = '';
    }
    if (!capabilities.fieldFormats.socialPlatforms?.length && !capabilities.fields.includes('socials')) clean.socialPlatforms = [];
    if (!capabilities.fields.includes('experienceFeatures')) clean.experienceFeatures = [];
    return clean;
}

/** Union of dedicated authored slots, with routing and capacity per format. */
export function cocoRecipeFormCapabilities(recipeId: string, formats: Record<string, any>): CocoRecipeFormCapabilities {
    const direct: Record<string, SourceKey> = {
        headline2: 'subtitle', tagline: 'subtitle', presenterName: 'presenterName',
        date: 'date', day: 'date', month: 'date', weekday: 'date', year: 'date',
        time: 'startTime', endTime: 'endTime', venueName: 'venueName', address: 'address',
        djs: 'djs', hosts: 'hosts', performers: 'performers', musicPolicy: 'musicPolicy',
        dressCode: 'dressCode', entryFee: 'entryFee', ageRequirement: 'ageRequirement',
        responsibleDrinking: 'responsibleDrinking', socials: 'socials', website: 'website',
        ticketLink: 'ticketLink', contacts: 'rsvpContact', offers: 'mainPromotion', eventDetails: 'eventDetails',
        drinkSpecials: 'drinkSpecials', hookahSpecials: 'hookahSpecials', bottleSpecials: 'bottleSpecials',
        freeEntryCondition: 'freeEntryCondition', entryRestrictions: 'entryRestrictions', promotionDeadline: 'promotionDeadline',
    };
    const bindings: Record<string, CocoRecipeFieldBinding> = {};
    const identities = new Map<string, string>();
    const byFormat = { square: {}, story: {} } as CocoRecipeFormCapabilities['byFormat'];
    const groupFor = (key: string) => COCO_EVENT_FIELD_GROUPS.find(group => group.fields.some(([field]) => field === key))?.label ?? 'More details';
    const fieldLabel = (o: TextOwner, key: string) => {
        const id = o.id.replace(/[-_]/g, '').toLowerCase();
        const reviewed = cocoFormObjectContract(recipeId, o.id);
        if (reviewed?.label) return reviewed.label;
        if (recipeId === 'bad-girls' && id === 'only') return 'Tagline ending';
        if (recipeId === 'glow-in-the-dark' && id === 'bucket') return 'Motto';
        if (['beat-therapy', 'bad-girls'].includes(recipeId) && id === 'tables') return 'Table availability';
        const labels: Record<string, string> = {
            terms: 'Terms and conditions', motto: 'Motto', mood: 'Mood line', slogan: 'Slogan', invitation: 'Invitation', recurrence: 'Recurring event note', perks: 'Perks', city: 'City / area', venuedescriptor: 'Venue description',
            club: 'Venue description', views: 'Motto', parking: 'Parking and guest perks', railtext: 'Music and atmosphere',
            brand: 'Brand name', brandsub: 'Venue description', escape: 'Event tagline', benefits: 'Event highlights', live: 'Live entertainment',
            rooftop: 'Venue area', lounge: 'Lounge area', invite: 'Invitation', invitedate: 'Invitation date', tickets: 'Ticket information',
            rsvpnote: 'Reservation instructions', prefix: 'Headline prefix', dj: 'DJ performance details', vibes: 'Mood line',
            service1: 'Drink offer', service2: 'Music and atmosphere', service3: 'Guest amenities', district: 'City / area', lessons: 'Lessons or activities',
            doors: 'Doors and opening time', and: 'Headline linking words', perperson: 'Price basis', included: 'What is included', napkin: 'Motto', aside: 'Event tagline',
            venuesuffix: 'Venue description', signoff: 'Guest reminder', connector: 'Headline linking words', rail: 'Event highlights', sundays: 'Recurring event note', tropical: 'Music and atmosphere',
        };
        if (labels[id]) return labels[id];
        const offer = id.match(/^offer(one|two|three)(price|copy)$/);
        if (offer) return `Offer ${({ one: 1, two: 2, three: 3 } as Record<string, number>)[offer[1]]} ${offer[2] === 'price' ? 'price' : 'description'}`;
        const numberedOffer = id.match(/^(price|item)(\d+)$/);
        if (numberedOffer) return `Offer ${numberedOffer[2]} ${numberedOffer[1] === 'price' ? 'price' : 'description'}`;
        if (/^dj\d+$/.test(id)) return `DJ ${id.slice(2)}`;
        if (key.startsWith('recipe:')) return 'Additional text';
        return COCO_EVENT_FIELD_LABELS[key as CocoEventTextField] ?? 'Additional text';
    };
    for (const format of ['square', 'story'] as const) {
        const source = formats[format] ?? {}, system = source.cocoCompositionSystem;
        const titleOwners = cocoHeadlineOwners(recipeId, source);
        const titleIds = new Set(titleOwners.map(o => o.id));
        const titleBindings = new Set(titleOwners.map(o => o.binding?.text).filter(Boolean));
        const objects: TextOwner[] = system?.compiledDocument?.objects ?? [];
        for (const o of objects) {
            if (o.kind !== 'text' || /^coco-form-/.test(o.id) || system.compiledObjectOverrides?.[o.id]?.removed) continue;
            if (o.id === cocoHeadlineConnectorId(recipeId)) continue;
            if (!cocoTextBackdropAvailable(o, system) || titleIds.has(o.id) || (o.binding?.text && titleBindings.has(o.binding.text))) continue;
            const reviewed = cocoFormObjectContract(recipeId, o.id);
            const reference = authoredText(source, o);
            const original = reviewed?.maxLines === 1 ? reference.replace(/\s*\n\s*/g, ' ') : reference;
            if (!original.trim()) continue; // Author-cleared objects are not form slots.
            const semantic = meaning({ ...o, text: original }, recipeId);
            if (semantic === 'designCopy' || semantic === 'label' || semantic === 'boundLabel' || semantic === 'ordinal' || semantic === 'meridiem') continue;
            const base = o.id === 'terms' ? 'entryRestrictions' : direct[semantic] ?? `recipe:${o.id}`;
            const calendar = base === 'date';
            const lineList = base === 'djs' || base === 'musicPolicy';
            // Same object across formats is one input. Distinct objects with the
            // same semantic category must remain separate, even if one is wider.
            const identity = calendar ? 'calendar' : lineList ? `list:${base}` : `${base}:${o.id}`;
            let key = identities.get(identity);
            if (!key) {
                key = bindings[base] ? `recipe:${o.id}` : base;
                if (bindings[key]) key = `recipe:${format}:${o.id}`;
                identities.set(identity, key);
                bindings[key] = { label: reviewed?.label ?? (lineList ? COCO_EVENT_FIELD_LABELS[base] : fieldLabel(o, base)), ...(reviewed?.guidance ? { guidance: reviewed.guidance } : {}), group: reviewed?.group ?? groupFor(base), kind: calendar ? 'date' : lineList ? 'lines' : 'text', targets: {}, originalText: {} };
            }
            const binding = bindings[key];
            (binding.targets[format] ??= []).push(o.id);
            binding.originalText[format] = (calendar || lineList) && binding.originalText[format] ? `${binding.originalText[format]}${calendar ? ' ' : '\n'}${original}` : original;
            const saved = binding.originalText[format]!;
            byFormat[format][key] = { maxLength: base === 'eventDetails' ? 50 : saved.length + 10, maxLines: calendar ? 1 : saved.trimEnd().split('\n').length };
        }
        const qr = objects.find(o => o.kind !== 'text' && !o.id.startsWith('coco-form-') && !(system?.compiledObjectOverrides?.[o.id]?.cocoFormQrWasRemoved ?? system?.compiledObjectOverrides?.[o.id]?.removed) && /qr/i.test(o.id));
        if (qr) {
            const caption = objects.find(o => o.kind === 'text' && /qr/i.test(o.id) && !system.compiledObjectOverrides?.[o.id]?.removed && authoredText(source, o).trim());
            for (const [key, owner, original] of [['qrDestination', qr, ''], ...(caption ? [['qrLabel', caption, authoredText(source, caption)]] : [])] as [string, TextOwner, string][]) {
                bindings[key] ??= { label: COCO_EVENT_FIELD_LABELS[key as CocoEventTextField], group: 'Reservations, socials & QR', kind: 'qr', targets: {}, originalText: {} };
                bindings[key].targets[format] = [owner.id]; bindings[key].originalText[format] = original;
                byFormat[format][key] = { maxLength: key === 'qrDestination' ? 160 : original.length + 10, maxLines: 1 };
            }
        }
    }
    // A shared answer cannot satisfy different line structures. Show an
    // explicitly scoped field for each format instead of flattening Story.
    for (const [key, binding] of Object.entries(bindings)) {
        if (binding.kind === 'date' || binding.kind === 'qr' || !binding.originalText.square || !binding.originalText.story) continue;
        const shape = (text: string) => JSON.stringify(text.trimEnd().split('\n').map(line => {
            const plan = cocoInputLine(line, binding.label === 'Dress code');
            return [plan.fixed, plan.prefix.toLowerCase(), plan.suffix.toLowerCase()];
        }));
        if (shape(binding.originalText.square) === shape(binding.originalText.story)) continue;
        const storyKey = `recipe:story:${key}`;
        bindings[storyKey] = { ...binding, targets: { story: binding.targets.story }, originalText: { story: binding.originalText.story } };
        byFormat.story[storyKey] = byFormat.story[key];
        delete byFormat.story[key];
        binding.targets = { square: binding.targets.square };
        binding.originalText = { square: binding.originalText.square };
    }
    const fields = Object.keys(bindings);
    const fieldFormats = Object.fromEntries(fields.map(key => [key, (['square','story'] as const).filter(format => byFormat[format][key])]));
    const limits = Object.fromEntries(fields.map(key => [key, {
        maxLength: Math.min(...fieldFormats[key].map(format => byFormat[format][key].maxLength)),
        maxLines: Math.min(...fieldFormats[key].map(format => byFormat[format][key].maxLines)),
    }]));
    // Icon strips can exist without a handle. Keep array choices separate from
    // text bindings so the form does not invent a handle or a text input.
    const socialFormats = (['square', 'story'] as const).filter(format => {
        if (byFormat[format].socials) return true;
        if (formats[format]?.cocoFormSocialNativeAnchor || cocoNativeSocialSamples(formats[format] ?? {}).length) return true;
        const system = formats[format]?.cocoCompositionSystem;
        return system?.compiledDocument?.objects.some((o: TextOwner) => o.kind !== 'text' && /^(social|socialIcons?|instagram)$/i.test(o.id) &&
            !(system.compiledObjectOverrides?.[o.id]?.cocoFormSocialWasRemoved ?? system.compiledObjectOverrides?.[o.id]?.removed));
    });
    if (socialFormats.length) fieldFormats.socialPlatforms = socialFormats;
    return { fields, limits, fieldFormats, byFormat, bindings };
}

/** A removed brush/banner also removes the text slot it was supporting. */
export function cocoTextBackdropAvailable(object: any, system: any): boolean {
    return !(system?.compiledDocument?.objects ?? []).some((asset: any) => {
        const edit = system.compiledObjectOverrides?.[asset.id];
        return asset.kind !== 'text' && /(brush|banner|plate|ribbon|panel)/i.test(asset.id) && edit?.removed && !edit.cocoFormBackdropHidden && textInsideBackdrop(object, asset);
    });
}

function textInsideBackdrop(object: any, asset: any): boolean {
    const box = object.bounds, b = asset.bounds;
    if (!box?.width || !box?.height || !b) return false;
    const width = Math.max(0, Math.min(box.x + box.width, b.x + b.width) - Math.max(box.x, b.x));
    const height = Math.max(0, Math.min(box.y + box.height, b.y + b.height) - Math.max(box.y, b.y));
    return width * height / (box.width * box.height) > .8;
}
