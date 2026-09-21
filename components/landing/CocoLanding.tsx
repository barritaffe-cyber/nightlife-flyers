'use client';
import {useState, useEffect, useRef} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {stageHomeProject} from '../../lib/coco/homeProjectHandoff';
import Image from 'next/image';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import LiveFlyerDemo from './LiveFlyerDemo';
import designCatalog from './designCatalog.json';
import PricingPlans from '../ui/PricingPlans';
import PublicSiteFooter from '../ui/PublicSiteFooter';
import styles from './CocoLanding.module.css';

const designs = [
  {id:'ycee-live',name:'YCEE Live',mood:'Live music',label:'Gold artist spotlight'},
  {id:'we-outside',name:'We Outside',mood:'After dark',label:'Neon club night'},
  {id:'brunch-sundays',name:'Brunch Sundays',mood:'Daytime',label:'Sunday brunch'},
] as const;
const freshDesigns = [
  {id:'ycee-live',name:'YCEE Live',mood:'Artist spotlight',label:'Gold lettering. Main-stage energy.'},
  {id:'honey-nights',name:'Honey Nights',mood:'Late-night luxury',label:'Warm gold. A little after-dark indulgence.'},
  {id:'girl-code-rose',name:'Girl Code Rose',mood:'Rooftop nights',label:'Rose chrome with a sunset state of mind.'},
];
const vibes = [
  {name:'R&B',id:'honey-nights',title:'Honey Nights'},
  {name:'Afrobeats',id:'afro-sunset',title:'Afro Sunset'},
  {name:'Dancehall',id:'reggae-jams',title:'Reggae Jams'},
  {name:'Latin',id:'salsa-noche',title:'Salsa Noche'},
  {name:'Brunch',id:'brunch-sundays',title:'Brunch Sundays'},
  {name:'Lounge',id:'girl-code-rose',title:'Girl Code Rose'},
];
const seasons = [
  {month:'OCT',name:'Halloween',headline:'After dark.\nWay after dark.',detail:'Haunted parties & costume nights',style:'halloween',symbol:'✳'},
  {month:'NOV',name:'Thanksgiving weekend',headline:'Good people.\nGreat nights.',detail:'Reunions, friendsgiving & long weekends',style:'thanksgiving',symbol:'✺'},
  {month:'DEC',name:'Christmas parties',headline:'A little more\nsparkle.',detail:'Festive nights & end-of-year celebrations',style:'christmas',symbol:'✧'},
  {month:'DEC / JAN',name:'New Year’s Eve',headline:'Make an\nentrance.',detail:'Midnight countdowns & fresh beginnings',style:'newyear',symbol:'✷'},
];
const preview = (id:string, format='square') => `/generated-flyers/${id}-${format}-preview.png`;

