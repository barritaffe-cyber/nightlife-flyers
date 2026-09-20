import { COCO_EVENT_FIELD_LABELS, type CocoRecipeFieldBinding } from './eventBriefFields.ts';
import { cocoFieldLines } from './formFieldLayout.ts';

/** User instructions describe the field's purpose, never quote the recipe copy. */
export function cocoFormFieldGuidance(field: string, binding?: CocoRecipeFieldBinding, maxLines?: number) {
  if (field === 'date') return 'Include the year, like Nov 7, 2026, so Coco can calculate the weekday. The year won’t appear on your flyer.';
  if ((!binding && field === 'musicPolicy') || binding?.label === 'Music genres / policy') {
    const lines = cocoFieldLines(binding, maxLines).filter(line => !line.fixed);
    return lines.length > 1
      ? 'Add one music genre per box, like Hip Hop or Afrobeats.'
      : 'Separate genres with • or |, like Hip Hop | Afrobeats | Reggae. The separators appear on your flyer.';
  }
  if (field === 'subtitle' || ['Subtitle / tagline', 'Event tagline'].includes(binding?.label ?? '')) return 'A tagline is a short phrase that sets the vibe, like Good Music, Better Company.';
  if (binding?.guidance) return binding.guidance;
  const label = binding?.label ?? '';
  const special: Record<string, string> = {
    'Terms and conditions': 'Add any door rules or limits on the special.',
    'Mood line': 'Add a few words for the vibe, like Music, Friends, or Dancing.',
    Motto: 'Add a short line that fits your night.',
    Slogan: 'Add a short line people will remember.',
    Invitation: 'Let people know if they need an invite or a spot on the guest list.',
    'Recurring event note': 'Say when it happens, like Every Friday.',
    Perks: 'List the extras, like free parking or a welcome drink.',
    'City / area': 'Add the city or neighborhood.',
    'Venue description': 'Add a few words about the spot, like Rooftop Bar or Beach Club.',
    'Parking and guest perks': 'Add parking info or extras, like Free Valet.',
    'Music and atmosphere': 'Add the music and vibe, like R&B and Slow Jams.',
    'Brand name': 'Add the promoter, crew, or club name.',
    'Event tagline': 'Add a short line that fits the vibe.',
    'Event highlights': 'Add what’s happening, like Guest DJs, Karaoke, or Pool Party.',
    'Live entertainment': 'Add the live act or show, plus the set time if needed.',
    'Venue area': 'Add the room or area, like Main Room or Rooftop.',
    'Lounge area': 'Add the lounge name or where to find it.',
    'Invitation date': 'Add the date for the invite.',
    'Ticket information': 'Add ticket info, like Early Bird Tickets or Pay at the Door.',
    'Reservation instructions': 'Tell people how to book a table or get on the guest list.',
    'Tagline ending': 'Finish the line with a short word or phrase.',
    'Table availability': 'Add table info, like VIP Tables Available.',
    'Headline prefix': 'Add the words that go before the event name.',
    'DJ performance details': 'Add the DJ name or set time.',
    'Drink offer': 'Add the drink special, like 2-for-1 Cocktails.',
    'Guest amenities': 'Add an extra, like Free Valet or VIP Lounge.',
    'Lessons or activities': 'Add what’s happening and when, like Salsa Lessons at 8PM.',
    'Doors and opening time': 'Add the door time, like 10PM.',
    'Headline linking words': 'Add the word that joins the two parts of the event name.',
    'Price basis': 'Say if the price is per person, per table, or per group.',
    'What is included': 'Say what’s included, like Entry + One Drink.',
    'Guest reminder': 'Add a short reminder for the night, like Bring ID.',
  };
  if (special[label]) return special[label];
  if (/^Offer \d+ price$/.test(label)) return 'Add the price for this special. Coco keeps any money symbol shown beside the box.';
  if (/^Offer \d+ description$/.test(label)) return 'Say what’s in the special, like One Bottle + Mixers.';
  const instructions: Record<string, string> = {
    subtitle: 'Add a short line to go with the event name.',
    presenterName: 'Add the promoter, crew, or club putting on the event.',
    startTime: 'Add the start time, like 10PM. Add the finish time if there’s a box for it.',
    endTime: 'Add the finish time, like 4AM.',
    venueName: 'Add the club, bar, or venue name.',
    address: 'Add the street address and city so people can find the spot.',
    djs: 'Add one DJ or artist name per box.',
    hosts: 'Add the host or MC names.',
    performers: 'Add the artists or bands performing live.',
    additionalActs: 'Add anyone else on the lineup.',
    musicPolicy: 'Add the music, like Dancehall, Afrobeats, Hip Hop, or House.',
    eventDetails: 'Add a short note about the night or what’s included.',
    dressCode: 'Add just the style or colors, like casual, all white, or white + neon. Coco adds the wording shown beside the box.',
    mainPromotion: 'Add the main special, like Free Entry Before 11PM.',
    bottleSpecials: 'Add the bottle deal and price, like 2 Bottles for $200.',
    drinkSpecials: 'Add the drink special and when it runs, like 2-for-1 Cocktails Until 11PM.',
    foodSpecials: 'Add the food special and price, like $5 Tacos.',
    hookahSpecials: 'Add the hookah special and price.',
    promotionDeadline: 'Add when the special ends, like Before 11PM.',
    additionalOffers: 'Add any other specials for the night.',
    entryFee: 'Add the price, or type Free. Coco adds any ticket wording and money symbol shown in this design.',
    ageRequirement: 'Add the minimum age, like 18 or 21. Coco adds the rest of the wording.',
    freeEntryCondition: 'Say who gets in free and until when, like Ladies Free Before 11PM.',
    entryRestrictions: 'Add any door rules, like No Sportswear or ID Required.',
    responsibleDrinking: 'Add a short reminder, like Drink Responsibly.',
    rsvpContact: 'Add the number for RSVPs or the guest list.',
    bookingContact: 'Add the number for table bookings.',
    website: 'Add the event or venue website.',
    email: 'Add the email for questions or bookings.',
    ticketLink: 'Paste the ticket link.',
    socials: 'Add your @handle so people can follow you.',
    qrDestination: 'Paste the link people should see when they scan the QR code.',
    qrLabel: 'Add a short line, like Scan for Tickets.',
  };
  const direct = instructions[Object.entries(COCO_EVENT_FIELD_LABELS).find(([, name]) => name === label)?.[0] ?? ''] ?? instructions[field];
  if (direct) return direct;
  // Duplicate semantic fields have recipe:* keys but retain descriptive labels.
  const labels: Record<string, string> = {
    'Short event details': 'eventDetails', 'Main promotion': 'mainPromotion',
    'RSVP contact': 'rsvpContact', 'Venue name': 'venueName',
    'Full address': 'address', 'Subtitle / tagline': 'subtitle',
  };
  return instructions[labels[label]] ?? 'Add a short line for your flyer.';
}