export default function CocoLanding(){
  const router=useRouter();
  const filePicker=useRef<HTMLInputElement>(null);
  const [homeReady,setHomeReady]=useState(false);
  const [opening,setOpening]=useState(false),[openError,setOpenError]=useState('');
  const openSavedDesign=async(file?:File)=>{
    if(!file)return;
    setOpening(true);setOpenError('');
    try{
      const key=await stageHomeProject(file);
      router.push(`/?studio=1&openProject=${encodeURIComponent(key)}`);
    }catch{
      setOpenError('Could not open this file. Please allow local storage and try again.');
      setOpening(false);
    }
  };
  const [format,setFormat]=useState<'square'|'story'>('square');
  const [heroIndex,setHeroIndex]=useState(0),[paused,setPaused]=useState(false),[vibe,setVibe]=useState(0),[eventName,setEventName]=useState('GIRL CODE'),[query,setQuery]=useState('');
  const [createHref,setCreateHref]=useState('/?studio=1&coco=1');
  useEffect(()=>{
    const params=new URLSearchParams({studio:'1',coco:'1'});
    new URLSearchParams(window.location.search).forEach((value,key)=>{if(/^utm_/.test(key)||['gclid','fbclid'].includes(key))params.set(key,value);});
    setCreateHref(`/?${params}`);
    setHomeReady(true);
  },[]);
  useEffect(()=>{
    if(paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const timer=window.setInterval(()=>setHeroIndex(i=>(i+1)%designs.length),6000);
    return ()=>window.clearInterval(timer);
  },[paused]);
  const designHref=(id:string)=>`${createHref}&cocoDesign=${encodeURIComponent(`recipe_${id.replaceAll('-','_')}`)}`;
  const searchTerms=query.toLowerCase().replace(/r&b/g,'rnb').split(/\s+/).filter(Boolean);
  const matches=designCatalog.filter(item=>searchTerms.every(term=>item.search.toLowerCase().replace(/r&b/g,'rnb').includes(term))).slice(0,6);
  const createLink=(label='Tell Coco about your event')=><Link href={createHref} className={styles.primary}>{label}<ArrowRight size={17} aria-hidden/></Link>;
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.wordmark} aria-label="Nightlife Flyers home"><span className={styles.nfMark}><Image src="/branding/nf-logo-512.png" alt="NF" width={512} height={512} sizes="100px" priority/></span><span className={styles.brandName}>NIGHTLIFE<span>FLYERS</span></span></Link>
      <nav aria-label="Main navigation"><a href="#new">What’s new</a><a href="#coming-soon">Coming soon</a><a href="#pricing">Pricing</a><Link href="/?studio=1&flyers=1">My flyers <ArrowUpRight size={13} aria-hidden/></Link></nav>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="coco-hero-title">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>Nightlife Flyers</p>
        <h1 id="coco-hero-title"><Image className={styles.heroCampaign} src="/generated-flyers/flyers%20in%205%20logo.png" alt="Flyers in Five." width={1536} height={1024} sizes="(max-width:700px) 260px, 340px" priority/></h1>
        <p className={styles.intro}>You bring the event.<br/>Coco brings the design.</p>
        <p className={styles.steps}>Tell Coco about your event. Pick your look. Make it yours.</p>
        <div className={styles.homeActions} aria-label="Start your flyer">
          {createLink()}
          <Link href={createHref.replace('coco=1','browse=1')} className={styles.homeSecondary}>Browse templates <ArrowUpRight size={17} aria-hidden/></Link>
          <button type="button" disabled={!homeReady||opening} onClick={()=>filePicker.current?.click()} className={styles.homeSecondary}>{opening?'Opening your design…':'Open saved design'} <ArrowUpRight size={17} aria-hidden/></button>
          <input ref={filePicker} type="file" accept=".nflyer,.json,application/json,application/vnd.nightlife-flyers.project+json" aria-label="Open previous flyer file" className={styles.fileInput} onChange={e=>{void openSavedDesign(e.target.files?.[0]);e.target.value='';}}/>
          {openError&&<p role="alert" className={styles.openError}>{openError}</p>}
        </div>
        <p className={styles.priceHint}>Square + Story. Ready to post. <span>·</span> From $5</p>
        <a href="#walkthrough" className={styles.quietLink}>See how Coco works ↓</a>
        </div>
        <div className={styles.heroShowcase}>
          <div className={styles.heroArtwork}>{designs.map((item,i)=><Image key={item.id} src={preview(item.id)} alt={`${item.name} Square flyer — ${item.label}`} width={1080} height={1080} sizes="(max-width:700px) 88vw, 480px" priority={i===0} className={heroIndex===i?styles.heroActive:styles.heroInactive} aria-hidden={heroIndex!==i}/>)}</div>
          <div className={styles.storyCompanion}><Image src={preview(designs[heroIndex].id,'story')} alt={`${designs[heroIndex].name} Story format`} width={1080} height={1920} sizes="(max-width:700px) 27vw, 170px"/></div>
          <div className={styles.heroControls}><span>{designs[heroIndex].name}<small>Square + Story. Always together.</small></span><div>{designs.map((item,i)=><button key={item.id} aria-label={`Show ${item.name}`} aria-pressed={heroIndex===i} onClick={()=>{setHeroIndex(i);setPaused(true);}}>{String(i+1).padStart(2,'0')}</button>)}<button onClick={()=>setPaused(!paused)} aria-label={paused?'Play featured designs':'Pause featured designs'}>{paused?'▶':'Ⅱ'}</button></div></div>
        </div>
      </section>
      <div className={styles.benefits}><div><strong>Made for nightlife.</strong><span>Your party, your crowd, your scene.</span></div><div><strong>About five minutes.</strong><span>Coco gets your flyer started.</span></div><div><strong>Fresh looks, regularly.</strong><span>More styles for your next event.</span></div><div><strong>Make it yours.</strong><span>Quick tweaks until it feels right.</span></div></div>
      <section className={styles.brandStatement} aria-labelledby="nightlife-title"><h2 id="nightlife-title">We know nightlife.</h2><p>For the venues, promoters, DJs, and businesses<br className={styles.desktopBreak}/> that bring the night to life.</p></section>
      <section id="new" className={styles.contentSection} aria-labelledby="new-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>The latest from NF</p><h2 id="new-title">Just dropped.</h2></div><p>Three fresh designs. Make one yours.</p></div>
        <div className={styles.newGrid}>{freshDesigns.map(item=><Link href={designHref(item.id)} key={item.id} className={styles.designCard}><div className={styles.cardImage}><Image src={preview(item.id)} alt={`${item.name} flyer`} width={1080} height={1080} sizes="(max-width:700px) 86vw, 350px"/><span className={styles.newBadge}>NEW DESIGN</span><span className={styles.cardAction}>Make it yours <ArrowUpRight size={18}/></span></div><div className={styles.cardCaption}><h3>{item.name}</h3><span>{item.mood}</span></div></Link>)}</div>
      </section>
      <section id="vibes" className={styles.contentSection} aria-labelledby="vibes-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Set the mood</p><h2 id="vibes-title">Find your vibe.</h2></div><p>From sunlit brunches to the last song.<br/>Start somewhere that feels like you.</p></div>
        <label className={styles.searchLabel} htmlFor="design-search">What are you making?</label><input id="design-search" type="search" className={styles.designSearch} placeholder="Search R&B, Ladies Night, Salsa, Rooftop..." value={query} onChange={e=>setQuery(e.target.value)}/>
        <div className={styles.vibeButtons} role="group" aria-label="Flyer vibes">{vibes.map((item,i)=><button key={item.name} aria-pressed={vibe===i} onClick={()=>{setVibe(i);setQuery('');}}>{item.name}<ArrowUpRight size={14}/></button>)}</div>
        {query.trim()?<div aria-live="polite"><p className={styles.searchCount}>{matches.length?`${matches.length} designs to explore`:'No matching designs yet. Try a genre or choose one of the vibes above.'}</p><div className={styles.searchResults}>{matches.map(item=><Link key={item.key} href={`${createHref}&cocoDesign=${encodeURIComponent(item.key)}`}><Image src={item.preview} alt={item.name} width={540} height={540} sizes="(max-width:700px) 42vw, 260px"/><h3>{item.name}</h3><span>Use this design ↗</span></Link>)}</div></div>:<div className={styles.vibeResult} aria-live="polite"><Image src={preview(vibes[vibe].id)} alt={`${vibes[vibe].title} ${vibes[vibe].name} design`} width={1080} height={1080} sizes="(max-width:700px) 80vw, 310px"/><div><p className={styles.eyebrow}>{vibes[vibe].name} / Selected for you</p><h3>{vibes[vibe].title}</h3><p>Your next event starts here.<br/>Let Coco make it yours.</p><Link className={styles.primary} href={designHref(vibes[vibe].id)}>Use this design <ArrowRight size={17}/></Link></div></div>}
      </section>
      <section id="walkthrough" className={styles.walkthrough} aria-labelledby="walkthrough-title">
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>See it become yours</p><h2 id="walkthrough-title">Your event. Your flyer.</h2><p>A few quick tweaks. A flyer that feels like you.</p></div>
        <div className={styles.demo}>
          <div className={styles.demoCopy}><p className={styles.eyebrow}>Your night starts here</p><h3 className={styles.tryTitle}>Same design.<br/>A whole new night.</h3><label className={styles.eventLabel} htmlFor="demo-event">Your event name</label><input id="demo-event" className={styles.eventInput} value={eventName} maxLength={32} onChange={e=>setEventName(e.target.value)} placeholder="Try AFTER DARK"/><p className={styles.demoHint}>Try AFTER DARK. See your event on the flyer.</p><div className={styles.moods} role="group" aria-label="Preview format">{(['square','story'] as const).map(f=><button key={f} aria-pressed={format===f} onClick={()=>setFormat(f)}>{f==='square'?'Square':'Story'}</button>)}</div><Link className={styles.primary} href={`${createHref}&eventName=${encodeURIComponent(eventName.trim())}`}>Create my flyer <ArrowRight size={17}/></Link><p className={styles.demoHint}>Square + Story. Both included.</p></div>
          <figure className={styles.demoPreview} data-format={format}><LiveFlyerDemo name={eventName} format={format}/><figcaption>{format==='story'?'Story · 9:16':'Square · 1:1'}<span>Girl Code Rose</span></figcaption></figure>
        </div>
      </section>
      <section id="coming-soon" className={styles.seasonSection} aria-labelledby="season-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>On Coco’s calendar</p><h2 id="season-title">Coming soon.</h2></div><p>Halloween to New Year’s Eve. More nights to make yours.</p></div>
        <div className={styles.seasonGrid}>{seasons.map(item=><article key={item.style} className={`${styles.seasonCard} ${styles[item.style]}`}><div className={styles.seasonTop}><span>{item.month}</span><span>In the works</span></div><span className={styles.seasonSymbol} aria-hidden>{item.symbol}</span><h3>{item.headline}</h3><div className={styles.seasonBottom}><h4>{item.name}</h4><p>{item.detail}</p></div></article>)}</div>
        <p className={styles.seasonNote}>Concept previews · Designs and release dates to be announced.</p>
      </section>
      <section id="pricing" className={styles.pricing} aria-label="Choose your Coco plan"><PricingPlans embedded/></section>
      <section className={styles.lastCall}><Image className={styles.campaignLogo} src="/generated-flyers/flyers%20in%205%20logo.png" alt="Flyers in 5" width={1536} height={1024} sizes="150px"/><h2>Your next night starts here.</h2><p>You bring the event. Coco brings the design.</p>{createLink()}</section>
    </main>
    <PublicSiteFooter/>
  </div>;
}