/** Display copy stays separate from saved recipe labels and field routing. */
export function cocoFormDisplayLabel(label: string): string {
  const labels: Record<string, string> = {
    'Brand name': 'Promoter / crew / club',
    'Presenter / promoter': 'Promoter / crew',
    'Subtitle / tagline': 'Tagline',
    'DJs / headline acts': 'DJ lineup',
    'Music genres / policy': 'Music',
    'Additional acts': 'More acts',
    'Experience & specials': 'Vibe & specials',
    'Experience features': 'Extras for the night',
    'Main promotion': 'Main special',
    'Offer deadline': 'Special ends',
    'Other offers': 'More specials',
    Admission: 'At the door',
    'Entry fee': 'Tickets / door price',
    'Age requirement': 'Age limit',
    'Free-entry condition': 'Who gets in free?',
    'Entry restrictions': 'Door rules',
    'Reservations, socials & QR': 'Bookings, socials & links',
    'RSVP contact': 'RSVP / guest list number',
    'Table booking contact': 'Table booking number',
    'QR destination': 'QR code link',
    'QR label': 'QR code message',
    'Recurring event note': 'How often?',
    'Venue description': 'About the spot',
    'Parking and guest perks': 'Parking & extras',
    'Music and atmosphere': 'Music & vibe',
    'Event tagline': 'Tagline',
    'Event highlights': 'What’s happening',
    'Live entertainment': 'Live acts',
    'Ticket information': 'Ticket info',
    'Reservation instructions': 'How to book',
    'Tagline ending': 'Finish the line',
    'Table availability': 'VIP tables',
    'Headline prefix': 'Before the event name',
    'Headline linking words': 'Words between the event name',
    'DJ performance details': 'DJ / set time',
    'Drink offer': 'Drink special',
    'Guest amenities': 'Extras',
    'Price basis': 'Price per person or table?',
    'Guest reminder': 'Quick reminder',
  };
  return labels[label] ?? label;
}
