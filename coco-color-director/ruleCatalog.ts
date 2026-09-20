import type{ColorRole,PalettePolicy}from"./types.ts";
export type ColorDirectorRule={id:string;story:string;principle:string;condition:string;decision:string;role:ColorRole;policy:PalettePolicy;weight:number};
export const COLOR_DIRECTOR_RULES:ColorDirectorRule[]=[
{
id:"luxury-tropical-brunch:dominant:1",
story:"luxury-tropical-brunch",
principle:"dominant",
condition:"luxury-tropical-brunch dominant variant 1",
decision:"Apply dominant policy for luxury-tropical-brunch",
role:"backgroundSecondary",
policy:"warm-premium",
weight:77
},
{
id:"luxury-tropical-brunch:dominant:2",
story:"luxury-tropical-brunch",
principle:"dominant",
condition:"luxury-tropical-brunch dominant variant 2",
decision:"Apply dominant policy for luxury-tropical-brunch",
role:"headline",
policy:"champagne-black",
weight:84
},
{
id:"luxury-tropical-brunch:dominant:3",
story:"luxury-tropical-brunch",
principle:"dominant",
condition:"luxury-tropical-brunch dominant variant 3",
decision:"Apply dominant policy for luxury-tropical-brunch",
role:"accent",
policy:"tropical-emerald",
weight:91
},
{
id:"luxury-tropical-brunch:dominant:4",
story:"luxury-tropical-brunch",
principle:"dominant",
condition:"luxury-tropical-brunch dominant variant 4",
decision:"Apply dominant policy for luxury-tropical-brunch",
role:"metadata",
policy:"rose-glamour",
weight:98
},
{
id:"luxury-tropical-brunch:support:1",
story:"luxury-tropical-brunch",
principle:"support",
condition:"luxury-tropical-brunch support variant 1",
decision:"Apply support policy for luxury-tropical-brunch",
role:"dateTime",
policy:"sunset-warm",
weight:74
},
{
id:"luxury-tropical-brunch:support:2",
story:"luxury-tropical-brunch",
principle:"support",
condition:"luxury-tropical-brunch support variant 2",
decision:"Apply support policy for luxury-tropical-brunch",
role:"venue",
policy:"burgundy-intimate",
weight:81
},
{
id:"luxury-tropical-brunch:support:3",
story:"luxury-tropical-brunch",
principle:"support",
condition:"luxury-tropical-brunch support variant 3",
decision:"Apply support policy for luxury-tropical-brunch",
role:"badgeBackground",
policy:"electric-night",
weight:88
},
{
id:"luxury-tropical-brunch:support:4",
story:"luxury-tropical-brunch",
principle:"support",
condition:"luxury-tropical-brunch support variant 4",
decision:"Apply support policy for luxury-tropical-brunch",
role:"badgeText",
policy:"industrial-monochrome",
weight:95
},
{
id:"luxury-tropical-brunch:accent:1",
story:"luxury-tropical-brunch",
principle:"accent",
condition:"luxury-tropical-brunch accent variant 1",
decision:"Apply accent policy for luxury-tropical-brunch",
role:"presenter",
policy:"retro-pop",
weight:71
},
{
id:"luxury-tropical-brunch:accent:2",
story:"luxury-tropical-brunch",
principle:"accent",
condition:"luxury-tropical-brunch accent variant 2",
decision:"Apply accent policy for luxury-tropical-brunch",
role:"footer",
policy:"neutral-editorial",
weight:78
},
{
id:"luxury-tropical-brunch:accent:3",
story:"luxury-tropical-brunch",
principle:"accent",
condition:"luxury-tropical-brunch accent variant 3",
decision:"Apply accent policy for luxury-tropical-brunch",
role:"stroke",
policy:"image-led",
weight:85
},
{
id:"luxury-tropical-brunch:accent:4",
story:"luxury-tropical-brunch",
principle:"accent",
condition:"luxury-tropical-brunch accent variant 4",
decision:"Apply accent policy for luxury-tropical-brunch",
role:"glow",
policy:"warm-premium",
weight:92
},
{
id:"luxury-tropical-brunch:neutral:1",
story:"luxury-tropical-brunch",
principle:"neutral",
condition:"luxury-tropical-brunch neutral variant 1",
decision:"Apply neutral policy for luxury-tropical-brunch",
role:"neutral",
policy:"champagne-black",
weight:99
},
{
id:"luxury-tropical-brunch:neutral:2",
story:"luxury-tropical-brunch",
principle:"neutral",
condition:"luxury-tropical-brunch neutral variant 2",
decision:"Apply neutral policy for luxury-tropical-brunch",
role:"utility",
policy:"tropical-emerald",
weight:75
},
{
id:"luxury-tropical-brunch:neutral:3",
story:"luxury-tropical-brunch",
principle:"neutral",
condition:"luxury-tropical-brunch neutral variant 3",
decision:"Apply neutral policy for luxury-tropical-brunch",
role:"background",
policy:"rose-glamour",
weight:82
},
{
id:"luxury-tropical-brunch:neutral:4",
story:"luxury-tropical-brunch",
principle:"neutral",
condition:"luxury-tropical-brunch neutral variant 4",
decision:"Apply neutral policy for luxury-tropical-brunch",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:89
},
{
id:"luxury-tropical-brunch:contrast:1",
story:"luxury-tropical-brunch",
principle:"contrast",
condition:"luxury-tropical-brunch contrast variant 1",
decision:"Apply contrast policy for luxury-tropical-brunch",
role:"headline",
policy:"burgundy-intimate",
weight:96
},
{
id:"luxury-tropical-brunch:contrast:2",
story:"luxury-tropical-brunch",
principle:"contrast",
condition:"luxury-tropical-brunch contrast variant 2",
decision:"Apply contrast policy for luxury-tropical-brunch",
role:"accent",
policy:"electric-night",
weight:72
},
{
id:"luxury-tropical-brunch:contrast:3",
story:"luxury-tropical-brunch",
principle:"contrast",
condition:"luxury-tropical-brunch contrast variant 3",
decision:"Apply contrast policy for luxury-tropical-brunch",
role:"metadata",
policy:"industrial-monochrome",
weight:79
},
{
id:"luxury-tropical-brunch:contrast:4",
story:"luxury-tropical-brunch",
principle:"contrast",
condition:"luxury-tropical-brunch contrast variant 4",
decision:"Apply contrast policy for luxury-tropical-brunch",
role:"dateTime",
policy:"retro-pop",
weight:86
},
{
id:"luxury-tropical-brunch:skin:1",
story:"luxury-tropical-brunch",
principle:"skin",
condition:"luxury-tropical-brunch skin variant 1",
decision:"Apply skin policy for luxury-tropical-brunch",
role:"venue",
policy:"neutral-editorial",
weight:93
},
{
id:"luxury-tropical-brunch:skin:2",
story:"luxury-tropical-brunch",
principle:"skin",
condition:"luxury-tropical-brunch skin variant 2",
decision:"Apply skin policy for luxury-tropical-brunch",
role:"badgeBackground",
policy:"image-led",
weight:100
},
{
id:"luxury-tropical-brunch:skin:3",
story:"luxury-tropical-brunch",
principle:"skin",
condition:"luxury-tropical-brunch skin variant 3",
decision:"Apply skin policy for luxury-tropical-brunch",
role:"badgeText",
policy:"warm-premium",
weight:76
},
{
id:"luxury-tropical-brunch:skin:4",
story:"luxury-tropical-brunch",
principle:"skin",
condition:"luxury-tropical-brunch skin variant 4",
decision:"Apply skin policy for luxury-tropical-brunch",
role:"presenter",
policy:"champagne-black",
weight:83
},
{
id:"luxury-tropical-brunch:saturation:1",
story:"luxury-tropical-brunch",
principle:"saturation",
condition:"luxury-tropical-brunch saturation variant 1",
decision:"Apply saturation policy for luxury-tropical-brunch",
role:"footer",
policy:"tropical-emerald",
weight:90
},
{
id:"luxury-tropical-brunch:saturation:2",
story:"luxury-tropical-brunch",
principle:"saturation",
condition:"luxury-tropical-brunch saturation variant 2",
decision:"Apply saturation policy for luxury-tropical-brunch",
role:"stroke",
policy:"rose-glamour",
weight:97
},
{
id:"luxury-tropical-brunch:saturation:3",
story:"luxury-tropical-brunch",
principle:"saturation",
condition:"luxury-tropical-brunch saturation variant 3",
decision:"Apply saturation policy for luxury-tropical-brunch",
role:"glow",
policy:"sunset-warm",
weight:73
},
{
id:"luxury-tropical-brunch:saturation:4",
story:"luxury-tropical-brunch",
principle:"saturation",
condition:"luxury-tropical-brunch saturation variant 4",
decision:"Apply saturation policy for luxury-tropical-brunch",
role:"neutral",
policy:"burgundy-intimate",
weight:80
},
{
id:"luxury-tropical-brunch:harmony:1",
story:"luxury-tropical-brunch",
principle:"harmony",
condition:"luxury-tropical-brunch harmony variant 1",
decision:"Apply harmony policy for luxury-tropical-brunch",
role:"utility",
policy:"electric-night",
weight:87
},
{
id:"luxury-tropical-brunch:harmony:2",
story:"luxury-tropical-brunch",
principle:"harmony",
condition:"luxury-tropical-brunch harmony variant 2",
decision:"Apply harmony policy for luxury-tropical-brunch",
role:"background",
policy:"industrial-monochrome",
weight:94
},
{
id:"luxury-tropical-brunch:harmony:3",
story:"luxury-tropical-brunch",
principle:"harmony",
condition:"luxury-tropical-brunch harmony variant 3",
decision:"Apply harmony policy for luxury-tropical-brunch",
role:"backgroundSecondary",
policy:"retro-pop",
weight:70
},
{
id:"luxury-tropical-brunch:harmony:4",
story:"luxury-tropical-brunch",
principle:"harmony",
condition:"luxury-tropical-brunch harmony variant 4",
decision:"Apply harmony policy for luxury-tropical-brunch",
role:"headline",
policy:"neutral-editorial",
weight:77
},
{
id:"luxury-tropical-brunch:temperature:1",
story:"luxury-tropical-brunch",
principle:"temperature",
condition:"luxury-tropical-brunch temperature variant 1",
decision:"Apply temperature policy for luxury-tropical-brunch",
role:"accent",
policy:"image-led",
weight:84
},
{
id:"luxury-tropical-brunch:temperature:2",
story:"luxury-tropical-brunch",
principle:"temperature",
condition:"luxury-tropical-brunch temperature variant 2",
decision:"Apply temperature policy for luxury-tropical-brunch",
role:"metadata",
policy:"warm-premium",
weight:91
},
{
id:"luxury-tropical-brunch:temperature:3",
story:"luxury-tropical-brunch",
principle:"temperature",
condition:"luxury-tropical-brunch temperature variant 3",
decision:"Apply temperature policy for luxury-tropical-brunch",
role:"dateTime",
policy:"champagne-black",
weight:98
},
{
id:"luxury-tropical-brunch:temperature:4",
story:"luxury-tropical-brunch",
principle:"temperature",
condition:"luxury-tropical-brunch temperature variant 4",
decision:"Apply temperature policy for luxury-tropical-brunch",
role:"venue",
policy:"tropical-emerald",
weight:74
},
{
id:"luxury-tropical-brunch:background:1",
story:"luxury-tropical-brunch",
principle:"background",
condition:"luxury-tropical-brunch background variant 1",
decision:"Apply background policy for luxury-tropical-brunch",
role:"badgeBackground",
policy:"rose-glamour",
weight:81
},
{
id:"luxury-tropical-brunch:background:2",
story:"luxury-tropical-brunch",
principle:"background",
condition:"luxury-tropical-brunch background variant 2",
decision:"Apply background policy for luxury-tropical-brunch",
role:"badgeText",
policy:"sunset-warm",
weight:88
},
{
id:"luxury-tropical-brunch:background:3",
story:"luxury-tropical-brunch",
principle:"background",
condition:"luxury-tropical-brunch background variant 3",
decision:"Apply background policy for luxury-tropical-brunch",
role:"presenter",
policy:"burgundy-intimate",
weight:95
},
{
id:"luxury-tropical-brunch:background:4",
story:"luxury-tropical-brunch",
principle:"background",
condition:"luxury-tropical-brunch background variant 4",
decision:"Apply background policy for luxury-tropical-brunch",
role:"footer",
policy:"electric-night",
weight:71
},
{
id:"luxury-tropical-brunch:headline:1",
story:"luxury-tropical-brunch",
principle:"headline",
condition:"luxury-tropical-brunch headline variant 1",
decision:"Apply headline policy for luxury-tropical-brunch",
role:"stroke",
policy:"industrial-monochrome",
weight:78
},
{
id:"luxury-tropical-brunch:headline:2",
story:"luxury-tropical-brunch",
principle:"headline",
condition:"luxury-tropical-brunch headline variant 2",
decision:"Apply headline policy for luxury-tropical-brunch",
role:"glow",
policy:"retro-pop",
weight:85
},
{
id:"luxury-tropical-brunch:headline:3",
story:"luxury-tropical-brunch",
principle:"headline",
condition:"luxury-tropical-brunch headline variant 3",
decision:"Apply headline policy for luxury-tropical-brunch",
role:"neutral",
policy:"neutral-editorial",
weight:92
},
{
id:"luxury-tropical-brunch:headline:4",
story:"luxury-tropical-brunch",
principle:"headline",
condition:"luxury-tropical-brunch headline variant 4",
decision:"Apply headline policy for luxury-tropical-brunch",
role:"utility",
policy:"image-led",
weight:99
},
{
id:"luxury-tropical-brunch:metadata:1",
story:"luxury-tropical-brunch",
principle:"metadata",
condition:"luxury-tropical-brunch metadata variant 1",
decision:"Apply metadata policy for luxury-tropical-brunch",
role:"background",
policy:"warm-premium",
weight:75
},
{
id:"luxury-tropical-brunch:metadata:2",
story:"luxury-tropical-brunch",
principle:"metadata",
condition:"luxury-tropical-brunch metadata variant 2",
decision:"Apply metadata policy for luxury-tropical-brunch",
role:"backgroundSecondary",
policy:"champagne-black",
weight:82
},
{
id:"luxury-tropical-brunch:metadata:3",
story:"luxury-tropical-brunch",
principle:"metadata",
condition:"luxury-tropical-brunch metadata variant 3",
decision:"Apply metadata policy for luxury-tropical-brunch",
role:"headline",
policy:"tropical-emerald",
weight:89
},
{
id:"luxury-tropical-brunch:metadata:4",
story:"luxury-tropical-brunch",
principle:"metadata",
condition:"luxury-tropical-brunch metadata variant 4",
decision:"Apply metadata policy for luxury-tropical-brunch",
role:"accent",
policy:"rose-glamour",
weight:96
},
{
id:"luxury-tropical-brunch:badge:1",
story:"luxury-tropical-brunch",
principle:"badge",
condition:"luxury-tropical-brunch badge variant 1",
decision:"Apply badge policy for luxury-tropical-brunch",
role:"metadata",
policy:"sunset-warm",
weight:72
},
{
id:"luxury-tropical-brunch:badge:2",
story:"luxury-tropical-brunch",
principle:"badge",
condition:"luxury-tropical-brunch badge variant 2",
decision:"Apply badge policy for luxury-tropical-brunch",
role:"dateTime",
policy:"burgundy-intimate",
weight:79
},
{
id:"luxury-tropical-brunch:badge:3",
story:"luxury-tropical-brunch",
principle:"badge",
condition:"luxury-tropical-brunch badge variant 3",
decision:"Apply badge policy for luxury-tropical-brunch",
role:"venue",
policy:"electric-night",
weight:86
},
{
id:"luxury-tropical-brunch:badge:4",
story:"luxury-tropical-brunch",
principle:"badge",
condition:"luxury-tropical-brunch badge variant 4",
decision:"Apply badge policy for luxury-tropical-brunch",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:93
},
{
id:"luxury-tropical-brunch:glow:1",
story:"luxury-tropical-brunch",
principle:"glow",
condition:"luxury-tropical-brunch glow variant 1",
decision:"Apply glow policy for luxury-tropical-brunch",
role:"badgeText",
policy:"retro-pop",
weight:100
},
{
id:"luxury-tropical-brunch:glow:2",
story:"luxury-tropical-brunch",
principle:"glow",
condition:"luxury-tropical-brunch glow variant 2",
decision:"Apply glow policy for luxury-tropical-brunch",
role:"presenter",
policy:"neutral-editorial",
weight:76
},
{
id:"luxury-tropical-brunch:glow:3",
story:"luxury-tropical-brunch",
principle:"glow",
condition:"luxury-tropical-brunch glow variant 3",
decision:"Apply glow policy for luxury-tropical-brunch",
role:"footer",
policy:"image-led",
weight:83
},
{
id:"luxury-tropical-brunch:glow:4",
story:"luxury-tropical-brunch",
principle:"glow",
condition:"luxury-tropical-brunch glow variant 4",
decision:"Apply glow policy for luxury-tropical-brunch",
role:"stroke",
policy:"warm-premium",
weight:90
},
{
id:"luxury-tropical-brunch:cast:1",
story:"luxury-tropical-brunch",
principle:"cast",
condition:"luxury-tropical-brunch cast variant 1",
decision:"Apply cast policy for luxury-tropical-brunch",
role:"glow",
policy:"champagne-black",
weight:97
},
{
id:"luxury-tropical-brunch:cast:2",
story:"luxury-tropical-brunch",
principle:"cast",
condition:"luxury-tropical-brunch cast variant 2",
decision:"Apply cast policy for luxury-tropical-brunch",
role:"neutral",
policy:"tropical-emerald",
weight:73
},
{
id:"luxury-tropical-brunch:cast:3",
story:"luxury-tropical-brunch",
principle:"cast",
condition:"luxury-tropical-brunch cast variant 3",
decision:"Apply cast policy for luxury-tropical-brunch",
role:"utility",
policy:"rose-glamour",
weight:80
},
{
id:"luxury-tropical-brunch:cast:4",
story:"luxury-tropical-brunch",
principle:"cast",
condition:"luxury-tropical-brunch cast variant 4",
decision:"Apply cast policy for luxury-tropical-brunch",
role:"background",
policy:"sunset-warm",
weight:87
},
{
id:"luxury-tropical-brunch:brand:1",
story:"luxury-tropical-brunch",
principle:"brand",
condition:"luxury-tropical-brunch brand variant 1",
decision:"Apply brand policy for luxury-tropical-brunch",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:94
},
{
id:"luxury-tropical-brunch:brand:2",
story:"luxury-tropical-brunch",
principle:"brand",
condition:"luxury-tropical-brunch brand variant 2",
decision:"Apply brand policy for luxury-tropical-brunch",
role:"headline",
policy:"electric-night",
weight:70
},
{
id:"luxury-tropical-brunch:brand:3",
story:"luxury-tropical-brunch",
principle:"brand",
condition:"luxury-tropical-brunch brand variant 3",
decision:"Apply brand policy for luxury-tropical-brunch",
role:"accent",
policy:"industrial-monochrome",
weight:77
},
{
id:"luxury-tropical-brunch:brand:4",
story:"luxury-tropical-brunch",
principle:"brand",
condition:"luxury-tropical-brunch brand variant 4",
decision:"Apply brand policy for luxury-tropical-brunch",
role:"metadata",
policy:"retro-pop",
weight:84
},
{
id:"luxury-tropical-brunch:export:1",
story:"luxury-tropical-brunch",
principle:"export",
condition:"luxury-tropical-brunch export variant 1",
decision:"Apply export policy for luxury-tropical-brunch",
role:"dateTime",
policy:"neutral-editorial",
weight:91
},
{
id:"luxury-tropical-brunch:export:2",
story:"luxury-tropical-brunch",
principle:"export",
condition:"luxury-tropical-brunch export variant 2",
decision:"Apply export policy for luxury-tropical-brunch",
role:"venue",
policy:"image-led",
weight:98
},
{
id:"luxury-tropical-brunch:export:3",
story:"luxury-tropical-brunch",
principle:"export",
condition:"luxury-tropical-brunch export variant 3",
decision:"Apply export policy for luxury-tropical-brunch",
role:"badgeBackground",
policy:"warm-premium",
weight:74
},
{
id:"luxury-tropical-brunch:export:4",
story:"luxury-tropical-brunch",
principle:"export",
condition:"luxury-tropical-brunch export variant 4",
decision:"Apply export policy for luxury-tropical-brunch",
role:"badgeText",
policy:"champagne-black",
weight:81
},
{
id:"luxury-tropical-brunch:accessibility:1",
story:"luxury-tropical-brunch",
principle:"accessibility",
condition:"luxury-tropical-brunch accessibility variant 1",
decision:"Apply accessibility policy for luxury-tropical-brunch",
role:"presenter",
policy:"tropical-emerald",
weight:88
},
{
id:"luxury-tropical-brunch:accessibility:2",
story:"luxury-tropical-brunch",
principle:"accessibility",
condition:"luxury-tropical-brunch accessibility variant 2",
decision:"Apply accessibility policy for luxury-tropical-brunch",
role:"footer",
policy:"rose-glamour",
weight:95
},
{
id:"luxury-tropical-brunch:accessibility:3",
story:"luxury-tropical-brunch",
principle:"accessibility",
condition:"luxury-tropical-brunch accessibility variant 3",
decision:"Apply accessibility policy for luxury-tropical-brunch",
role:"stroke",
policy:"sunset-warm",
weight:71
},
{
id:"luxury-tropical-brunch:accessibility:4",
story:"luxury-tropical-brunch",
principle:"accessibility",
condition:"luxury-tropical-brunch accessibility variant 4",
decision:"Apply accessibility policy for luxury-tropical-brunch",
role:"glow",
policy:"burgundy-intimate",
weight:78
},
{
id:"premium-ladies-night:dominant:1",
story:"premium-ladies-night",
principle:"dominant",
condition:"premium-ladies-night dominant variant 1",
decision:"Apply dominant policy for premium-ladies-night",
role:"neutral",
policy:"electric-night",
weight:85
},
{
id:"premium-ladies-night:dominant:2",
story:"premium-ladies-night",
principle:"dominant",
condition:"premium-ladies-night dominant variant 2",
decision:"Apply dominant policy for premium-ladies-night",
role:"utility",
policy:"industrial-monochrome",
weight:92
},
{
id:"premium-ladies-night:dominant:3",
story:"premium-ladies-night",
principle:"dominant",
condition:"premium-ladies-night dominant variant 3",
decision:"Apply dominant policy for premium-ladies-night",
role:"background",
policy:"retro-pop",
weight:99
},
{
id:"premium-ladies-night:dominant:4",
story:"premium-ladies-night",
principle:"dominant",
condition:"premium-ladies-night dominant variant 4",
decision:"Apply dominant policy for premium-ladies-night",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:75
},
{
id:"premium-ladies-night:support:1",
story:"premium-ladies-night",
principle:"support",
condition:"premium-ladies-night support variant 1",
decision:"Apply support policy for premium-ladies-night",
role:"headline",
policy:"image-led",
weight:82
},
{
id:"premium-ladies-night:support:2",
story:"premium-ladies-night",
principle:"support",
condition:"premium-ladies-night support variant 2",
decision:"Apply support policy for premium-ladies-night",
role:"accent",
policy:"warm-premium",
weight:89
},
{
id:"premium-ladies-night:support:3",
story:"premium-ladies-night",
principle:"support",
condition:"premium-ladies-night support variant 3",
decision:"Apply support policy for premium-ladies-night",
role:"metadata",
policy:"champagne-black",
weight:96
},
{
id:"premium-ladies-night:support:4",
story:"premium-ladies-night",
principle:"support",
condition:"premium-ladies-night support variant 4",
decision:"Apply support policy for premium-ladies-night",
role:"dateTime",
policy:"tropical-emerald",
weight:72
},
{
id:"premium-ladies-night:accent:1",
story:"premium-ladies-night",
principle:"accent",
condition:"premium-ladies-night accent variant 1",
decision:"Apply accent policy for premium-ladies-night",
role:"venue",
policy:"rose-glamour",
weight:79
},
{
id:"premium-ladies-night:accent:2",
story:"premium-ladies-night",
principle:"accent",
condition:"premium-ladies-night accent variant 2",
decision:"Apply accent policy for premium-ladies-night",
role:"badgeBackground",
policy:"sunset-warm",
weight:86
},
{
id:"premium-ladies-night:accent:3",
story:"premium-ladies-night",
principle:"accent",
condition:"premium-ladies-night accent variant 3",
decision:"Apply accent policy for premium-ladies-night",
role:"badgeText",
policy:"burgundy-intimate",
weight:93
},
{
id:"premium-ladies-night:accent:4",
story:"premium-ladies-night",
principle:"accent",
condition:"premium-ladies-night accent variant 4",
decision:"Apply accent policy for premium-ladies-night",
role:"presenter",
policy:"electric-night",
weight:100
},
{
id:"premium-ladies-night:neutral:1",
story:"premium-ladies-night",
principle:"neutral",
condition:"premium-ladies-night neutral variant 1",
decision:"Apply neutral policy for premium-ladies-night",
role:"footer",
policy:"industrial-monochrome",
weight:76
},
{
id:"premium-ladies-night:neutral:2",
story:"premium-ladies-night",
principle:"neutral",
condition:"premium-ladies-night neutral variant 2",
decision:"Apply neutral policy for premium-ladies-night",
role:"stroke",
policy:"retro-pop",
weight:83
},
{
id:"premium-ladies-night:neutral:3",
story:"premium-ladies-night",
principle:"neutral",
condition:"premium-ladies-night neutral variant 3",
decision:"Apply neutral policy for premium-ladies-night",
role:"glow",
policy:"neutral-editorial",
weight:90
},
{
id:"premium-ladies-night:neutral:4",
story:"premium-ladies-night",
principle:"neutral",
condition:"premium-ladies-night neutral variant 4",
decision:"Apply neutral policy for premium-ladies-night",
role:"neutral",
policy:"image-led",
weight:97
},
{
id:"premium-ladies-night:contrast:1",
story:"premium-ladies-night",
principle:"contrast",
condition:"premium-ladies-night contrast variant 1",
decision:"Apply contrast policy for premium-ladies-night",
role:"utility",
policy:"warm-premium",
weight:73
},
{
id:"premium-ladies-night:contrast:2",
story:"premium-ladies-night",
principle:"contrast",
condition:"premium-ladies-night contrast variant 2",
decision:"Apply contrast policy for premium-ladies-night",
role:"background",
policy:"champagne-black",
weight:80
},
{
id:"premium-ladies-night:contrast:3",
story:"premium-ladies-night",
principle:"contrast",
condition:"premium-ladies-night contrast variant 3",
decision:"Apply contrast policy for premium-ladies-night",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:87
},
{
id:"premium-ladies-night:contrast:4",
story:"premium-ladies-night",
principle:"contrast",
condition:"premium-ladies-night contrast variant 4",
decision:"Apply contrast policy for premium-ladies-night",
role:"headline",
policy:"rose-glamour",
weight:94
},
{
id:"premium-ladies-night:skin:1",
story:"premium-ladies-night",
principle:"skin",
condition:"premium-ladies-night skin variant 1",
decision:"Apply skin policy for premium-ladies-night",
role:"accent",
policy:"sunset-warm",
weight:70
},
{
id:"premium-ladies-night:skin:2",
story:"premium-ladies-night",
principle:"skin",
condition:"premium-ladies-night skin variant 2",
decision:"Apply skin policy for premium-ladies-night",
role:"metadata",
policy:"burgundy-intimate",
weight:77
},
{
id:"premium-ladies-night:skin:3",
story:"premium-ladies-night",
principle:"skin",
condition:"premium-ladies-night skin variant 3",
decision:"Apply skin policy for premium-ladies-night",
role:"dateTime",
policy:"electric-night",
weight:84
},
{
id:"premium-ladies-night:skin:4",
story:"premium-ladies-night",
principle:"skin",
condition:"premium-ladies-night skin variant 4",
decision:"Apply skin policy for premium-ladies-night",
role:"venue",
policy:"industrial-monochrome",
weight:91
},
{
id:"premium-ladies-night:saturation:1",
story:"premium-ladies-night",
principle:"saturation",
condition:"premium-ladies-night saturation variant 1",
decision:"Apply saturation policy for premium-ladies-night",
role:"badgeBackground",
policy:"retro-pop",
weight:98
},
{
id:"premium-ladies-night:saturation:2",
story:"premium-ladies-night",
principle:"saturation",
condition:"premium-ladies-night saturation variant 2",
decision:"Apply saturation policy for premium-ladies-night",
role:"badgeText",
policy:"neutral-editorial",
weight:74
},
{
id:"premium-ladies-night:saturation:3",
story:"premium-ladies-night",
principle:"saturation",
condition:"premium-ladies-night saturation variant 3",
decision:"Apply saturation policy for premium-ladies-night",
role:"presenter",
policy:"image-led",
weight:81
},
{
id:"premium-ladies-night:saturation:4",
story:"premium-ladies-night",
principle:"saturation",
condition:"premium-ladies-night saturation variant 4",
decision:"Apply saturation policy for premium-ladies-night",
role:"footer",
policy:"warm-premium",
weight:88
},
{
id:"premium-ladies-night:harmony:1",
story:"premium-ladies-night",
principle:"harmony",
condition:"premium-ladies-night harmony variant 1",
decision:"Apply harmony policy for premium-ladies-night",
role:"stroke",
policy:"champagne-black",
weight:95
},
{
id:"premium-ladies-night:harmony:2",
story:"premium-ladies-night",
principle:"harmony",
condition:"premium-ladies-night harmony variant 2",
decision:"Apply harmony policy for premium-ladies-night",
role:"glow",
policy:"tropical-emerald",
weight:71
},
{
id:"premium-ladies-night:harmony:3",
story:"premium-ladies-night",
principle:"harmony",
condition:"premium-ladies-night harmony variant 3",
decision:"Apply harmony policy for premium-ladies-night",
role:"neutral",
policy:"rose-glamour",
weight:78
},
{
id:"premium-ladies-night:harmony:4",
story:"premium-ladies-night",
principle:"harmony",
condition:"premium-ladies-night harmony variant 4",
decision:"Apply harmony policy for premium-ladies-night",
role:"utility",
policy:"sunset-warm",
weight:85
},
{
id:"premium-ladies-night:temperature:1",
story:"premium-ladies-night",
principle:"temperature",
condition:"premium-ladies-night temperature variant 1",
decision:"Apply temperature policy for premium-ladies-night",
role:"background",
policy:"burgundy-intimate",
weight:92
},
{
id:"premium-ladies-night:temperature:2",
story:"premium-ladies-night",
principle:"temperature",
condition:"premium-ladies-night temperature variant 2",
decision:"Apply temperature policy for premium-ladies-night",
role:"backgroundSecondary",
policy:"electric-night",
weight:99
},
{
id:"premium-ladies-night:temperature:3",
story:"premium-ladies-night",
principle:"temperature",
condition:"premium-ladies-night temperature variant 3",
decision:"Apply temperature policy for premium-ladies-night",
role:"headline",
policy:"industrial-monochrome",
weight:75
},
{
id:"premium-ladies-night:temperature:4",
story:"premium-ladies-night",
principle:"temperature",
condition:"premium-ladies-night temperature variant 4",
decision:"Apply temperature policy for premium-ladies-night",
role:"accent",
policy:"retro-pop",
weight:82
},
{
id:"premium-ladies-night:background:1",
story:"premium-ladies-night",
principle:"background",
condition:"premium-ladies-night background variant 1",
decision:"Apply background policy for premium-ladies-night",
role:"metadata",
policy:"neutral-editorial",
weight:89
},
{
id:"premium-ladies-night:background:2",
story:"premium-ladies-night",
principle:"background",
condition:"premium-ladies-night background variant 2",
decision:"Apply background policy for premium-ladies-night",
role:"dateTime",
policy:"image-led",
weight:96
},
{
id:"premium-ladies-night:background:3",
story:"premium-ladies-night",
principle:"background",
condition:"premium-ladies-night background variant 3",
decision:"Apply background policy for premium-ladies-night",
role:"venue",
policy:"warm-premium",
weight:72
},
{
id:"premium-ladies-night:background:4",
story:"premium-ladies-night",
principle:"background",
condition:"premium-ladies-night background variant 4",
decision:"Apply background policy for premium-ladies-night",
role:"badgeBackground",
policy:"champagne-black",
weight:79
},
{
id:"premium-ladies-night:headline:1",
story:"premium-ladies-night",
principle:"headline",
condition:"premium-ladies-night headline variant 1",
decision:"Apply headline policy for premium-ladies-night",
role:"badgeText",
policy:"tropical-emerald",
weight:86
},
{
id:"premium-ladies-night:headline:2",
story:"premium-ladies-night",
principle:"headline",
condition:"premium-ladies-night headline variant 2",
decision:"Apply headline policy for premium-ladies-night",
role:"presenter",
policy:"rose-glamour",
weight:93
},
{
id:"premium-ladies-night:headline:3",
story:"premium-ladies-night",
principle:"headline",
condition:"premium-ladies-night headline variant 3",
decision:"Apply headline policy for premium-ladies-night",
role:"footer",
policy:"sunset-warm",
weight:100
},
{
id:"premium-ladies-night:headline:4",
story:"premium-ladies-night",
principle:"headline",
condition:"premium-ladies-night headline variant 4",
decision:"Apply headline policy for premium-ladies-night",
role:"stroke",
policy:"burgundy-intimate",
weight:76
},
{
id:"premium-ladies-night:metadata:1",
story:"premium-ladies-night",
principle:"metadata",
condition:"premium-ladies-night metadata variant 1",
decision:"Apply metadata policy for premium-ladies-night",
role:"glow",
policy:"electric-night",
weight:83
},
{
id:"premium-ladies-night:metadata:2",
story:"premium-ladies-night",
principle:"metadata",
condition:"premium-ladies-night metadata variant 2",
decision:"Apply metadata policy for premium-ladies-night",
role:"neutral",
policy:"industrial-monochrome",
weight:90
},
{
id:"premium-ladies-night:metadata:3",
story:"premium-ladies-night",
principle:"metadata",
condition:"premium-ladies-night metadata variant 3",
decision:"Apply metadata policy for premium-ladies-night",
role:"utility",
policy:"retro-pop",
weight:97
},
{
id:"premium-ladies-night:metadata:4",
story:"premium-ladies-night",
principle:"metadata",
condition:"premium-ladies-night metadata variant 4",
decision:"Apply metadata policy for premium-ladies-night",
role:"background",
policy:"neutral-editorial",
weight:73
},
{
id:"premium-ladies-night:badge:1",
story:"premium-ladies-night",
principle:"badge",
condition:"premium-ladies-night badge variant 1",
decision:"Apply badge policy for premium-ladies-night",
role:"backgroundSecondary",
policy:"image-led",
weight:80
},
{
id:"premium-ladies-night:badge:2",
story:"premium-ladies-night",
principle:"badge",
condition:"premium-ladies-night badge variant 2",
decision:"Apply badge policy for premium-ladies-night",
role:"headline",
policy:"warm-premium",
weight:87
},
{
id:"premium-ladies-night:badge:3",
story:"premium-ladies-night",
principle:"badge",
condition:"premium-ladies-night badge variant 3",
decision:"Apply badge policy for premium-ladies-night",
role:"accent",
policy:"champagne-black",
weight:94
},
{
id:"premium-ladies-night:badge:4",
story:"premium-ladies-night",
principle:"badge",
condition:"premium-ladies-night badge variant 4",
decision:"Apply badge policy for premium-ladies-night",
role:"metadata",
policy:"tropical-emerald",
weight:70
},
{
id:"premium-ladies-night:glow:1",
story:"premium-ladies-night",
principle:"glow",
condition:"premium-ladies-night glow variant 1",
decision:"Apply glow policy for premium-ladies-night",
role:"dateTime",
policy:"rose-glamour",
weight:77
},
{
id:"premium-ladies-night:glow:2",
story:"premium-ladies-night",
principle:"glow",
condition:"premium-ladies-night glow variant 2",
decision:"Apply glow policy for premium-ladies-night",
role:"venue",
policy:"sunset-warm",
weight:84
},
{
id:"premium-ladies-night:glow:3",
story:"premium-ladies-night",
principle:"glow",
condition:"premium-ladies-night glow variant 3",
decision:"Apply glow policy for premium-ladies-night",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:91
},
{
id:"premium-ladies-night:glow:4",
story:"premium-ladies-night",
principle:"glow",
condition:"premium-ladies-night glow variant 4",
decision:"Apply glow policy for premium-ladies-night",
role:"badgeText",
policy:"electric-night",
weight:98
},
{
id:"premium-ladies-night:cast:1",
story:"premium-ladies-night",
principle:"cast",
condition:"premium-ladies-night cast variant 1",
decision:"Apply cast policy for premium-ladies-night",
role:"presenter",
policy:"industrial-monochrome",
weight:74
},
{
id:"premium-ladies-night:cast:2",
story:"premium-ladies-night",
principle:"cast",
condition:"premium-ladies-night cast variant 2",
decision:"Apply cast policy for premium-ladies-night",
role:"footer",
policy:"retro-pop",
weight:81
},
{
id:"premium-ladies-night:cast:3",
story:"premium-ladies-night",
principle:"cast",
condition:"premium-ladies-night cast variant 3",
decision:"Apply cast policy for premium-ladies-night",
role:"stroke",
policy:"neutral-editorial",
weight:88
},
{
id:"premium-ladies-night:cast:4",
story:"premium-ladies-night",
principle:"cast",
condition:"premium-ladies-night cast variant 4",
decision:"Apply cast policy for premium-ladies-night",
role:"glow",
policy:"image-led",
weight:95
},
{
id:"premium-ladies-night:brand:1",
story:"premium-ladies-night",
principle:"brand",
condition:"premium-ladies-night brand variant 1",
decision:"Apply brand policy for premium-ladies-night",
role:"neutral",
policy:"warm-premium",
weight:71
},
{
id:"premium-ladies-night:brand:2",
story:"premium-ladies-night",
principle:"brand",
condition:"premium-ladies-night brand variant 2",
decision:"Apply brand policy for premium-ladies-night",
role:"utility",
policy:"champagne-black",
weight:78
},
{
id:"premium-ladies-night:brand:3",
story:"premium-ladies-night",
principle:"brand",
condition:"premium-ladies-night brand variant 3",
decision:"Apply brand policy for premium-ladies-night",
role:"background",
policy:"tropical-emerald",
weight:85
},
{
id:"premium-ladies-night:brand:4",
story:"premium-ladies-night",
principle:"brand",
condition:"premium-ladies-night brand variant 4",
decision:"Apply brand policy for premium-ladies-night",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:92
},
{
id:"premium-ladies-night:export:1",
story:"premium-ladies-night",
principle:"export",
condition:"premium-ladies-night export variant 1",
decision:"Apply export policy for premium-ladies-night",
role:"headline",
policy:"sunset-warm",
weight:99
},
{
id:"premium-ladies-night:export:2",
story:"premium-ladies-night",
principle:"export",
condition:"premium-ladies-night export variant 2",
decision:"Apply export policy for premium-ladies-night",
role:"accent",
policy:"burgundy-intimate",
weight:75
},
{
id:"premium-ladies-night:export:3",
story:"premium-ladies-night",
principle:"export",
condition:"premium-ladies-night export variant 3",
decision:"Apply export policy for premium-ladies-night",
role:"metadata",
policy:"electric-night",
weight:82
},
{
id:"premium-ladies-night:export:4",
story:"premium-ladies-night",
principle:"export",
condition:"premium-ladies-night export variant 4",
decision:"Apply export policy for premium-ladies-night",
role:"dateTime",
policy:"industrial-monochrome",
weight:89
},
{
id:"premium-ladies-night:accessibility:1",
story:"premium-ladies-night",
principle:"accessibility",
condition:"premium-ladies-night accessibility variant 1",
decision:"Apply accessibility policy for premium-ladies-night",
role:"venue",
policy:"retro-pop",
weight:96
},
{
id:"premium-ladies-night:accessibility:2",
story:"premium-ladies-night",
principle:"accessibility",
condition:"premium-ladies-night accessibility variant 2",
decision:"Apply accessibility policy for premium-ladies-night",
role:"badgeBackground",
policy:"neutral-editorial",
weight:72
},
{
id:"premium-ladies-night:accessibility:3",
story:"premium-ladies-night",
principle:"accessibility",
condition:"premium-ladies-night accessibility variant 3",
decision:"Apply accessibility policy for premium-ladies-night",
role:"badgeText",
policy:"image-led",
weight:79
},
{
id:"premium-ladies-night:accessibility:4",
story:"premium-ladies-night",
principle:"accessibility",
condition:"premium-ladies-night accessibility variant 4",
decision:"Apply accessibility policy for premium-ladies-night",
role:"presenter",
policy:"warm-premium",
weight:86
},
{
id:"afrobeats-sunset:dominant:1",
story:"afrobeats-sunset",
principle:"dominant",
condition:"afrobeats-sunset dominant variant 1",
decision:"Apply dominant policy for afrobeats-sunset",
role:"footer",
policy:"champagne-black",
weight:93
},
{
id:"afrobeats-sunset:dominant:2",
story:"afrobeats-sunset",
principle:"dominant",
condition:"afrobeats-sunset dominant variant 2",
decision:"Apply dominant policy for afrobeats-sunset",
role:"stroke",
policy:"tropical-emerald",
weight:100
},
{
id:"afrobeats-sunset:dominant:3",
story:"afrobeats-sunset",
principle:"dominant",
condition:"afrobeats-sunset dominant variant 3",
decision:"Apply dominant policy for afrobeats-sunset",
role:"glow",
policy:"rose-glamour",
weight:76
},
{
id:"afrobeats-sunset:dominant:4",
story:"afrobeats-sunset",
principle:"dominant",
condition:"afrobeats-sunset dominant variant 4",
decision:"Apply dominant policy for afrobeats-sunset",
role:"neutral",
policy:"sunset-warm",
weight:83
},
{
id:"afrobeats-sunset:support:1",
story:"afrobeats-sunset",
principle:"support",
condition:"afrobeats-sunset support variant 1",
decision:"Apply support policy for afrobeats-sunset",
role:"utility",
policy:"burgundy-intimate",
weight:90
},
{
id:"afrobeats-sunset:support:2",
story:"afrobeats-sunset",
principle:"support",
condition:"afrobeats-sunset support variant 2",
decision:"Apply support policy for afrobeats-sunset",
role:"background",
policy:"electric-night",
weight:97
},
{
id:"afrobeats-sunset:support:3",
story:"afrobeats-sunset",
principle:"support",
condition:"afrobeats-sunset support variant 3",
decision:"Apply support policy for afrobeats-sunset",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:73
},
{
id:"afrobeats-sunset:support:4",
story:"afrobeats-sunset",
principle:"support",
condition:"afrobeats-sunset support variant 4",
decision:"Apply support policy for afrobeats-sunset",
role:"headline",
policy:"retro-pop",
weight:80
},
{
id:"afrobeats-sunset:accent:1",
story:"afrobeats-sunset",
principle:"accent",
condition:"afrobeats-sunset accent variant 1",
decision:"Apply accent policy for afrobeats-sunset",
role:"accent",
policy:"neutral-editorial",
weight:87
},
{
id:"afrobeats-sunset:accent:2",
story:"afrobeats-sunset",
principle:"accent",
condition:"afrobeats-sunset accent variant 2",
decision:"Apply accent policy for afrobeats-sunset",
role:"metadata",
policy:"image-led",
weight:94
},
{
id:"afrobeats-sunset:accent:3",
story:"afrobeats-sunset",
principle:"accent",
condition:"afrobeats-sunset accent variant 3",
decision:"Apply accent policy for afrobeats-sunset",
role:"dateTime",
policy:"warm-premium",
weight:70
},
{
id:"afrobeats-sunset:accent:4",
story:"afrobeats-sunset",
principle:"accent",
condition:"afrobeats-sunset accent variant 4",
decision:"Apply accent policy for afrobeats-sunset",
role:"venue",
policy:"champagne-black",
weight:77
},
{
id:"afrobeats-sunset:neutral:1",
story:"afrobeats-sunset",
principle:"neutral",
condition:"afrobeats-sunset neutral variant 1",
decision:"Apply neutral policy for afrobeats-sunset",
role:"badgeBackground",
policy:"tropical-emerald",
weight:84
},
{
id:"afrobeats-sunset:neutral:2",
story:"afrobeats-sunset",
principle:"neutral",
condition:"afrobeats-sunset neutral variant 2",
decision:"Apply neutral policy for afrobeats-sunset",
role:"badgeText",
policy:"rose-glamour",
weight:91
},
{
id:"afrobeats-sunset:neutral:3",
story:"afrobeats-sunset",
principle:"neutral",
condition:"afrobeats-sunset neutral variant 3",
decision:"Apply neutral policy for afrobeats-sunset",
role:"presenter",
policy:"sunset-warm",
weight:98
},
{
id:"afrobeats-sunset:neutral:4",
story:"afrobeats-sunset",
principle:"neutral",
condition:"afrobeats-sunset neutral variant 4",
decision:"Apply neutral policy for afrobeats-sunset",
role:"footer",
policy:"burgundy-intimate",
weight:74
},
{
id:"afrobeats-sunset:contrast:1",
story:"afrobeats-sunset",
principle:"contrast",
condition:"afrobeats-sunset contrast variant 1",
decision:"Apply contrast policy for afrobeats-sunset",
role:"stroke",
policy:"electric-night",
weight:81
},
{
id:"afrobeats-sunset:contrast:2",
story:"afrobeats-sunset",
principle:"contrast",
condition:"afrobeats-sunset contrast variant 2",
decision:"Apply contrast policy for afrobeats-sunset",
role:"glow",
policy:"industrial-monochrome",
weight:88
},
{
id:"afrobeats-sunset:contrast:3",
story:"afrobeats-sunset",
principle:"contrast",
condition:"afrobeats-sunset contrast variant 3",
decision:"Apply contrast policy for afrobeats-sunset",
role:"neutral",
policy:"retro-pop",
weight:95
},
{
id:"afrobeats-sunset:contrast:4",
story:"afrobeats-sunset",
principle:"contrast",
condition:"afrobeats-sunset contrast variant 4",
decision:"Apply contrast policy for afrobeats-sunset",
role:"utility",
policy:"neutral-editorial",
weight:71
},
{
id:"afrobeats-sunset:skin:1",
story:"afrobeats-sunset",
principle:"skin",
condition:"afrobeats-sunset skin variant 1",
decision:"Apply skin policy for afrobeats-sunset",
role:"background",
policy:"image-led",
weight:78
},
{
id:"afrobeats-sunset:skin:2",
story:"afrobeats-sunset",
principle:"skin",
condition:"afrobeats-sunset skin variant 2",
decision:"Apply skin policy for afrobeats-sunset",
role:"backgroundSecondary",
policy:"warm-premium",
weight:85
},
{
id:"afrobeats-sunset:skin:3",
story:"afrobeats-sunset",
principle:"skin",
condition:"afrobeats-sunset skin variant 3",
decision:"Apply skin policy for afrobeats-sunset",
role:"headline",
policy:"champagne-black",
weight:92
},
{
id:"afrobeats-sunset:skin:4",
story:"afrobeats-sunset",
principle:"skin",
condition:"afrobeats-sunset skin variant 4",
decision:"Apply skin policy for afrobeats-sunset",
role:"accent",
policy:"tropical-emerald",
weight:99
},
{
id:"afrobeats-sunset:saturation:1",
story:"afrobeats-sunset",
principle:"saturation",
condition:"afrobeats-sunset saturation variant 1",
decision:"Apply saturation policy for afrobeats-sunset",
role:"metadata",
policy:"rose-glamour",
weight:75
},
{
id:"afrobeats-sunset:saturation:2",
story:"afrobeats-sunset",
principle:"saturation",
condition:"afrobeats-sunset saturation variant 2",
decision:"Apply saturation policy for afrobeats-sunset",
role:"dateTime",
policy:"sunset-warm",
weight:82
},
{
id:"afrobeats-sunset:saturation:3",
story:"afrobeats-sunset",
principle:"saturation",
condition:"afrobeats-sunset saturation variant 3",
decision:"Apply saturation policy for afrobeats-sunset",
role:"venue",
policy:"burgundy-intimate",
weight:89
},
{
id:"afrobeats-sunset:saturation:4",
story:"afrobeats-sunset",
principle:"saturation",
condition:"afrobeats-sunset saturation variant 4",
decision:"Apply saturation policy for afrobeats-sunset",
role:"badgeBackground",
policy:"electric-night",
weight:96
},
{
id:"afrobeats-sunset:harmony:1",
story:"afrobeats-sunset",
principle:"harmony",
condition:"afrobeats-sunset harmony variant 1",
decision:"Apply harmony policy for afrobeats-sunset",
role:"badgeText",
policy:"industrial-monochrome",
weight:72
},
{
id:"afrobeats-sunset:harmony:2",
story:"afrobeats-sunset",
principle:"harmony",
condition:"afrobeats-sunset harmony variant 2",
decision:"Apply harmony policy for afrobeats-sunset",
role:"presenter",
policy:"retro-pop",
weight:79
},
{
id:"afrobeats-sunset:harmony:3",
story:"afrobeats-sunset",
principle:"harmony",
condition:"afrobeats-sunset harmony variant 3",
decision:"Apply harmony policy for afrobeats-sunset",
role:"footer",
policy:"neutral-editorial",
weight:86
},
{
id:"afrobeats-sunset:harmony:4",
story:"afrobeats-sunset",
principle:"harmony",
condition:"afrobeats-sunset harmony variant 4",
decision:"Apply harmony policy for afrobeats-sunset",
role:"stroke",
policy:"image-led",
weight:93
},
{
id:"afrobeats-sunset:temperature:1",
story:"afrobeats-sunset",
principle:"temperature",
condition:"afrobeats-sunset temperature variant 1",
decision:"Apply temperature policy for afrobeats-sunset",
role:"glow",
policy:"warm-premium",
weight:100
},
{
id:"afrobeats-sunset:temperature:2",
story:"afrobeats-sunset",
principle:"temperature",
condition:"afrobeats-sunset temperature variant 2",
decision:"Apply temperature policy for afrobeats-sunset",
role:"neutral",
policy:"champagne-black",
weight:76
},
{
id:"afrobeats-sunset:temperature:3",
story:"afrobeats-sunset",
principle:"temperature",
condition:"afrobeats-sunset temperature variant 3",
decision:"Apply temperature policy for afrobeats-sunset",
role:"utility",
policy:"tropical-emerald",
weight:83
},
{
id:"afrobeats-sunset:temperature:4",
story:"afrobeats-sunset",
principle:"temperature",
condition:"afrobeats-sunset temperature variant 4",
decision:"Apply temperature policy for afrobeats-sunset",
role:"background",
policy:"rose-glamour",
weight:90
},
{
id:"afrobeats-sunset:background:1",
story:"afrobeats-sunset",
principle:"background",
condition:"afrobeats-sunset background variant 1",
decision:"Apply background policy for afrobeats-sunset",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:97
},
{
id:"afrobeats-sunset:background:2",
story:"afrobeats-sunset",
principle:"background",
condition:"afrobeats-sunset background variant 2",
decision:"Apply background policy for afrobeats-sunset",
role:"headline",
policy:"burgundy-intimate",
weight:73
},
{
id:"afrobeats-sunset:background:3",
story:"afrobeats-sunset",
principle:"background",
condition:"afrobeats-sunset background variant 3",
decision:"Apply background policy for afrobeats-sunset",
role:"accent",
policy:"electric-night",
weight:80
},
{
id:"afrobeats-sunset:background:4",
story:"afrobeats-sunset",
principle:"background",
condition:"afrobeats-sunset background variant 4",
decision:"Apply background policy for afrobeats-sunset",
role:"metadata",
policy:"industrial-monochrome",
weight:87
},
{
id:"afrobeats-sunset:headline:1",
story:"afrobeats-sunset",
principle:"headline",
condition:"afrobeats-sunset headline variant 1",
decision:"Apply headline policy for afrobeats-sunset",
role:"dateTime",
policy:"retro-pop",
weight:94
},
{
id:"afrobeats-sunset:headline:2",
story:"afrobeats-sunset",
principle:"headline",
condition:"afrobeats-sunset headline variant 2",
decision:"Apply headline policy for afrobeats-sunset",
role:"venue",
policy:"neutral-editorial",
weight:70
},
{
id:"afrobeats-sunset:headline:3",
story:"afrobeats-sunset",
principle:"headline",
condition:"afrobeats-sunset headline variant 3",
decision:"Apply headline policy for afrobeats-sunset",
role:"badgeBackground",
policy:"image-led",
weight:77
},
{
id:"afrobeats-sunset:headline:4",
story:"afrobeats-sunset",
principle:"headline",
condition:"afrobeats-sunset headline variant 4",
decision:"Apply headline policy for afrobeats-sunset",
role:"badgeText",
policy:"warm-premium",
weight:84
},
{
id:"afrobeats-sunset:metadata:1",
story:"afrobeats-sunset",
principle:"metadata",
condition:"afrobeats-sunset metadata variant 1",
decision:"Apply metadata policy for afrobeats-sunset",
role:"presenter",
policy:"champagne-black",
weight:91
},
{
id:"afrobeats-sunset:metadata:2",
story:"afrobeats-sunset",
principle:"metadata",
condition:"afrobeats-sunset metadata variant 2",
decision:"Apply metadata policy for afrobeats-sunset",
role:"footer",
policy:"tropical-emerald",
weight:98
},
{
id:"afrobeats-sunset:metadata:3",
story:"afrobeats-sunset",
principle:"metadata",
condition:"afrobeats-sunset metadata variant 3",
decision:"Apply metadata policy for afrobeats-sunset",
role:"stroke",
policy:"rose-glamour",
weight:74
},
{
id:"afrobeats-sunset:metadata:4",
story:"afrobeats-sunset",
principle:"metadata",
condition:"afrobeats-sunset metadata variant 4",
decision:"Apply metadata policy for afrobeats-sunset",
role:"glow",
policy:"sunset-warm",
weight:81
},
{
id:"afrobeats-sunset:badge:1",
story:"afrobeats-sunset",
principle:"badge",
condition:"afrobeats-sunset badge variant 1",
decision:"Apply badge policy for afrobeats-sunset",
role:"neutral",
policy:"burgundy-intimate",
weight:88
},
{
id:"afrobeats-sunset:badge:2",
story:"afrobeats-sunset",
principle:"badge",
condition:"afrobeats-sunset badge variant 2",
decision:"Apply badge policy for afrobeats-sunset",
role:"utility",
policy:"electric-night",
weight:95
},
{
id:"afrobeats-sunset:badge:3",
story:"afrobeats-sunset",
principle:"badge",
condition:"afrobeats-sunset badge variant 3",
decision:"Apply badge policy for afrobeats-sunset",
role:"background",
policy:"industrial-monochrome",
weight:71
},
{
id:"afrobeats-sunset:badge:4",
story:"afrobeats-sunset",
principle:"badge",
condition:"afrobeats-sunset badge variant 4",
decision:"Apply badge policy for afrobeats-sunset",
role:"backgroundSecondary",
policy:"retro-pop",
weight:78
},
{
id:"afrobeats-sunset:glow:1",
story:"afrobeats-sunset",
principle:"glow",
condition:"afrobeats-sunset glow variant 1",
decision:"Apply glow policy for afrobeats-sunset",
role:"headline",
policy:"neutral-editorial",
weight:85
},
{
id:"afrobeats-sunset:glow:2",
story:"afrobeats-sunset",
principle:"glow",
condition:"afrobeats-sunset glow variant 2",
decision:"Apply glow policy for afrobeats-sunset",
role:"accent",
policy:"image-led",
weight:92
},
{
id:"afrobeats-sunset:glow:3",
story:"afrobeats-sunset",
principle:"glow",
condition:"afrobeats-sunset glow variant 3",
decision:"Apply glow policy for afrobeats-sunset",
role:"metadata",
policy:"warm-premium",
weight:99
},
{
id:"afrobeats-sunset:glow:4",
story:"afrobeats-sunset",
principle:"glow",
condition:"afrobeats-sunset glow variant 4",
decision:"Apply glow policy for afrobeats-sunset",
role:"dateTime",
policy:"champagne-black",
weight:75
},
{
id:"afrobeats-sunset:cast:1",
story:"afrobeats-sunset",
principle:"cast",
condition:"afrobeats-sunset cast variant 1",
decision:"Apply cast policy for afrobeats-sunset",
role:"venue",
policy:"tropical-emerald",
weight:82
},
{
id:"afrobeats-sunset:cast:2",
story:"afrobeats-sunset",
principle:"cast",
condition:"afrobeats-sunset cast variant 2",
decision:"Apply cast policy for afrobeats-sunset",
role:"badgeBackground",
policy:"rose-glamour",
weight:89
},
{
id:"afrobeats-sunset:cast:3",
story:"afrobeats-sunset",
principle:"cast",
condition:"afrobeats-sunset cast variant 3",
decision:"Apply cast policy for afrobeats-sunset",
role:"badgeText",
policy:"sunset-warm",
weight:96
},
{
id:"afrobeats-sunset:cast:4",
story:"afrobeats-sunset",
principle:"cast",
condition:"afrobeats-sunset cast variant 4",
decision:"Apply cast policy for afrobeats-sunset",
role:"presenter",
policy:"burgundy-intimate",
weight:72
},
{
id:"afrobeats-sunset:brand:1",
story:"afrobeats-sunset",
principle:"brand",
condition:"afrobeats-sunset brand variant 1",
decision:"Apply brand policy for afrobeats-sunset",
role:"footer",
policy:"electric-night",
weight:79
},
{
id:"afrobeats-sunset:brand:2",
story:"afrobeats-sunset",
principle:"brand",
condition:"afrobeats-sunset brand variant 2",
decision:"Apply brand policy for afrobeats-sunset",
role:"stroke",
policy:"industrial-monochrome",
weight:86
},
{
id:"afrobeats-sunset:brand:3",
story:"afrobeats-sunset",
principle:"brand",
condition:"afrobeats-sunset brand variant 3",
decision:"Apply brand policy for afrobeats-sunset",
role:"glow",
policy:"retro-pop",
weight:93
},
{
id:"afrobeats-sunset:brand:4",
story:"afrobeats-sunset",
principle:"brand",
condition:"afrobeats-sunset brand variant 4",
decision:"Apply brand policy for afrobeats-sunset",
role:"neutral",
policy:"neutral-editorial",
weight:100
},
{
id:"afrobeats-sunset:export:1",
story:"afrobeats-sunset",
principle:"export",
condition:"afrobeats-sunset export variant 1",
decision:"Apply export policy for afrobeats-sunset",
role:"utility",
policy:"image-led",
weight:76
},
{
id:"afrobeats-sunset:export:2",
story:"afrobeats-sunset",
principle:"export",
condition:"afrobeats-sunset export variant 2",
decision:"Apply export policy for afrobeats-sunset",
role:"background",
policy:"warm-premium",
weight:83
},
{
id:"afrobeats-sunset:export:3",
story:"afrobeats-sunset",
principle:"export",
condition:"afrobeats-sunset export variant 3",
decision:"Apply export policy for afrobeats-sunset",
role:"backgroundSecondary",
policy:"champagne-black",
weight:90
},
{
id:"afrobeats-sunset:export:4",
story:"afrobeats-sunset",
principle:"export",
condition:"afrobeats-sunset export variant 4",
decision:"Apply export policy for afrobeats-sunset",
role:"headline",
policy:"tropical-emerald",
weight:97
},
{
id:"afrobeats-sunset:accessibility:1",
story:"afrobeats-sunset",
principle:"accessibility",
condition:"afrobeats-sunset accessibility variant 1",
decision:"Apply accessibility policy for afrobeats-sunset",
role:"accent",
policy:"rose-glamour",
weight:73
},
{
id:"afrobeats-sunset:accessibility:2",
story:"afrobeats-sunset",
principle:"accessibility",
condition:"afrobeats-sunset accessibility variant 2",
decision:"Apply accessibility policy for afrobeats-sunset",
role:"metadata",
policy:"sunset-warm",
weight:80
},
{
id:"afrobeats-sunset:accessibility:3",
story:"afrobeats-sunset",
principle:"accessibility",
condition:"afrobeats-sunset accessibility variant 3",
decision:"Apply accessibility policy for afrobeats-sunset",
role:"dateTime",
policy:"burgundy-intimate",
weight:87
},
{
id:"afrobeats-sunset:accessibility:4",
story:"afrobeats-sunset",
principle:"accessibility",
condition:"afrobeats-sunset accessibility variant 4",
decision:"Apply accessibility policy for afrobeats-sunset",
role:"venue",
policy:"electric-night",
weight:94
},
{
id:"rnb-lounge:dominant:1",
story:"rnb-lounge",
principle:"dominant",
condition:"rnb-lounge dominant variant 1",
decision:"Apply dominant policy for rnb-lounge",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:70
},
{
id:"rnb-lounge:dominant:2",
story:"rnb-lounge",
principle:"dominant",
condition:"rnb-lounge dominant variant 2",
decision:"Apply dominant policy for rnb-lounge",
role:"badgeText",
policy:"retro-pop",
weight:77
},
{
id:"rnb-lounge:dominant:3",
story:"rnb-lounge",
principle:"dominant",
condition:"rnb-lounge dominant variant 3",
decision:"Apply dominant policy for rnb-lounge",
role:"presenter",
policy:"neutral-editorial",
weight:84
},
{
id:"rnb-lounge:dominant:4",
story:"rnb-lounge",
principle:"dominant",
condition:"rnb-lounge dominant variant 4",
decision:"Apply dominant policy for rnb-lounge",
role:"footer",
policy:"image-led",
weight:91
},
{
id:"rnb-lounge:support:1",
story:"rnb-lounge",
principle:"support",
condition:"rnb-lounge support variant 1",
decision:"Apply support policy for rnb-lounge",
role:"stroke",
policy:"warm-premium",
weight:98
},
{
id:"rnb-lounge:support:2",
story:"rnb-lounge",
principle:"support",
condition:"rnb-lounge support variant 2",
decision:"Apply support policy for rnb-lounge",
role:"glow",
policy:"champagne-black",
weight:74
},
{
id:"rnb-lounge:support:3",
story:"rnb-lounge",
principle:"support",
condition:"rnb-lounge support variant 3",
decision:"Apply support policy for rnb-lounge",
role:"neutral",
policy:"tropical-emerald",
weight:81
},
{
id:"rnb-lounge:support:4",
story:"rnb-lounge",
principle:"support",
condition:"rnb-lounge support variant 4",
decision:"Apply support policy for rnb-lounge",
role:"utility",
policy:"rose-glamour",
weight:88
},
{
id:"rnb-lounge:accent:1",
story:"rnb-lounge",
principle:"accent",
condition:"rnb-lounge accent variant 1",
decision:"Apply accent policy for rnb-lounge",
role:"background",
policy:"sunset-warm",
weight:95
},
{
id:"rnb-lounge:accent:2",
story:"rnb-lounge",
principle:"accent",
condition:"rnb-lounge accent variant 2",
decision:"Apply accent policy for rnb-lounge",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:71
},
{
id:"rnb-lounge:accent:3",
story:"rnb-lounge",
principle:"accent",
condition:"rnb-lounge accent variant 3",
decision:"Apply accent policy for rnb-lounge",
role:"headline",
policy:"electric-night",
weight:78
},
{
id:"rnb-lounge:accent:4",
story:"rnb-lounge",
principle:"accent",
condition:"rnb-lounge accent variant 4",
decision:"Apply accent policy for rnb-lounge",
role:"accent",
policy:"industrial-monochrome",
weight:85
},
{
id:"rnb-lounge:neutral:1",
story:"rnb-lounge",
principle:"neutral",
condition:"rnb-lounge neutral variant 1",
decision:"Apply neutral policy for rnb-lounge",
role:"metadata",
policy:"retro-pop",
weight:92
},
{
id:"rnb-lounge:neutral:2",
story:"rnb-lounge",
principle:"neutral",
condition:"rnb-lounge neutral variant 2",
decision:"Apply neutral policy for rnb-lounge",
role:"dateTime",
policy:"neutral-editorial",
weight:99
},
{
id:"rnb-lounge:neutral:3",
story:"rnb-lounge",
principle:"neutral",
condition:"rnb-lounge neutral variant 3",
decision:"Apply neutral policy for rnb-lounge",
role:"venue",
policy:"image-led",
weight:75
},
{
id:"rnb-lounge:neutral:4",
story:"rnb-lounge",
principle:"neutral",
condition:"rnb-lounge neutral variant 4",
decision:"Apply neutral policy for rnb-lounge",
role:"badgeBackground",
policy:"warm-premium",
weight:82
},
{
id:"rnb-lounge:contrast:1",
story:"rnb-lounge",
principle:"contrast",
condition:"rnb-lounge contrast variant 1",
decision:"Apply contrast policy for rnb-lounge",
role:"badgeText",
policy:"champagne-black",
weight:89
},
{
id:"rnb-lounge:contrast:2",
story:"rnb-lounge",
principle:"contrast",
condition:"rnb-lounge contrast variant 2",
decision:"Apply contrast policy for rnb-lounge",
role:"presenter",
policy:"tropical-emerald",
weight:96
},
{
id:"rnb-lounge:contrast:3",
story:"rnb-lounge",
principle:"contrast",
condition:"rnb-lounge contrast variant 3",
decision:"Apply contrast policy for rnb-lounge",
role:"footer",
policy:"rose-glamour",
weight:72
},
{
id:"rnb-lounge:contrast:4",
story:"rnb-lounge",
principle:"contrast",
condition:"rnb-lounge contrast variant 4",
decision:"Apply contrast policy for rnb-lounge",
role:"stroke",
policy:"sunset-warm",
weight:79
},
{
id:"rnb-lounge:skin:1",
story:"rnb-lounge",
principle:"skin",
condition:"rnb-lounge skin variant 1",
decision:"Apply skin policy for rnb-lounge",
role:"glow",
policy:"burgundy-intimate",
weight:86
},
{
id:"rnb-lounge:skin:2",
story:"rnb-lounge",
principle:"skin",
condition:"rnb-lounge skin variant 2",
decision:"Apply skin policy for rnb-lounge",
role:"neutral",
policy:"electric-night",
weight:93
},
{
id:"rnb-lounge:skin:3",
story:"rnb-lounge",
principle:"skin",
condition:"rnb-lounge skin variant 3",
decision:"Apply skin policy for rnb-lounge",
role:"utility",
policy:"industrial-monochrome",
weight:100
},
{
id:"rnb-lounge:skin:4",
story:"rnb-lounge",
principle:"skin",
condition:"rnb-lounge skin variant 4",
decision:"Apply skin policy for rnb-lounge",
role:"background",
policy:"retro-pop",
weight:76
},
{
id:"rnb-lounge:saturation:1",
story:"rnb-lounge",
principle:"saturation",
condition:"rnb-lounge saturation variant 1",
decision:"Apply saturation policy for rnb-lounge",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:83
},
{
id:"rnb-lounge:saturation:2",
story:"rnb-lounge",
principle:"saturation",
condition:"rnb-lounge saturation variant 2",
decision:"Apply saturation policy for rnb-lounge",
role:"headline",
policy:"image-led",
weight:90
},
{
id:"rnb-lounge:saturation:3",
story:"rnb-lounge",
principle:"saturation",
condition:"rnb-lounge saturation variant 3",
decision:"Apply saturation policy for rnb-lounge",
role:"accent",
policy:"warm-premium",
weight:97
},
{
id:"rnb-lounge:saturation:4",
story:"rnb-lounge",
principle:"saturation",
condition:"rnb-lounge saturation variant 4",
decision:"Apply saturation policy for rnb-lounge",
role:"metadata",
policy:"champagne-black",
weight:73
},
{
id:"rnb-lounge:harmony:1",
story:"rnb-lounge",
principle:"harmony",
condition:"rnb-lounge harmony variant 1",
decision:"Apply harmony policy for rnb-lounge",
role:"dateTime",
policy:"tropical-emerald",
weight:80
},
{
id:"rnb-lounge:harmony:2",
story:"rnb-lounge",
principle:"harmony",
condition:"rnb-lounge harmony variant 2",
decision:"Apply harmony policy for rnb-lounge",
role:"venue",
policy:"rose-glamour",
weight:87
},
{
id:"rnb-lounge:harmony:3",
story:"rnb-lounge",
principle:"harmony",
condition:"rnb-lounge harmony variant 3",
decision:"Apply harmony policy for rnb-lounge",
role:"badgeBackground",
policy:"sunset-warm",
weight:94
},
{
id:"rnb-lounge:harmony:4",
story:"rnb-lounge",
principle:"harmony",
condition:"rnb-lounge harmony variant 4",
decision:"Apply harmony policy for rnb-lounge",
role:"badgeText",
policy:"burgundy-intimate",
weight:70
},
{
id:"rnb-lounge:temperature:1",
story:"rnb-lounge",
principle:"temperature",
condition:"rnb-lounge temperature variant 1",
decision:"Apply temperature policy for rnb-lounge",
role:"presenter",
policy:"electric-night",
weight:77
},
{
id:"rnb-lounge:temperature:2",
story:"rnb-lounge",
principle:"temperature",
condition:"rnb-lounge temperature variant 2",
decision:"Apply temperature policy for rnb-lounge",
role:"footer",
policy:"industrial-monochrome",
weight:84
},
{
id:"rnb-lounge:temperature:3",
story:"rnb-lounge",
principle:"temperature",
condition:"rnb-lounge temperature variant 3",
decision:"Apply temperature policy for rnb-lounge",
role:"stroke",
policy:"retro-pop",
weight:91
},
{
id:"rnb-lounge:temperature:4",
story:"rnb-lounge",
principle:"temperature",
condition:"rnb-lounge temperature variant 4",
decision:"Apply temperature policy for rnb-lounge",
role:"glow",
policy:"neutral-editorial",
weight:98
},
{
id:"rnb-lounge:background:1",
story:"rnb-lounge",
principle:"background",
condition:"rnb-lounge background variant 1",
decision:"Apply background policy for rnb-lounge",
role:"neutral",
policy:"image-led",
weight:74
},
{
id:"rnb-lounge:background:2",
story:"rnb-lounge",
principle:"background",
condition:"rnb-lounge background variant 2",
decision:"Apply background policy for rnb-lounge",
role:"utility",
policy:"warm-premium",
weight:81
},
{
id:"rnb-lounge:background:3",
story:"rnb-lounge",
principle:"background",
condition:"rnb-lounge background variant 3",
decision:"Apply background policy for rnb-lounge",
role:"background",
policy:"champagne-black",
weight:88
},
{
id:"rnb-lounge:background:4",
story:"rnb-lounge",
principle:"background",
condition:"rnb-lounge background variant 4",
decision:"Apply background policy for rnb-lounge",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:95
},
{
id:"rnb-lounge:headline:1",
story:"rnb-lounge",
principle:"headline",
condition:"rnb-lounge headline variant 1",
decision:"Apply headline policy for rnb-lounge",
role:"headline",
policy:"rose-glamour",
weight:71
},
{
id:"rnb-lounge:headline:2",
story:"rnb-lounge",
principle:"headline",
condition:"rnb-lounge headline variant 2",
decision:"Apply headline policy for rnb-lounge",
role:"accent",
policy:"sunset-warm",
weight:78
},
{
id:"rnb-lounge:headline:3",
story:"rnb-lounge",
principle:"headline",
condition:"rnb-lounge headline variant 3",
decision:"Apply headline policy for rnb-lounge",
role:"metadata",
policy:"burgundy-intimate",
weight:85
},
{
id:"rnb-lounge:headline:4",
story:"rnb-lounge",
principle:"headline",
condition:"rnb-lounge headline variant 4",
decision:"Apply headline policy for rnb-lounge",
role:"dateTime",
policy:"electric-night",
weight:92
},
{
id:"rnb-lounge:metadata:1",
story:"rnb-lounge",
principle:"metadata",
condition:"rnb-lounge metadata variant 1",
decision:"Apply metadata policy for rnb-lounge",
role:"venue",
policy:"industrial-monochrome",
weight:99
},
{
id:"rnb-lounge:metadata:2",
story:"rnb-lounge",
principle:"metadata",
condition:"rnb-lounge metadata variant 2",
decision:"Apply metadata policy for rnb-lounge",
role:"badgeBackground",
policy:"retro-pop",
weight:75
},
{
id:"rnb-lounge:metadata:3",
story:"rnb-lounge",
principle:"metadata",
condition:"rnb-lounge metadata variant 3",
decision:"Apply metadata policy for rnb-lounge",
role:"badgeText",
policy:"neutral-editorial",
weight:82
},
{
id:"rnb-lounge:metadata:4",
story:"rnb-lounge",
principle:"metadata",
condition:"rnb-lounge metadata variant 4",
decision:"Apply metadata policy for rnb-lounge",
role:"presenter",
policy:"image-led",
weight:89
},
{
id:"rnb-lounge:badge:1",
story:"rnb-lounge",
principle:"badge",
condition:"rnb-lounge badge variant 1",
decision:"Apply badge policy for rnb-lounge",
role:"footer",
policy:"warm-premium",
weight:96
},
{
id:"rnb-lounge:badge:2",
story:"rnb-lounge",
principle:"badge",
condition:"rnb-lounge badge variant 2",
decision:"Apply badge policy for rnb-lounge",
role:"stroke",
policy:"champagne-black",
weight:72
},
{
id:"rnb-lounge:badge:3",
story:"rnb-lounge",
principle:"badge",
condition:"rnb-lounge badge variant 3",
decision:"Apply badge policy for rnb-lounge",
role:"glow",
policy:"tropical-emerald",
weight:79
},
{
id:"rnb-lounge:badge:4",
story:"rnb-lounge",
principle:"badge",
condition:"rnb-lounge badge variant 4",
decision:"Apply badge policy for rnb-lounge",
role:"neutral",
policy:"rose-glamour",
weight:86
},
{
id:"rnb-lounge:glow:1",
story:"rnb-lounge",
principle:"glow",
condition:"rnb-lounge glow variant 1",
decision:"Apply glow policy for rnb-lounge",
role:"utility",
policy:"sunset-warm",
weight:93
},
{
id:"rnb-lounge:glow:2",
story:"rnb-lounge",
principle:"glow",
condition:"rnb-lounge glow variant 2",
decision:"Apply glow policy for rnb-lounge",
role:"background",
policy:"burgundy-intimate",
weight:100
},
{
id:"rnb-lounge:glow:3",
story:"rnb-lounge",
principle:"glow",
condition:"rnb-lounge glow variant 3",
decision:"Apply glow policy for rnb-lounge",
role:"backgroundSecondary",
policy:"electric-night",
weight:76
},
{
id:"rnb-lounge:glow:4",
story:"rnb-lounge",
principle:"glow",
condition:"rnb-lounge glow variant 4",
decision:"Apply glow policy for rnb-lounge",
role:"headline",
policy:"industrial-monochrome",
weight:83
},
{
id:"rnb-lounge:cast:1",
story:"rnb-lounge",
principle:"cast",
condition:"rnb-lounge cast variant 1",
decision:"Apply cast policy for rnb-lounge",
role:"accent",
policy:"retro-pop",
weight:90
},
{
id:"rnb-lounge:cast:2",
story:"rnb-lounge",
principle:"cast",
condition:"rnb-lounge cast variant 2",
decision:"Apply cast policy for rnb-lounge",
role:"metadata",
policy:"neutral-editorial",
weight:97
},
{
id:"rnb-lounge:cast:3",
story:"rnb-lounge",
principle:"cast",
condition:"rnb-lounge cast variant 3",
decision:"Apply cast policy for rnb-lounge",
role:"dateTime",
policy:"image-led",
weight:73
},
{
id:"rnb-lounge:cast:4",
story:"rnb-lounge",
principle:"cast",
condition:"rnb-lounge cast variant 4",
decision:"Apply cast policy for rnb-lounge",
role:"venue",
policy:"warm-premium",
weight:80
},
{
id:"rnb-lounge:brand:1",
story:"rnb-lounge",
principle:"brand",
condition:"rnb-lounge brand variant 1",
decision:"Apply brand policy for rnb-lounge",
role:"badgeBackground",
policy:"champagne-black",
weight:87
},
{
id:"rnb-lounge:brand:2",
story:"rnb-lounge",
principle:"brand",
condition:"rnb-lounge brand variant 2",
decision:"Apply brand policy for rnb-lounge",
role:"badgeText",
policy:"tropical-emerald",
weight:94
},
{
id:"rnb-lounge:brand:3",
story:"rnb-lounge",
principle:"brand",
condition:"rnb-lounge brand variant 3",
decision:"Apply brand policy for rnb-lounge",
role:"presenter",
policy:"rose-glamour",
weight:70
},
{
id:"rnb-lounge:brand:4",
story:"rnb-lounge",
principle:"brand",
condition:"rnb-lounge brand variant 4",
decision:"Apply brand policy for rnb-lounge",
role:"footer",
policy:"sunset-warm",
weight:77
},
{
id:"rnb-lounge:export:1",
story:"rnb-lounge",
principle:"export",
condition:"rnb-lounge export variant 1",
decision:"Apply export policy for rnb-lounge",
role:"stroke",
policy:"burgundy-intimate",
weight:84
},
{
id:"rnb-lounge:export:2",
story:"rnb-lounge",
principle:"export",
condition:"rnb-lounge export variant 2",
decision:"Apply export policy for rnb-lounge",
role:"glow",
policy:"electric-night",
weight:91
},
{
id:"rnb-lounge:export:3",
story:"rnb-lounge",
principle:"export",
condition:"rnb-lounge export variant 3",
decision:"Apply export policy for rnb-lounge",
role:"neutral",
policy:"industrial-monochrome",
weight:98
},
{
id:"rnb-lounge:export:4",
story:"rnb-lounge",
principle:"export",
condition:"rnb-lounge export variant 4",
decision:"Apply export policy for rnb-lounge",
role:"utility",
policy:"retro-pop",
weight:74
},
{
id:"rnb-lounge:accessibility:1",
story:"rnb-lounge",
principle:"accessibility",
condition:"rnb-lounge accessibility variant 1",
decision:"Apply accessibility policy for rnb-lounge",
role:"background",
policy:"neutral-editorial",
weight:81
},
{
id:"rnb-lounge:accessibility:2",
story:"rnb-lounge",
principle:"accessibility",
condition:"rnb-lounge accessibility variant 2",
decision:"Apply accessibility policy for rnb-lounge",
role:"backgroundSecondary",
policy:"image-led",
weight:88
},
{
id:"rnb-lounge:accessibility:3",
story:"rnb-lounge",
principle:"accessibility",
condition:"rnb-lounge accessibility variant 3",
decision:"Apply accessibility policy for rnb-lounge",
role:"headline",
policy:"warm-premium",
weight:95
},
{
id:"rnb-lounge:accessibility:4",
story:"rnb-lounge",
principle:"accessibility",
condition:"rnb-lounge accessibility variant 4",
decision:"Apply accessibility policy for rnb-lounge",
role:"accent",
policy:"champagne-black",
weight:71
},
{
id:"vip-bottle-service:dominant:1",
story:"vip-bottle-service",
principle:"dominant",
condition:"vip-bottle-service dominant variant 1",
decision:"Apply dominant policy for vip-bottle-service",
role:"metadata",
policy:"tropical-emerald",
weight:78
},
{
id:"vip-bottle-service:dominant:2",
story:"vip-bottle-service",
principle:"dominant",
condition:"vip-bottle-service dominant variant 2",
decision:"Apply dominant policy for vip-bottle-service",
role:"dateTime",
policy:"rose-glamour",
weight:85
},
{
id:"vip-bottle-service:dominant:3",
story:"vip-bottle-service",
principle:"dominant",
condition:"vip-bottle-service dominant variant 3",
decision:"Apply dominant policy for vip-bottle-service",
role:"venue",
policy:"sunset-warm",
weight:92
},
{
id:"vip-bottle-service:dominant:4",
story:"vip-bottle-service",
principle:"dominant",
condition:"vip-bottle-service dominant variant 4",
decision:"Apply dominant policy for vip-bottle-service",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:99
},
{
id:"vip-bottle-service:support:1",
story:"vip-bottle-service",
principle:"support",
condition:"vip-bottle-service support variant 1",
decision:"Apply support policy for vip-bottle-service",
role:"badgeText",
policy:"electric-night",
weight:75
},
{
id:"vip-bottle-service:support:2",
story:"vip-bottle-service",
principle:"support",
condition:"vip-bottle-service support variant 2",
decision:"Apply support policy for vip-bottle-service",
role:"presenter",
policy:"industrial-monochrome",
weight:82
},
{
id:"vip-bottle-service:support:3",
story:"vip-bottle-service",
principle:"support",
condition:"vip-bottle-service support variant 3",
decision:"Apply support policy for vip-bottle-service",
role:"footer",
policy:"retro-pop",
weight:89
},
{
id:"vip-bottle-service:support:4",
story:"vip-bottle-service",
principle:"support",
condition:"vip-bottle-service support variant 4",
decision:"Apply support policy for vip-bottle-service",
role:"stroke",
policy:"neutral-editorial",
weight:96
},
{
id:"vip-bottle-service:accent:1",
story:"vip-bottle-service",
principle:"accent",
condition:"vip-bottle-service accent variant 1",
decision:"Apply accent policy for vip-bottle-service",
role:"glow",
policy:"image-led",
weight:72
},
{
id:"vip-bottle-service:accent:2",
story:"vip-bottle-service",
principle:"accent",
condition:"vip-bottle-service accent variant 2",
decision:"Apply accent policy for vip-bottle-service",
role:"neutral",
policy:"warm-premium",
weight:79
},
{
id:"vip-bottle-service:accent:3",
story:"vip-bottle-service",
principle:"accent",
condition:"vip-bottle-service accent variant 3",
decision:"Apply accent policy for vip-bottle-service",
role:"utility",
policy:"champagne-black",
weight:86
},
{
id:"vip-bottle-service:accent:4",
story:"vip-bottle-service",
principle:"accent",
condition:"vip-bottle-service accent variant 4",
decision:"Apply accent policy for vip-bottle-service",
role:"background",
policy:"tropical-emerald",
weight:93
},
{
id:"vip-bottle-service:neutral:1",
story:"vip-bottle-service",
principle:"neutral",
condition:"vip-bottle-service neutral variant 1",
decision:"Apply neutral policy for vip-bottle-service",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:100
},
{
id:"vip-bottle-service:neutral:2",
story:"vip-bottle-service",
principle:"neutral",
condition:"vip-bottle-service neutral variant 2",
decision:"Apply neutral policy for vip-bottle-service",
role:"headline",
policy:"sunset-warm",
weight:76
},
{
id:"vip-bottle-service:neutral:3",
story:"vip-bottle-service",
principle:"neutral",
condition:"vip-bottle-service neutral variant 3",
decision:"Apply neutral policy for vip-bottle-service",
role:"accent",
policy:"burgundy-intimate",
weight:83
},
{
id:"vip-bottle-service:neutral:4",
story:"vip-bottle-service",
principle:"neutral",
condition:"vip-bottle-service neutral variant 4",
decision:"Apply neutral policy for vip-bottle-service",
role:"metadata",
policy:"electric-night",
weight:90
},
{
id:"vip-bottle-service:contrast:1",
story:"vip-bottle-service",
principle:"contrast",
condition:"vip-bottle-service contrast variant 1",
decision:"Apply contrast policy for vip-bottle-service",
role:"dateTime",
policy:"industrial-monochrome",
weight:97
},
{
id:"vip-bottle-service:contrast:2",
story:"vip-bottle-service",
principle:"contrast",
condition:"vip-bottle-service contrast variant 2",
decision:"Apply contrast policy for vip-bottle-service",
role:"venue",
policy:"retro-pop",
weight:73
},
{
id:"vip-bottle-service:contrast:3",
story:"vip-bottle-service",
principle:"contrast",
condition:"vip-bottle-service contrast variant 3",
decision:"Apply contrast policy for vip-bottle-service",
role:"badgeBackground",
policy:"neutral-editorial",
weight:80
},
{
id:"vip-bottle-service:contrast:4",
story:"vip-bottle-service",
principle:"contrast",
condition:"vip-bottle-service contrast variant 4",
decision:"Apply contrast policy for vip-bottle-service",
role:"badgeText",
policy:"image-led",
weight:87
},
{
id:"vip-bottle-service:skin:1",
story:"vip-bottle-service",
principle:"skin",
condition:"vip-bottle-service skin variant 1",
decision:"Apply skin policy for vip-bottle-service",
role:"presenter",
policy:"warm-premium",
weight:94
},
{
id:"vip-bottle-service:skin:2",
story:"vip-bottle-service",
principle:"skin",
condition:"vip-bottle-service skin variant 2",
decision:"Apply skin policy for vip-bottle-service",
role:"footer",
policy:"champagne-black",
weight:70
},
{
id:"vip-bottle-service:skin:3",
story:"vip-bottle-service",
principle:"skin",
condition:"vip-bottle-service skin variant 3",
decision:"Apply skin policy for vip-bottle-service",
role:"stroke",
policy:"tropical-emerald",
weight:77
},
{
id:"vip-bottle-service:skin:4",
story:"vip-bottle-service",
principle:"skin",
condition:"vip-bottle-service skin variant 4",
decision:"Apply skin policy for vip-bottle-service",
role:"glow",
policy:"rose-glamour",
weight:84
},
{
id:"vip-bottle-service:saturation:1",
story:"vip-bottle-service",
principle:"saturation",
condition:"vip-bottle-service saturation variant 1",
decision:"Apply saturation policy for vip-bottle-service",
role:"neutral",
policy:"sunset-warm",
weight:91
},
{
id:"vip-bottle-service:saturation:2",
story:"vip-bottle-service",
principle:"saturation",
condition:"vip-bottle-service saturation variant 2",
decision:"Apply saturation policy for vip-bottle-service",
role:"utility",
policy:"burgundy-intimate",
weight:98
},
{
id:"vip-bottle-service:saturation:3",
story:"vip-bottle-service",
principle:"saturation",
condition:"vip-bottle-service saturation variant 3",
decision:"Apply saturation policy for vip-bottle-service",
role:"background",
policy:"electric-night",
weight:74
},
{
id:"vip-bottle-service:saturation:4",
story:"vip-bottle-service",
principle:"saturation",
condition:"vip-bottle-service saturation variant 4",
decision:"Apply saturation policy for vip-bottle-service",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:81
},
{
id:"vip-bottle-service:harmony:1",
story:"vip-bottle-service",
principle:"harmony",
condition:"vip-bottle-service harmony variant 1",
decision:"Apply harmony policy for vip-bottle-service",
role:"headline",
policy:"retro-pop",
weight:88
},
{
id:"vip-bottle-service:harmony:2",
story:"vip-bottle-service",
principle:"harmony",
condition:"vip-bottle-service harmony variant 2",
decision:"Apply harmony policy for vip-bottle-service",
role:"accent",
policy:"neutral-editorial",
weight:95
},
{
id:"vip-bottle-service:harmony:3",
story:"vip-bottle-service",
principle:"harmony",
condition:"vip-bottle-service harmony variant 3",
decision:"Apply harmony policy for vip-bottle-service",
role:"metadata",
policy:"image-led",
weight:71
},
{
id:"vip-bottle-service:harmony:4",
story:"vip-bottle-service",
principle:"harmony",
condition:"vip-bottle-service harmony variant 4",
decision:"Apply harmony policy for vip-bottle-service",
role:"dateTime",
policy:"warm-premium",
weight:78
},
{
id:"vip-bottle-service:temperature:1",
story:"vip-bottle-service",
principle:"temperature",
condition:"vip-bottle-service temperature variant 1",
decision:"Apply temperature policy for vip-bottle-service",
role:"venue",
policy:"champagne-black",
weight:85
},
{
id:"vip-bottle-service:temperature:2",
story:"vip-bottle-service",
principle:"temperature",
condition:"vip-bottle-service temperature variant 2",
decision:"Apply temperature policy for vip-bottle-service",
role:"badgeBackground",
policy:"tropical-emerald",
weight:92
},
{
id:"vip-bottle-service:temperature:3",
story:"vip-bottle-service",
principle:"temperature",
condition:"vip-bottle-service temperature variant 3",
decision:"Apply temperature policy for vip-bottle-service",
role:"badgeText",
policy:"rose-glamour",
weight:99
},
{
id:"vip-bottle-service:temperature:4",
story:"vip-bottle-service",
principle:"temperature",
condition:"vip-bottle-service temperature variant 4",
decision:"Apply temperature policy for vip-bottle-service",
role:"presenter",
policy:"sunset-warm",
weight:75
},
{
id:"vip-bottle-service:background:1",
story:"vip-bottle-service",
principle:"background",
condition:"vip-bottle-service background variant 1",
decision:"Apply background policy for vip-bottle-service",
role:"footer",
policy:"burgundy-intimate",
weight:82
},
{
id:"vip-bottle-service:background:2",
story:"vip-bottle-service",
principle:"background",
condition:"vip-bottle-service background variant 2",
decision:"Apply background policy for vip-bottle-service",
role:"stroke",
policy:"electric-night",
weight:89
},
{
id:"vip-bottle-service:background:3",
story:"vip-bottle-service",
principle:"background",
condition:"vip-bottle-service background variant 3",
decision:"Apply background policy for vip-bottle-service",
role:"glow",
policy:"industrial-monochrome",
weight:96
},
{
id:"vip-bottle-service:background:4",
story:"vip-bottle-service",
principle:"background",
condition:"vip-bottle-service background variant 4",
decision:"Apply background policy for vip-bottle-service",
role:"neutral",
policy:"retro-pop",
weight:72
},
{
id:"vip-bottle-service:headline:1",
story:"vip-bottle-service",
principle:"headline",
condition:"vip-bottle-service headline variant 1",
decision:"Apply headline policy for vip-bottle-service",
role:"utility",
policy:"neutral-editorial",
weight:79
},
{
id:"vip-bottle-service:headline:2",
story:"vip-bottle-service",
principle:"headline",
condition:"vip-bottle-service headline variant 2",
decision:"Apply headline policy for vip-bottle-service",
role:"background",
policy:"image-led",
weight:86
},
{
id:"vip-bottle-service:headline:3",
story:"vip-bottle-service",
principle:"headline",
condition:"vip-bottle-service headline variant 3",
decision:"Apply headline policy for vip-bottle-service",
role:"backgroundSecondary",
policy:"warm-premium",
weight:93
},
{
id:"vip-bottle-service:headline:4",
story:"vip-bottle-service",
principle:"headline",
condition:"vip-bottle-service headline variant 4",
decision:"Apply headline policy for vip-bottle-service",
role:"headline",
policy:"champagne-black",
weight:100
},
{
id:"vip-bottle-service:metadata:1",
story:"vip-bottle-service",
principle:"metadata",
condition:"vip-bottle-service metadata variant 1",
decision:"Apply metadata policy for vip-bottle-service",
role:"accent",
policy:"tropical-emerald",
weight:76
},
{
id:"vip-bottle-service:metadata:2",
story:"vip-bottle-service",
principle:"metadata",
condition:"vip-bottle-service metadata variant 2",
decision:"Apply metadata policy for vip-bottle-service",
role:"metadata",
policy:"rose-glamour",
weight:83
},
{
id:"vip-bottle-service:metadata:3",
story:"vip-bottle-service",
principle:"metadata",
condition:"vip-bottle-service metadata variant 3",
decision:"Apply metadata policy for vip-bottle-service",
role:"dateTime",
policy:"sunset-warm",
weight:90
},
{
id:"vip-bottle-service:metadata:4",
story:"vip-bottle-service",
principle:"metadata",
condition:"vip-bottle-service metadata variant 4",
decision:"Apply metadata policy for vip-bottle-service",
role:"venue",
policy:"burgundy-intimate",
weight:97
},
{
id:"vip-bottle-service:badge:1",
story:"vip-bottle-service",
principle:"badge",
condition:"vip-bottle-service badge variant 1",
decision:"Apply badge policy for vip-bottle-service",
role:"badgeBackground",
policy:"electric-night",
weight:73
},
{
id:"vip-bottle-service:badge:2",
story:"vip-bottle-service",
principle:"badge",
condition:"vip-bottle-service badge variant 2",
decision:"Apply badge policy for vip-bottle-service",
role:"badgeText",
policy:"industrial-monochrome",
weight:80
},
{
id:"vip-bottle-service:badge:3",
story:"vip-bottle-service",
principle:"badge",
condition:"vip-bottle-service badge variant 3",
decision:"Apply badge policy for vip-bottle-service",
role:"presenter",
policy:"retro-pop",
weight:87
},
{
id:"vip-bottle-service:badge:4",
story:"vip-bottle-service",
principle:"badge",
condition:"vip-bottle-service badge variant 4",
decision:"Apply badge policy for vip-bottle-service",
role:"footer",
policy:"neutral-editorial",
weight:94
},
{
id:"vip-bottle-service:glow:1",
story:"vip-bottle-service",
principle:"glow",
condition:"vip-bottle-service glow variant 1",
decision:"Apply glow policy for vip-bottle-service",
role:"stroke",
policy:"image-led",
weight:70
},
{
id:"vip-bottle-service:glow:2",
story:"vip-bottle-service",
principle:"glow",
condition:"vip-bottle-service glow variant 2",
decision:"Apply glow policy for vip-bottle-service",
role:"glow",
policy:"warm-premium",
weight:77
},
{
id:"vip-bottle-service:glow:3",
story:"vip-bottle-service",
principle:"glow",
condition:"vip-bottle-service glow variant 3",
decision:"Apply glow policy for vip-bottle-service",
role:"neutral",
policy:"champagne-black",
weight:84
},
{
id:"vip-bottle-service:glow:4",
story:"vip-bottle-service",
principle:"glow",
condition:"vip-bottle-service glow variant 4",
decision:"Apply glow policy for vip-bottle-service",
role:"utility",
policy:"tropical-emerald",
weight:91
},
{
id:"vip-bottle-service:cast:1",
story:"vip-bottle-service",
principle:"cast",
condition:"vip-bottle-service cast variant 1",
decision:"Apply cast policy for vip-bottle-service",
role:"background",
policy:"rose-glamour",
weight:98
},
{
id:"vip-bottle-service:cast:2",
story:"vip-bottle-service",
principle:"cast",
condition:"vip-bottle-service cast variant 2",
decision:"Apply cast policy for vip-bottle-service",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:74
},
{
id:"vip-bottle-service:cast:3",
story:"vip-bottle-service",
principle:"cast",
condition:"vip-bottle-service cast variant 3",
decision:"Apply cast policy for vip-bottle-service",
role:"headline",
policy:"burgundy-intimate",
weight:81
},
{
id:"vip-bottle-service:cast:4",
story:"vip-bottle-service",
principle:"cast",
condition:"vip-bottle-service cast variant 4",
decision:"Apply cast policy for vip-bottle-service",
role:"accent",
policy:"electric-night",
weight:88
},
{
id:"vip-bottle-service:brand:1",
story:"vip-bottle-service",
principle:"brand",
condition:"vip-bottle-service brand variant 1",
decision:"Apply brand policy for vip-bottle-service",
role:"metadata",
policy:"industrial-monochrome",
weight:95
},
{
id:"vip-bottle-service:brand:2",
story:"vip-bottle-service",
principle:"brand",
condition:"vip-bottle-service brand variant 2",
decision:"Apply brand policy for vip-bottle-service",
role:"dateTime",
policy:"retro-pop",
weight:71
},
{
id:"vip-bottle-service:brand:3",
story:"vip-bottle-service",
principle:"brand",
condition:"vip-bottle-service brand variant 3",
decision:"Apply brand policy for vip-bottle-service",
role:"venue",
policy:"neutral-editorial",
weight:78
},
{
id:"vip-bottle-service:brand:4",
story:"vip-bottle-service",
principle:"brand",
condition:"vip-bottle-service brand variant 4",
decision:"Apply brand policy for vip-bottle-service",
role:"badgeBackground",
policy:"image-led",
weight:85
},
{
id:"vip-bottle-service:export:1",
story:"vip-bottle-service",
principle:"export",
condition:"vip-bottle-service export variant 1",
decision:"Apply export policy for vip-bottle-service",
role:"badgeText",
policy:"warm-premium",
weight:92
},
{
id:"vip-bottle-service:export:2",
story:"vip-bottle-service",
principle:"export",
condition:"vip-bottle-service export variant 2",
decision:"Apply export policy for vip-bottle-service",
role:"presenter",
policy:"champagne-black",
weight:99
},
{
id:"vip-bottle-service:export:3",
story:"vip-bottle-service",
principle:"export",
condition:"vip-bottle-service export variant 3",
decision:"Apply export policy for vip-bottle-service",
role:"footer",
policy:"tropical-emerald",
weight:75
},
{
id:"vip-bottle-service:export:4",
story:"vip-bottle-service",
principle:"export",
condition:"vip-bottle-service export variant 4",
decision:"Apply export policy for vip-bottle-service",
role:"stroke",
policy:"rose-glamour",
weight:82
},
{
id:"vip-bottle-service:accessibility:1",
story:"vip-bottle-service",
principle:"accessibility",
condition:"vip-bottle-service accessibility variant 1",
decision:"Apply accessibility policy for vip-bottle-service",
role:"glow",
policy:"sunset-warm",
weight:89
},
{
id:"vip-bottle-service:accessibility:2",
story:"vip-bottle-service",
principle:"accessibility",
condition:"vip-bottle-service accessibility variant 2",
decision:"Apply accessibility policy for vip-bottle-service",
role:"neutral",
policy:"burgundy-intimate",
weight:96
},
{
id:"vip-bottle-service:accessibility:3",
story:"vip-bottle-service",
principle:"accessibility",
condition:"vip-bottle-service accessibility variant 3",
decision:"Apply accessibility policy for vip-bottle-service",
role:"utility",
policy:"electric-night",
weight:72
},
{
id:"vip-bottle-service:accessibility:4",
story:"vip-bottle-service",
principle:"accessibility",
condition:"vip-bottle-service accessibility variant 4",
decision:"Apply accessibility policy for vip-bottle-service",
role:"background",
policy:"industrial-monochrome",
weight:79
},
{
id:"latin-night:dominant:1",
story:"latin-night",
principle:"dominant",
condition:"latin-night dominant variant 1",
decision:"Apply dominant policy for latin-night",
role:"backgroundSecondary",
policy:"retro-pop",
weight:86
},
{
id:"latin-night:dominant:2",
story:"latin-night",
principle:"dominant",
condition:"latin-night dominant variant 2",
decision:"Apply dominant policy for latin-night",
role:"headline",
policy:"neutral-editorial",
weight:93
},
{
id:"latin-night:dominant:3",
story:"latin-night",
principle:"dominant",
condition:"latin-night dominant variant 3",
decision:"Apply dominant policy for latin-night",
role:"accent",
policy:"image-led",
weight:100
},
{
id:"latin-night:dominant:4",
story:"latin-night",
principle:"dominant",
condition:"latin-night dominant variant 4",
decision:"Apply dominant policy for latin-night",
role:"metadata",
policy:"warm-premium",
weight:76
},
{
id:"latin-night:support:1",
story:"latin-night",
principle:"support",
condition:"latin-night support variant 1",
decision:"Apply support policy for latin-night",
role:"dateTime",
policy:"champagne-black",
weight:83
},
{
id:"latin-night:support:2",
story:"latin-night",
principle:"support",
condition:"latin-night support variant 2",
decision:"Apply support policy for latin-night",
role:"venue",
policy:"tropical-emerald",
weight:90
},
{
id:"latin-night:support:3",
story:"latin-night",
principle:"support",
condition:"latin-night support variant 3",
decision:"Apply support policy for latin-night",
role:"badgeBackground",
policy:"rose-glamour",
weight:97
},
{
id:"latin-night:support:4",
story:"latin-night",
principle:"support",
condition:"latin-night support variant 4",
decision:"Apply support policy for latin-night",
role:"badgeText",
policy:"sunset-warm",
weight:73
},
{
id:"latin-night:accent:1",
story:"latin-night",
principle:"accent",
condition:"latin-night accent variant 1",
decision:"Apply accent policy for latin-night",
role:"presenter",
policy:"burgundy-intimate",
weight:80
},
{
id:"latin-night:accent:2",
story:"latin-night",
principle:"accent",
condition:"latin-night accent variant 2",
decision:"Apply accent policy for latin-night",
role:"footer",
policy:"electric-night",
weight:87
},
{
id:"latin-night:accent:3",
story:"latin-night",
principle:"accent",
condition:"latin-night accent variant 3",
decision:"Apply accent policy for latin-night",
role:"stroke",
policy:"industrial-monochrome",
weight:94
},
{
id:"latin-night:accent:4",
story:"latin-night",
principle:"accent",
condition:"latin-night accent variant 4",
decision:"Apply accent policy for latin-night",
role:"glow",
policy:"retro-pop",
weight:70
},
{
id:"latin-night:neutral:1",
story:"latin-night",
principle:"neutral",
condition:"latin-night neutral variant 1",
decision:"Apply neutral policy for latin-night",
role:"neutral",
policy:"neutral-editorial",
weight:77
},
{
id:"latin-night:neutral:2",
story:"latin-night",
principle:"neutral",
condition:"latin-night neutral variant 2",
decision:"Apply neutral policy for latin-night",
role:"utility",
policy:"image-led",
weight:84
},
{
id:"latin-night:neutral:3",
story:"latin-night",
principle:"neutral",
condition:"latin-night neutral variant 3",
decision:"Apply neutral policy for latin-night",
role:"background",
policy:"warm-premium",
weight:91
},
{
id:"latin-night:neutral:4",
story:"latin-night",
principle:"neutral",
condition:"latin-night neutral variant 4",
decision:"Apply neutral policy for latin-night",
role:"backgroundSecondary",
policy:"champagne-black",
weight:98
},
{
id:"latin-night:contrast:1",
story:"latin-night",
principle:"contrast",
condition:"latin-night contrast variant 1",
decision:"Apply contrast policy for latin-night",
role:"headline",
policy:"tropical-emerald",
weight:74
},
{
id:"latin-night:contrast:2",
story:"latin-night",
principle:"contrast",
condition:"latin-night contrast variant 2",
decision:"Apply contrast policy for latin-night",
role:"accent",
policy:"rose-glamour",
weight:81
},
{
id:"latin-night:contrast:3",
story:"latin-night",
principle:"contrast",
condition:"latin-night contrast variant 3",
decision:"Apply contrast policy for latin-night",
role:"metadata",
policy:"sunset-warm",
weight:88
},
{
id:"latin-night:contrast:4",
story:"latin-night",
principle:"contrast",
condition:"latin-night contrast variant 4",
decision:"Apply contrast policy for latin-night",
role:"dateTime",
policy:"burgundy-intimate",
weight:95
},
{
id:"latin-night:skin:1",
story:"latin-night",
principle:"skin",
condition:"latin-night skin variant 1",
decision:"Apply skin policy for latin-night",
role:"venue",
policy:"electric-night",
weight:71
},
{
id:"latin-night:skin:2",
story:"latin-night",
principle:"skin",
condition:"latin-night skin variant 2",
decision:"Apply skin policy for latin-night",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:78
},
{
id:"latin-night:skin:3",
story:"latin-night",
principle:"skin",
condition:"latin-night skin variant 3",
decision:"Apply skin policy for latin-night",
role:"badgeText",
policy:"retro-pop",
weight:85
},
{
id:"latin-night:skin:4",
story:"latin-night",
principle:"skin",
condition:"latin-night skin variant 4",
decision:"Apply skin policy for latin-night",
role:"presenter",
policy:"neutral-editorial",
weight:92
},
{
id:"latin-night:saturation:1",
story:"latin-night",
principle:"saturation",
condition:"latin-night saturation variant 1",
decision:"Apply saturation policy for latin-night",
role:"footer",
policy:"image-led",
weight:99
},
{
id:"latin-night:saturation:2",
story:"latin-night",
principle:"saturation",
condition:"latin-night saturation variant 2",
decision:"Apply saturation policy for latin-night",
role:"stroke",
policy:"warm-premium",
weight:75
},
{
id:"latin-night:saturation:3",
story:"latin-night",
principle:"saturation",
condition:"latin-night saturation variant 3",
decision:"Apply saturation policy for latin-night",
role:"glow",
policy:"champagne-black",
weight:82
},
{
id:"latin-night:saturation:4",
story:"latin-night",
principle:"saturation",
condition:"latin-night saturation variant 4",
decision:"Apply saturation policy for latin-night",
role:"neutral",
policy:"tropical-emerald",
weight:89
},
{
id:"latin-night:harmony:1",
story:"latin-night",
principle:"harmony",
condition:"latin-night harmony variant 1",
decision:"Apply harmony policy for latin-night",
role:"utility",
policy:"rose-glamour",
weight:96
},
{
id:"latin-night:harmony:2",
story:"latin-night",
principle:"harmony",
condition:"latin-night harmony variant 2",
decision:"Apply harmony policy for latin-night",
role:"background",
policy:"sunset-warm",
weight:72
},
{
id:"latin-night:harmony:3",
story:"latin-night",
principle:"harmony",
condition:"latin-night harmony variant 3",
decision:"Apply harmony policy for latin-night",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:79
},
{
id:"latin-night:harmony:4",
story:"latin-night",
principle:"harmony",
condition:"latin-night harmony variant 4",
decision:"Apply harmony policy for latin-night",
role:"headline",
policy:"electric-night",
weight:86
},
{
id:"latin-night:temperature:1",
story:"latin-night",
principle:"temperature",
condition:"latin-night temperature variant 1",
decision:"Apply temperature policy for latin-night",
role:"accent",
policy:"industrial-monochrome",
weight:93
},
{
id:"latin-night:temperature:2",
story:"latin-night",
principle:"temperature",
condition:"latin-night temperature variant 2",
decision:"Apply temperature policy for latin-night",
role:"metadata",
policy:"retro-pop",
weight:100
},
{
id:"latin-night:temperature:3",
story:"latin-night",
principle:"temperature",
condition:"latin-night temperature variant 3",
decision:"Apply temperature policy for latin-night",
role:"dateTime",
policy:"neutral-editorial",
weight:76
},
{
id:"latin-night:temperature:4",
story:"latin-night",
principle:"temperature",
condition:"latin-night temperature variant 4",
decision:"Apply temperature policy for latin-night",
role:"venue",
policy:"image-led",
weight:83
},
{
id:"latin-night:background:1",
story:"latin-night",
principle:"background",
condition:"latin-night background variant 1",
decision:"Apply background policy for latin-night",
role:"badgeBackground",
policy:"warm-premium",
weight:90
},
{
id:"latin-night:background:2",
story:"latin-night",
principle:"background",
condition:"latin-night background variant 2",
decision:"Apply background policy for latin-night",
role:"badgeText",
policy:"champagne-black",
weight:97
},
{
id:"latin-night:background:3",
story:"latin-night",
principle:"background",
condition:"latin-night background variant 3",
decision:"Apply background policy for latin-night",
role:"presenter",
policy:"tropical-emerald",
weight:73
},
{
id:"latin-night:background:4",
story:"latin-night",
principle:"background",
condition:"latin-night background variant 4",
decision:"Apply background policy for latin-night",
role:"footer",
policy:"rose-glamour",
weight:80
},
{
id:"latin-night:headline:1",
story:"latin-night",
principle:"headline",
condition:"latin-night headline variant 1",
decision:"Apply headline policy for latin-night",
role:"stroke",
policy:"sunset-warm",
weight:87
},
{
id:"latin-night:headline:2",
story:"latin-night",
principle:"headline",
condition:"latin-night headline variant 2",
decision:"Apply headline policy for latin-night",
role:"glow",
policy:"burgundy-intimate",
weight:94
},
{
id:"latin-night:headline:3",
story:"latin-night",
principle:"headline",
condition:"latin-night headline variant 3",
decision:"Apply headline policy for latin-night",
role:"neutral",
policy:"electric-night",
weight:70
},
{
id:"latin-night:headline:4",
story:"latin-night",
principle:"headline",
condition:"latin-night headline variant 4",
decision:"Apply headline policy for latin-night",
role:"utility",
policy:"industrial-monochrome",
weight:77
},
{
id:"latin-night:metadata:1",
story:"latin-night",
principle:"metadata",
condition:"latin-night metadata variant 1",
decision:"Apply metadata policy for latin-night",
role:"background",
policy:"retro-pop",
weight:84
},
{
id:"latin-night:metadata:2",
story:"latin-night",
principle:"metadata",
condition:"latin-night metadata variant 2",
decision:"Apply metadata policy for latin-night",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:91
},
{
id:"latin-night:metadata:3",
story:"latin-night",
principle:"metadata",
condition:"latin-night metadata variant 3",
decision:"Apply metadata policy for latin-night",
role:"headline",
policy:"image-led",
weight:98
},
{
id:"latin-night:metadata:4",
story:"latin-night",
principle:"metadata",
condition:"latin-night metadata variant 4",
decision:"Apply metadata policy for latin-night",
role:"accent",
policy:"warm-premium",
weight:74
},
{
id:"latin-night:badge:1",
story:"latin-night",
principle:"badge",
condition:"latin-night badge variant 1",
decision:"Apply badge policy for latin-night",
role:"metadata",
policy:"champagne-black",
weight:81
},
{
id:"latin-night:badge:2",
story:"latin-night",
principle:"badge",
condition:"latin-night badge variant 2",
decision:"Apply badge policy for latin-night",
role:"dateTime",
policy:"tropical-emerald",
weight:88
},
{
id:"latin-night:badge:3",
story:"latin-night",
principle:"badge",
condition:"latin-night badge variant 3",
decision:"Apply badge policy for latin-night",
role:"venue",
policy:"rose-glamour",
weight:95
},
{
id:"latin-night:badge:4",
story:"latin-night",
principle:"badge",
condition:"latin-night badge variant 4",
decision:"Apply badge policy for latin-night",
role:"badgeBackground",
policy:"sunset-warm",
weight:71
},
{
id:"latin-night:glow:1",
story:"latin-night",
principle:"glow",
condition:"latin-night glow variant 1",
decision:"Apply glow policy for latin-night",
role:"badgeText",
policy:"burgundy-intimate",
weight:78
},
{
id:"latin-night:glow:2",
story:"latin-night",
principle:"glow",
condition:"latin-night glow variant 2",
decision:"Apply glow policy for latin-night",
role:"presenter",
policy:"electric-night",
weight:85
},
{
id:"latin-night:glow:3",
story:"latin-night",
principle:"glow",
condition:"latin-night glow variant 3",
decision:"Apply glow policy for latin-night",
role:"footer",
policy:"industrial-monochrome",
weight:92
},
{
id:"latin-night:glow:4",
story:"latin-night",
principle:"glow",
condition:"latin-night glow variant 4",
decision:"Apply glow policy for latin-night",
role:"stroke",
policy:"retro-pop",
weight:99
},
{
id:"latin-night:cast:1",
story:"latin-night",
principle:"cast",
condition:"latin-night cast variant 1",
decision:"Apply cast policy for latin-night",
role:"glow",
policy:"neutral-editorial",
weight:75
},
{
id:"latin-night:cast:2",
story:"latin-night",
principle:"cast",
condition:"latin-night cast variant 2",
decision:"Apply cast policy for latin-night",
role:"neutral",
policy:"image-led",
weight:82
},
{
id:"latin-night:cast:3",
story:"latin-night",
principle:"cast",
condition:"latin-night cast variant 3",
decision:"Apply cast policy for latin-night",
role:"utility",
policy:"warm-premium",
weight:89
},
{
id:"latin-night:cast:4",
story:"latin-night",
principle:"cast",
condition:"latin-night cast variant 4",
decision:"Apply cast policy for latin-night",
role:"background",
policy:"champagne-black",
weight:96
},
{
id:"latin-night:brand:1",
story:"latin-night",
principle:"brand",
condition:"latin-night brand variant 1",
decision:"Apply brand policy for latin-night",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:72
},
{
id:"latin-night:brand:2",
story:"latin-night",
principle:"brand",
condition:"latin-night brand variant 2",
decision:"Apply brand policy for latin-night",
role:"headline",
policy:"rose-glamour",
weight:79
},
{
id:"latin-night:brand:3",
story:"latin-night",
principle:"brand",
condition:"latin-night brand variant 3",
decision:"Apply brand policy for latin-night",
role:"accent",
policy:"sunset-warm",
weight:86
},
{
id:"latin-night:brand:4",
story:"latin-night",
principle:"brand",
condition:"latin-night brand variant 4",
decision:"Apply brand policy for latin-night",
role:"metadata",
policy:"burgundy-intimate",
weight:93
},
{
id:"latin-night:export:1",
story:"latin-night",
principle:"export",
condition:"latin-night export variant 1",
decision:"Apply export policy for latin-night",
role:"dateTime",
policy:"electric-night",
weight:100
},
{
id:"latin-night:export:2",
story:"latin-night",
principle:"export",
condition:"latin-night export variant 2",
decision:"Apply export policy for latin-night",
role:"venue",
policy:"industrial-monochrome",
weight:76
},
{
id:"latin-night:export:3",
story:"latin-night",
principle:"export",
condition:"latin-night export variant 3",
decision:"Apply export policy for latin-night",
role:"badgeBackground",
policy:"retro-pop",
weight:83
},
{
id:"latin-night:export:4",
story:"latin-night",
principle:"export",
condition:"latin-night export variant 4",
decision:"Apply export policy for latin-night",
role:"badgeText",
policy:"neutral-editorial",
weight:90
},
{
id:"latin-night:accessibility:1",
story:"latin-night",
principle:"accessibility",
condition:"latin-night accessibility variant 1",
decision:"Apply accessibility policy for latin-night",
role:"presenter",
policy:"image-led",
weight:97
},
{
id:"latin-night:accessibility:2",
story:"latin-night",
principle:"accessibility",
condition:"latin-night accessibility variant 2",
decision:"Apply accessibility policy for latin-night",
role:"footer",
policy:"warm-premium",
weight:73
},
{
id:"latin-night:accessibility:3",
story:"latin-night",
principle:"accessibility",
condition:"latin-night accessibility variant 3",
decision:"Apply accessibility policy for latin-night",
role:"stroke",
policy:"champagne-black",
weight:80
},
{
id:"latin-night:accessibility:4",
story:"latin-night",
principle:"accessibility",
condition:"latin-night accessibility variant 4",
decision:"Apply accessibility policy for latin-night",
role:"glow",
policy:"tropical-emerald",
weight:87
},
{
id:"hiphop-showcase:dominant:1",
story:"hiphop-showcase",
principle:"dominant",
condition:"hiphop-showcase dominant variant 1",
decision:"Apply dominant policy for hiphop-showcase",
role:"neutral",
policy:"rose-glamour",
weight:94
},
{
id:"hiphop-showcase:dominant:2",
story:"hiphop-showcase",
principle:"dominant",
condition:"hiphop-showcase dominant variant 2",
decision:"Apply dominant policy for hiphop-showcase",
role:"utility",
policy:"sunset-warm",
weight:70
},
{
id:"hiphop-showcase:dominant:3",
story:"hiphop-showcase",
principle:"dominant",
condition:"hiphop-showcase dominant variant 3",
decision:"Apply dominant policy for hiphop-showcase",
role:"background",
policy:"burgundy-intimate",
weight:77
},
{
id:"hiphop-showcase:dominant:4",
story:"hiphop-showcase",
principle:"dominant",
condition:"hiphop-showcase dominant variant 4",
decision:"Apply dominant policy for hiphop-showcase",
role:"backgroundSecondary",
policy:"electric-night",
weight:84
},
{
id:"hiphop-showcase:support:1",
story:"hiphop-showcase",
principle:"support",
condition:"hiphop-showcase support variant 1",
decision:"Apply support policy for hiphop-showcase",
role:"headline",
policy:"industrial-monochrome",
weight:91
},
{
id:"hiphop-showcase:support:2",
story:"hiphop-showcase",
principle:"support",
condition:"hiphop-showcase support variant 2",
decision:"Apply support policy for hiphop-showcase",
role:"accent",
policy:"retro-pop",
weight:98
},
{
id:"hiphop-showcase:support:3",
story:"hiphop-showcase",
principle:"support",
condition:"hiphop-showcase support variant 3",
decision:"Apply support policy for hiphop-showcase",
role:"metadata",
policy:"neutral-editorial",
weight:74
},
{
id:"hiphop-showcase:support:4",
story:"hiphop-showcase",
principle:"support",
condition:"hiphop-showcase support variant 4",
decision:"Apply support policy for hiphop-showcase",
role:"dateTime",
policy:"image-led",
weight:81
},
{
id:"hiphop-showcase:accent:1",
story:"hiphop-showcase",
principle:"accent",
condition:"hiphop-showcase accent variant 1",
decision:"Apply accent policy for hiphop-showcase",
role:"venue",
policy:"warm-premium",
weight:88
},
{
id:"hiphop-showcase:accent:2",
story:"hiphop-showcase",
principle:"accent",
condition:"hiphop-showcase accent variant 2",
decision:"Apply accent policy for hiphop-showcase",
role:"badgeBackground",
policy:"champagne-black",
weight:95
},
{
id:"hiphop-showcase:accent:3",
story:"hiphop-showcase",
principle:"accent",
condition:"hiphop-showcase accent variant 3",
decision:"Apply accent policy for hiphop-showcase",
role:"badgeText",
policy:"tropical-emerald",
weight:71
},
{
id:"hiphop-showcase:accent:4",
story:"hiphop-showcase",
principle:"accent",
condition:"hiphop-showcase accent variant 4",
decision:"Apply accent policy for hiphop-showcase",
role:"presenter",
policy:"rose-glamour",
weight:78
},
{
id:"hiphop-showcase:neutral:1",
story:"hiphop-showcase",
principle:"neutral",
condition:"hiphop-showcase neutral variant 1",
decision:"Apply neutral policy for hiphop-showcase",
role:"footer",
policy:"sunset-warm",
weight:85
},
{
id:"hiphop-showcase:neutral:2",
story:"hiphop-showcase",
principle:"neutral",
condition:"hiphop-showcase neutral variant 2",
decision:"Apply neutral policy for hiphop-showcase",
role:"stroke",
policy:"burgundy-intimate",
weight:92
},
{
id:"hiphop-showcase:neutral:3",
story:"hiphop-showcase",
principle:"neutral",
condition:"hiphop-showcase neutral variant 3",
decision:"Apply neutral policy for hiphop-showcase",
role:"glow",
policy:"electric-night",
weight:99
},
{
id:"hiphop-showcase:neutral:4",
story:"hiphop-showcase",
principle:"neutral",
condition:"hiphop-showcase neutral variant 4",
decision:"Apply neutral policy for hiphop-showcase",
role:"neutral",
policy:"industrial-monochrome",
weight:75
},
{
id:"hiphop-showcase:contrast:1",
story:"hiphop-showcase",
principle:"contrast",
condition:"hiphop-showcase contrast variant 1",
decision:"Apply contrast policy for hiphop-showcase",
role:"utility",
policy:"retro-pop",
weight:82
},
{
id:"hiphop-showcase:contrast:2",
story:"hiphop-showcase",
principle:"contrast",
condition:"hiphop-showcase contrast variant 2",
decision:"Apply contrast policy for hiphop-showcase",
role:"background",
policy:"neutral-editorial",
weight:89
},
{
id:"hiphop-showcase:contrast:3",
story:"hiphop-showcase",
principle:"contrast",
condition:"hiphop-showcase contrast variant 3",
decision:"Apply contrast policy for hiphop-showcase",
role:"backgroundSecondary",
policy:"image-led",
weight:96
},
{
id:"hiphop-showcase:contrast:4",
story:"hiphop-showcase",
principle:"contrast",
condition:"hiphop-showcase contrast variant 4",
decision:"Apply contrast policy for hiphop-showcase",
role:"headline",
policy:"warm-premium",
weight:72
},
{
id:"hiphop-showcase:skin:1",
story:"hiphop-showcase",
principle:"skin",
condition:"hiphop-showcase skin variant 1",
decision:"Apply skin policy for hiphop-showcase",
role:"accent",
policy:"champagne-black",
weight:79
},
{
id:"hiphop-showcase:skin:2",
story:"hiphop-showcase",
principle:"skin",
condition:"hiphop-showcase skin variant 2",
decision:"Apply skin policy for hiphop-showcase",
role:"metadata",
policy:"tropical-emerald",
weight:86
},
{
id:"hiphop-showcase:skin:3",
story:"hiphop-showcase",
principle:"skin",
condition:"hiphop-showcase skin variant 3",
decision:"Apply skin policy for hiphop-showcase",
role:"dateTime",
policy:"rose-glamour",
weight:93
},
{
id:"hiphop-showcase:skin:4",
story:"hiphop-showcase",
principle:"skin",
condition:"hiphop-showcase skin variant 4",
decision:"Apply skin policy for hiphop-showcase",
role:"venue",
policy:"sunset-warm",
weight:100
},
{
id:"hiphop-showcase:saturation:1",
story:"hiphop-showcase",
principle:"saturation",
condition:"hiphop-showcase saturation variant 1",
decision:"Apply saturation policy for hiphop-showcase",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:76
},
{
id:"hiphop-showcase:saturation:2",
story:"hiphop-showcase",
principle:"saturation",
condition:"hiphop-showcase saturation variant 2",
decision:"Apply saturation policy for hiphop-showcase",
role:"badgeText",
policy:"electric-night",
weight:83
},
{
id:"hiphop-showcase:saturation:3",
story:"hiphop-showcase",
principle:"saturation",
condition:"hiphop-showcase saturation variant 3",
decision:"Apply saturation policy for hiphop-showcase",
role:"presenter",
policy:"industrial-monochrome",
weight:90
},
{
id:"hiphop-showcase:saturation:4",
story:"hiphop-showcase",
principle:"saturation",
condition:"hiphop-showcase saturation variant 4",
decision:"Apply saturation policy for hiphop-showcase",
role:"footer",
policy:"retro-pop",
weight:97
},
{
id:"hiphop-showcase:harmony:1",
story:"hiphop-showcase",
principle:"harmony",
condition:"hiphop-showcase harmony variant 1",
decision:"Apply harmony policy for hiphop-showcase",
role:"stroke",
policy:"neutral-editorial",
weight:73
},
{
id:"hiphop-showcase:harmony:2",
story:"hiphop-showcase",
principle:"harmony",
condition:"hiphop-showcase harmony variant 2",
decision:"Apply harmony policy for hiphop-showcase",
role:"glow",
policy:"image-led",
weight:80
},
{
id:"hiphop-showcase:harmony:3",
story:"hiphop-showcase",
principle:"harmony",
condition:"hiphop-showcase harmony variant 3",
decision:"Apply harmony policy for hiphop-showcase",
role:"neutral",
policy:"warm-premium",
weight:87
},
{
id:"hiphop-showcase:harmony:4",
story:"hiphop-showcase",
principle:"harmony",
condition:"hiphop-showcase harmony variant 4",
decision:"Apply harmony policy for hiphop-showcase",
role:"utility",
policy:"champagne-black",
weight:94
},
{
id:"hiphop-showcase:temperature:1",
story:"hiphop-showcase",
principle:"temperature",
condition:"hiphop-showcase temperature variant 1",
decision:"Apply temperature policy for hiphop-showcase",
role:"background",
policy:"tropical-emerald",
weight:70
},
{
id:"hiphop-showcase:temperature:2",
story:"hiphop-showcase",
principle:"temperature",
condition:"hiphop-showcase temperature variant 2",
decision:"Apply temperature policy for hiphop-showcase",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:77
},
{
id:"hiphop-showcase:temperature:3",
story:"hiphop-showcase",
principle:"temperature",
condition:"hiphop-showcase temperature variant 3",
decision:"Apply temperature policy for hiphop-showcase",
role:"headline",
policy:"sunset-warm",
weight:84
},
{
id:"hiphop-showcase:temperature:4",
story:"hiphop-showcase",
principle:"temperature",
condition:"hiphop-showcase temperature variant 4",
decision:"Apply temperature policy for hiphop-showcase",
role:"accent",
policy:"burgundy-intimate",
weight:91
},
{
id:"hiphop-showcase:background:1",
story:"hiphop-showcase",
principle:"background",
condition:"hiphop-showcase background variant 1",
decision:"Apply background policy for hiphop-showcase",
role:"metadata",
policy:"electric-night",
weight:98
},
{
id:"hiphop-showcase:background:2",
story:"hiphop-showcase",
principle:"background",
condition:"hiphop-showcase background variant 2",
decision:"Apply background policy for hiphop-showcase",
role:"dateTime",
policy:"industrial-monochrome",
weight:74
},
{
id:"hiphop-showcase:background:3",
story:"hiphop-showcase",
principle:"background",
condition:"hiphop-showcase background variant 3",
decision:"Apply background policy for hiphop-showcase",
role:"venue",
policy:"retro-pop",
weight:81
},
{
id:"hiphop-showcase:background:4",
story:"hiphop-showcase",
principle:"background",
condition:"hiphop-showcase background variant 4",
decision:"Apply background policy for hiphop-showcase",
role:"badgeBackground",
policy:"neutral-editorial",
weight:88
},
{
id:"hiphop-showcase:headline:1",
story:"hiphop-showcase",
principle:"headline",
condition:"hiphop-showcase headline variant 1",
decision:"Apply headline policy for hiphop-showcase",
role:"badgeText",
policy:"image-led",
weight:95
},
{
id:"hiphop-showcase:headline:2",
story:"hiphop-showcase",
principle:"headline",
condition:"hiphop-showcase headline variant 2",
decision:"Apply headline policy for hiphop-showcase",
role:"presenter",
policy:"warm-premium",
weight:71
},
{
id:"hiphop-showcase:headline:3",
story:"hiphop-showcase",
principle:"headline",
condition:"hiphop-showcase headline variant 3",
decision:"Apply headline policy for hiphop-showcase",
role:"footer",
policy:"champagne-black",
weight:78
},
{
id:"hiphop-showcase:headline:4",
story:"hiphop-showcase",
principle:"headline",
condition:"hiphop-showcase headline variant 4",
decision:"Apply headline policy for hiphop-showcase",
role:"stroke",
policy:"tropical-emerald",
weight:85
},
{
id:"hiphop-showcase:metadata:1",
story:"hiphop-showcase",
principle:"metadata",
condition:"hiphop-showcase metadata variant 1",
decision:"Apply metadata policy for hiphop-showcase",
role:"glow",
policy:"rose-glamour",
weight:92
},
{
id:"hiphop-showcase:metadata:2",
story:"hiphop-showcase",
principle:"metadata",
condition:"hiphop-showcase metadata variant 2",
decision:"Apply metadata policy for hiphop-showcase",
role:"neutral",
policy:"sunset-warm",
weight:99
},
{
id:"hiphop-showcase:metadata:3",
story:"hiphop-showcase",
principle:"metadata",
condition:"hiphop-showcase metadata variant 3",
decision:"Apply metadata policy for hiphop-showcase",
role:"utility",
policy:"burgundy-intimate",
weight:75
},
{
id:"hiphop-showcase:metadata:4",
story:"hiphop-showcase",
principle:"metadata",
condition:"hiphop-showcase metadata variant 4",
decision:"Apply metadata policy for hiphop-showcase",
role:"background",
policy:"electric-night",
weight:82
},
{
id:"hiphop-showcase:badge:1",
story:"hiphop-showcase",
principle:"badge",
condition:"hiphop-showcase badge variant 1",
decision:"Apply badge policy for hiphop-showcase",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:89
},
{
id:"hiphop-showcase:badge:2",
story:"hiphop-showcase",
principle:"badge",
condition:"hiphop-showcase badge variant 2",
decision:"Apply badge policy for hiphop-showcase",
role:"headline",
policy:"retro-pop",
weight:96
},
{
id:"hiphop-showcase:badge:3",
story:"hiphop-showcase",
principle:"badge",
condition:"hiphop-showcase badge variant 3",
decision:"Apply badge policy for hiphop-showcase",
role:"accent",
policy:"neutral-editorial",
weight:72
},
{
id:"hiphop-showcase:badge:4",
story:"hiphop-showcase",
principle:"badge",
condition:"hiphop-showcase badge variant 4",
decision:"Apply badge policy for hiphop-showcase",
role:"metadata",
policy:"image-led",
weight:79
},
{
id:"hiphop-showcase:glow:1",
story:"hiphop-showcase",
principle:"glow",
condition:"hiphop-showcase glow variant 1",
decision:"Apply glow policy for hiphop-showcase",
role:"dateTime",
policy:"warm-premium",
weight:86
},
{
id:"hiphop-showcase:glow:2",
story:"hiphop-showcase",
principle:"glow",
condition:"hiphop-showcase glow variant 2",
decision:"Apply glow policy for hiphop-showcase",
role:"venue",
policy:"champagne-black",
weight:93
},
{
id:"hiphop-showcase:glow:3",
story:"hiphop-showcase",
principle:"glow",
condition:"hiphop-showcase glow variant 3",
decision:"Apply glow policy for hiphop-showcase",
role:"badgeBackground",
policy:"tropical-emerald",
weight:100
},
{
id:"hiphop-showcase:glow:4",
story:"hiphop-showcase",
principle:"glow",
condition:"hiphop-showcase glow variant 4",
decision:"Apply glow policy for hiphop-showcase",
role:"badgeText",
policy:"rose-glamour",
weight:76
},
{
id:"hiphop-showcase:cast:1",
story:"hiphop-showcase",
principle:"cast",
condition:"hiphop-showcase cast variant 1",
decision:"Apply cast policy for hiphop-showcase",
role:"presenter",
policy:"sunset-warm",
weight:83
},
{
id:"hiphop-showcase:cast:2",
story:"hiphop-showcase",
principle:"cast",
condition:"hiphop-showcase cast variant 2",
decision:"Apply cast policy for hiphop-showcase",
role:"footer",
policy:"burgundy-intimate",
weight:90
},
{
id:"hiphop-showcase:cast:3",
story:"hiphop-showcase",
principle:"cast",
condition:"hiphop-showcase cast variant 3",
decision:"Apply cast policy for hiphop-showcase",
role:"stroke",
policy:"electric-night",
weight:97
},
{
id:"hiphop-showcase:cast:4",
story:"hiphop-showcase",
principle:"cast",
condition:"hiphop-showcase cast variant 4",
decision:"Apply cast policy for hiphop-showcase",
role:"glow",
policy:"industrial-monochrome",
weight:73
},
{
id:"hiphop-showcase:brand:1",
story:"hiphop-showcase",
principle:"brand",
condition:"hiphop-showcase brand variant 1",
decision:"Apply brand policy for hiphop-showcase",
role:"neutral",
policy:"retro-pop",
weight:80
},
{
id:"hiphop-showcase:brand:2",
story:"hiphop-showcase",
principle:"brand",
condition:"hiphop-showcase brand variant 2",
decision:"Apply brand policy for hiphop-showcase",
role:"utility",
policy:"neutral-editorial",
weight:87
},
{
id:"hiphop-showcase:brand:3",
story:"hiphop-showcase",
principle:"brand",
condition:"hiphop-showcase brand variant 3",
decision:"Apply brand policy for hiphop-showcase",
role:"background",
policy:"image-led",
weight:94
},
{
id:"hiphop-showcase:brand:4",
story:"hiphop-showcase",
principle:"brand",
condition:"hiphop-showcase brand variant 4",
decision:"Apply brand policy for hiphop-showcase",
role:"backgroundSecondary",
policy:"warm-premium",
weight:70
},
{
id:"hiphop-showcase:export:1",
story:"hiphop-showcase",
principle:"export",
condition:"hiphop-showcase export variant 1",
decision:"Apply export policy for hiphop-showcase",
role:"headline",
policy:"champagne-black",
weight:77
},
{
id:"hiphop-showcase:export:2",
story:"hiphop-showcase",
principle:"export",
condition:"hiphop-showcase export variant 2",
decision:"Apply export policy for hiphop-showcase",
role:"accent",
policy:"tropical-emerald",
weight:84
},
{
id:"hiphop-showcase:export:3",
story:"hiphop-showcase",
principle:"export",
condition:"hiphop-showcase export variant 3",
decision:"Apply export policy for hiphop-showcase",
role:"metadata",
policy:"rose-glamour",
weight:91
},
{
id:"hiphop-showcase:export:4",
story:"hiphop-showcase",
principle:"export",
condition:"hiphop-showcase export variant 4",
decision:"Apply export policy for hiphop-showcase",
role:"dateTime",
policy:"sunset-warm",
weight:98
},
{
id:"hiphop-showcase:accessibility:1",
story:"hiphop-showcase",
principle:"accessibility",
condition:"hiphop-showcase accessibility variant 1",
decision:"Apply accessibility policy for hiphop-showcase",
role:"venue",
policy:"burgundy-intimate",
weight:74
},
{
id:"hiphop-showcase:accessibility:2",
story:"hiphop-showcase",
principle:"accessibility",
condition:"hiphop-showcase accessibility variant 2",
decision:"Apply accessibility policy for hiphop-showcase",
role:"badgeBackground",
policy:"electric-night",
weight:81
},
{
id:"hiphop-showcase:accessibility:3",
story:"hiphop-showcase",
principle:"accessibility",
condition:"hiphop-showcase accessibility variant 3",
decision:"Apply accessibility policy for hiphop-showcase",
role:"badgeText",
policy:"industrial-monochrome",
weight:88
},
{
id:"hiphop-showcase:accessibility:4",
story:"hiphop-showcase",
principle:"accessibility",
condition:"hiphop-showcase accessibility variant 4",
decision:"Apply accessibility policy for hiphop-showcase",
role:"presenter",
policy:"retro-pop",
weight:95
},
{
id:"throwback-party:dominant:1",
story:"throwback-party",
principle:"dominant",
condition:"throwback-party dominant variant 1",
decision:"Apply dominant policy for throwback-party",
role:"footer",
policy:"neutral-editorial",
weight:71
},
{
id:"throwback-party:dominant:2",
story:"throwback-party",
principle:"dominant",
condition:"throwback-party dominant variant 2",
decision:"Apply dominant policy for throwback-party",
role:"stroke",
policy:"image-led",
weight:78
},
{
id:"throwback-party:dominant:3",
story:"throwback-party",
principle:"dominant",
condition:"throwback-party dominant variant 3",
decision:"Apply dominant policy for throwback-party",
role:"glow",
policy:"warm-premium",
weight:85
},
{
id:"throwback-party:dominant:4",
story:"throwback-party",
principle:"dominant",
condition:"throwback-party dominant variant 4",
decision:"Apply dominant policy for throwback-party",
role:"neutral",
policy:"champagne-black",
weight:92
},
{
id:"throwback-party:support:1",
story:"throwback-party",
principle:"support",
condition:"throwback-party support variant 1",
decision:"Apply support policy for throwback-party",
role:"utility",
policy:"tropical-emerald",
weight:99
},
{
id:"throwback-party:support:2",
story:"throwback-party",
principle:"support",
condition:"throwback-party support variant 2",
decision:"Apply support policy for throwback-party",
role:"background",
policy:"rose-glamour",
weight:75
},
{
id:"throwback-party:support:3",
story:"throwback-party",
principle:"support",
condition:"throwback-party support variant 3",
decision:"Apply support policy for throwback-party",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:82
},
{
id:"throwback-party:support:4",
story:"throwback-party",
principle:"support",
condition:"throwback-party support variant 4",
decision:"Apply support policy for throwback-party",
role:"headline",
policy:"burgundy-intimate",
weight:89
},
{
id:"throwback-party:accent:1",
story:"throwback-party",
principle:"accent",
condition:"throwback-party accent variant 1",
decision:"Apply accent policy for throwback-party",
role:"accent",
policy:"electric-night",
weight:96
},
{
id:"throwback-party:accent:2",
story:"throwback-party",
principle:"accent",
condition:"throwback-party accent variant 2",
decision:"Apply accent policy for throwback-party",
role:"metadata",
policy:"industrial-monochrome",
weight:72
},
{
id:"throwback-party:accent:3",
story:"throwback-party",
principle:"accent",
condition:"throwback-party accent variant 3",
decision:"Apply accent policy for throwback-party",
role:"dateTime",
policy:"retro-pop",
weight:79
},
{
id:"throwback-party:accent:4",
story:"throwback-party",
principle:"accent",
condition:"throwback-party accent variant 4",
decision:"Apply accent policy for throwback-party",
role:"venue",
policy:"neutral-editorial",
weight:86
},
{
id:"throwback-party:neutral:1",
story:"throwback-party",
principle:"neutral",
condition:"throwback-party neutral variant 1",
decision:"Apply neutral policy for throwback-party",
role:"badgeBackground",
policy:"image-led",
weight:93
},
{
id:"throwback-party:neutral:2",
story:"throwback-party",
principle:"neutral",
condition:"throwback-party neutral variant 2",
decision:"Apply neutral policy for throwback-party",
role:"badgeText",
policy:"warm-premium",
weight:100
},
{
id:"throwback-party:neutral:3",
story:"throwback-party",
principle:"neutral",
condition:"throwback-party neutral variant 3",
decision:"Apply neutral policy for throwback-party",
role:"presenter",
policy:"champagne-black",
weight:76
},
{
id:"throwback-party:neutral:4",
story:"throwback-party",
principle:"neutral",
condition:"throwback-party neutral variant 4",
decision:"Apply neutral policy for throwback-party",
role:"footer",
policy:"tropical-emerald",
weight:83
},
{
id:"throwback-party:contrast:1",
story:"throwback-party",
principle:"contrast",
condition:"throwback-party contrast variant 1",
decision:"Apply contrast policy for throwback-party",
role:"stroke",
policy:"rose-glamour",
weight:90
},
{
id:"throwback-party:contrast:2",
story:"throwback-party",
principle:"contrast",
condition:"throwback-party contrast variant 2",
decision:"Apply contrast policy for throwback-party",
role:"glow",
policy:"sunset-warm",
weight:97
},
{
id:"throwback-party:contrast:3",
story:"throwback-party",
principle:"contrast",
condition:"throwback-party contrast variant 3",
decision:"Apply contrast policy for throwback-party",
role:"neutral",
policy:"burgundy-intimate",
weight:73
},
{
id:"throwback-party:contrast:4",
story:"throwback-party",
principle:"contrast",
condition:"throwback-party contrast variant 4",
decision:"Apply contrast policy for throwback-party",
role:"utility",
policy:"electric-night",
weight:80
},
{
id:"throwback-party:skin:1",
story:"throwback-party",
principle:"skin",
condition:"throwback-party skin variant 1",
decision:"Apply skin policy for throwback-party",
role:"background",
policy:"industrial-monochrome",
weight:87
},
{
id:"throwback-party:skin:2",
story:"throwback-party",
principle:"skin",
condition:"throwback-party skin variant 2",
decision:"Apply skin policy for throwback-party",
role:"backgroundSecondary",
policy:"retro-pop",
weight:94
},
{
id:"throwback-party:skin:3",
story:"throwback-party",
principle:"skin",
condition:"throwback-party skin variant 3",
decision:"Apply skin policy for throwback-party",
role:"headline",
policy:"neutral-editorial",
weight:70
},
{
id:"throwback-party:skin:4",
story:"throwback-party",
principle:"skin",
condition:"throwback-party skin variant 4",
decision:"Apply skin policy for throwback-party",
role:"accent",
policy:"image-led",
weight:77
},
{
id:"throwback-party:saturation:1",
story:"throwback-party",
principle:"saturation",
condition:"throwback-party saturation variant 1",
decision:"Apply saturation policy for throwback-party",
role:"metadata",
policy:"warm-premium",
weight:84
},
{
id:"throwback-party:saturation:2",
story:"throwback-party",
principle:"saturation",
condition:"throwback-party saturation variant 2",
decision:"Apply saturation policy for throwback-party",
role:"dateTime",
policy:"champagne-black",
weight:91
},
{
id:"throwback-party:saturation:3",
story:"throwback-party",
principle:"saturation",
condition:"throwback-party saturation variant 3",
decision:"Apply saturation policy for throwback-party",
role:"venue",
policy:"tropical-emerald",
weight:98
},
{
id:"throwback-party:saturation:4",
story:"throwback-party",
principle:"saturation",
condition:"throwback-party saturation variant 4",
decision:"Apply saturation policy for throwback-party",
role:"badgeBackground",
policy:"rose-glamour",
weight:74
},
{
id:"throwback-party:harmony:1",
story:"throwback-party",
principle:"harmony",
condition:"throwback-party harmony variant 1",
decision:"Apply harmony policy for throwback-party",
role:"badgeText",
policy:"sunset-warm",
weight:81
},
{
id:"throwback-party:harmony:2",
story:"throwback-party",
principle:"harmony",
condition:"throwback-party harmony variant 2",
decision:"Apply harmony policy for throwback-party",
role:"presenter",
policy:"burgundy-intimate",
weight:88
},
{
id:"throwback-party:harmony:3",
story:"throwback-party",
principle:"harmony",
condition:"throwback-party harmony variant 3",
decision:"Apply harmony policy for throwback-party",
role:"footer",
policy:"electric-night",
weight:95
},
{
id:"throwback-party:harmony:4",
story:"throwback-party",
principle:"harmony",
condition:"throwback-party harmony variant 4",
decision:"Apply harmony policy for throwback-party",
role:"stroke",
policy:"industrial-monochrome",
weight:71
},
{
id:"throwback-party:temperature:1",
story:"throwback-party",
principle:"temperature",
condition:"throwback-party temperature variant 1",
decision:"Apply temperature policy for throwback-party",
role:"glow",
policy:"retro-pop",
weight:78
},
{
id:"throwback-party:temperature:2",
story:"throwback-party",
principle:"temperature",
condition:"throwback-party temperature variant 2",
decision:"Apply temperature policy for throwback-party",
role:"neutral",
policy:"neutral-editorial",
weight:85
},
{
id:"throwback-party:temperature:3",
story:"throwback-party",
principle:"temperature",
condition:"throwback-party temperature variant 3",
decision:"Apply temperature policy for throwback-party",
role:"utility",
policy:"image-led",
weight:92
},
{
id:"throwback-party:temperature:4",
story:"throwback-party",
principle:"temperature",
condition:"throwback-party temperature variant 4",
decision:"Apply temperature policy for throwback-party",
role:"background",
policy:"warm-premium",
weight:99
},
{
id:"throwback-party:background:1",
story:"throwback-party",
principle:"background",
condition:"throwback-party background variant 1",
decision:"Apply background policy for throwback-party",
role:"backgroundSecondary",
policy:"champagne-black",
weight:75
},
{
id:"throwback-party:background:2",
story:"throwback-party",
principle:"background",
condition:"throwback-party background variant 2",
decision:"Apply background policy for throwback-party",
role:"headline",
policy:"tropical-emerald",
weight:82
},
{
id:"throwback-party:background:3",
story:"throwback-party",
principle:"background",
condition:"throwback-party background variant 3",
decision:"Apply background policy for throwback-party",
role:"accent",
policy:"rose-glamour",
weight:89
},
{
id:"throwback-party:background:4",
story:"throwback-party",
principle:"background",
condition:"throwback-party background variant 4",
decision:"Apply background policy for throwback-party",
role:"metadata",
policy:"sunset-warm",
weight:96
},
{
id:"throwback-party:headline:1",
story:"throwback-party",
principle:"headline",
condition:"throwback-party headline variant 1",
decision:"Apply headline policy for throwback-party",
role:"dateTime",
policy:"burgundy-intimate",
weight:72
},
{
id:"throwback-party:headline:2",
story:"throwback-party",
principle:"headline",
condition:"throwback-party headline variant 2",
decision:"Apply headline policy for throwback-party",
role:"venue",
policy:"electric-night",
weight:79
},
{
id:"throwback-party:headline:3",
story:"throwback-party",
principle:"headline",
condition:"throwback-party headline variant 3",
decision:"Apply headline policy for throwback-party",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:86
},
{
id:"throwback-party:headline:4",
story:"throwback-party",
principle:"headline",
condition:"throwback-party headline variant 4",
decision:"Apply headline policy for throwback-party",
role:"badgeText",
policy:"retro-pop",
weight:93
},
{
id:"throwback-party:metadata:1",
story:"throwback-party",
principle:"metadata",
condition:"throwback-party metadata variant 1",
decision:"Apply metadata policy for throwback-party",
role:"presenter",
policy:"neutral-editorial",
weight:100
},
{
id:"throwback-party:metadata:2",
story:"throwback-party",
principle:"metadata",
condition:"throwback-party metadata variant 2",
decision:"Apply metadata policy for throwback-party",
role:"footer",
policy:"image-led",
weight:76
},
{
id:"throwback-party:metadata:3",
story:"throwback-party",
principle:"metadata",
condition:"throwback-party metadata variant 3",
decision:"Apply metadata policy for throwback-party",
role:"stroke",
policy:"warm-premium",
weight:83
},
{
id:"throwback-party:metadata:4",
story:"throwback-party",
principle:"metadata",
condition:"throwback-party metadata variant 4",
decision:"Apply metadata policy for throwback-party",
role:"glow",
policy:"champagne-black",
weight:90
},
{
id:"throwback-party:badge:1",
story:"throwback-party",
principle:"badge",
condition:"throwback-party badge variant 1",
decision:"Apply badge policy for throwback-party",
role:"neutral",
policy:"tropical-emerald",
weight:97
},
{
id:"throwback-party:badge:2",
story:"throwback-party",
principle:"badge",
condition:"throwback-party badge variant 2",
decision:"Apply badge policy for throwback-party",
role:"utility",
policy:"rose-glamour",
weight:73
},
{
id:"throwback-party:badge:3",
story:"throwback-party",
principle:"badge",
condition:"throwback-party badge variant 3",
decision:"Apply badge policy for throwback-party",
role:"background",
policy:"sunset-warm",
weight:80
},
{
id:"throwback-party:badge:4",
story:"throwback-party",
principle:"badge",
condition:"throwback-party badge variant 4",
decision:"Apply badge policy for throwback-party",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:87
},
{
id:"throwback-party:glow:1",
story:"throwback-party",
principle:"glow",
condition:"throwback-party glow variant 1",
decision:"Apply glow policy for throwback-party",
role:"headline",
policy:"electric-night",
weight:94
},
{
id:"throwback-party:glow:2",
story:"throwback-party",
principle:"glow",
condition:"throwback-party glow variant 2",
decision:"Apply glow policy for throwback-party",
role:"accent",
policy:"industrial-monochrome",
weight:70
},
{
id:"throwback-party:glow:3",
story:"throwback-party",
principle:"glow",
condition:"throwback-party glow variant 3",
decision:"Apply glow policy for throwback-party",
role:"metadata",
policy:"retro-pop",
weight:77
},
{
id:"throwback-party:glow:4",
story:"throwback-party",
principle:"glow",
condition:"throwback-party glow variant 4",
decision:"Apply glow policy for throwback-party",
role:"dateTime",
policy:"neutral-editorial",
weight:84
},
{
id:"throwback-party:cast:1",
story:"throwback-party",
principle:"cast",
condition:"throwback-party cast variant 1",
decision:"Apply cast policy for throwback-party",
role:"venue",
policy:"image-led",
weight:91
},
{
id:"throwback-party:cast:2",
story:"throwback-party",
principle:"cast",
condition:"throwback-party cast variant 2",
decision:"Apply cast policy for throwback-party",
role:"badgeBackground",
policy:"warm-premium",
weight:98
},
{
id:"throwback-party:cast:3",
story:"throwback-party",
principle:"cast",
condition:"throwback-party cast variant 3",
decision:"Apply cast policy for throwback-party",
role:"badgeText",
policy:"champagne-black",
weight:74
},
{
id:"throwback-party:cast:4",
story:"throwback-party",
principle:"cast",
condition:"throwback-party cast variant 4",
decision:"Apply cast policy for throwback-party",
role:"presenter",
policy:"tropical-emerald",
weight:81
},
{
id:"throwback-party:brand:1",
story:"throwback-party",
principle:"brand",
condition:"throwback-party brand variant 1",
decision:"Apply brand policy for throwback-party",
role:"footer",
policy:"rose-glamour",
weight:88
},
{
id:"throwback-party:brand:2",
story:"throwback-party",
principle:"brand",
condition:"throwback-party brand variant 2",
decision:"Apply brand policy for throwback-party",
role:"stroke",
policy:"sunset-warm",
weight:95
},
{
id:"throwback-party:brand:3",
story:"throwback-party",
principle:"brand",
condition:"throwback-party brand variant 3",
decision:"Apply brand policy for throwback-party",
role:"glow",
policy:"burgundy-intimate",
weight:71
},
{
id:"throwback-party:brand:4",
story:"throwback-party",
principle:"brand",
condition:"throwback-party brand variant 4",
decision:"Apply brand policy for throwback-party",
role:"neutral",
policy:"electric-night",
weight:78
},
{
id:"throwback-party:export:1",
story:"throwback-party",
principle:"export",
condition:"throwback-party export variant 1",
decision:"Apply export policy for throwback-party",
role:"utility",
policy:"industrial-monochrome",
weight:85
},
{
id:"throwback-party:export:2",
story:"throwback-party",
principle:"export",
condition:"throwback-party export variant 2",
decision:"Apply export policy for throwback-party",
role:"background",
policy:"retro-pop",
weight:92
},
{
id:"throwback-party:export:3",
story:"throwback-party",
principle:"export",
condition:"throwback-party export variant 3",
decision:"Apply export policy for throwback-party",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:99
},
{
id:"throwback-party:export:4",
story:"throwback-party",
principle:"export",
condition:"throwback-party export variant 4",
decision:"Apply export policy for throwback-party",
role:"headline",
policy:"image-led",
weight:75
},
{
id:"throwback-party:accessibility:1",
story:"throwback-party",
principle:"accessibility",
condition:"throwback-party accessibility variant 1",
decision:"Apply accessibility policy for throwback-party",
role:"accent",
policy:"warm-premium",
weight:82
},
{
id:"throwback-party:accessibility:2",
story:"throwback-party",
principle:"accessibility",
condition:"throwback-party accessibility variant 2",
decision:"Apply accessibility policy for throwback-party",
role:"metadata",
policy:"champagne-black",
weight:89
},
{
id:"throwback-party:accessibility:3",
story:"throwback-party",
principle:"accessibility",
condition:"throwback-party accessibility variant 3",
decision:"Apply accessibility policy for throwback-party",
role:"dateTime",
policy:"tropical-emerald",
weight:96
},
{
id:"throwback-party:accessibility:4",
story:"throwback-party",
principle:"accessibility",
condition:"throwback-party accessibility variant 4",
decision:"Apply accessibility policy for throwback-party",
role:"venue",
policy:"rose-glamour",
weight:72
},
{
id:"rooftop-lifestyle:dominant:1",
story:"rooftop-lifestyle",
principle:"dominant",
condition:"rooftop-lifestyle dominant variant 1",
decision:"Apply dominant policy for rooftop-lifestyle",
role:"badgeBackground",
policy:"sunset-warm",
weight:79
},
{
id:"rooftop-lifestyle:dominant:2",
story:"rooftop-lifestyle",
principle:"dominant",
condition:"rooftop-lifestyle dominant variant 2",
decision:"Apply dominant policy for rooftop-lifestyle",
role:"badgeText",
policy:"burgundy-intimate",
weight:86
},
{
id:"rooftop-lifestyle:dominant:3",
story:"rooftop-lifestyle",
principle:"dominant",
condition:"rooftop-lifestyle dominant variant 3",
decision:"Apply dominant policy for rooftop-lifestyle",
role:"presenter",
policy:"electric-night",
weight:93
},
{
id:"rooftop-lifestyle:dominant:4",
story:"rooftop-lifestyle",
principle:"dominant",
condition:"rooftop-lifestyle dominant variant 4",
decision:"Apply dominant policy for rooftop-lifestyle",
role:"footer",
policy:"industrial-monochrome",
weight:100
},
{
id:"rooftop-lifestyle:support:1",
story:"rooftop-lifestyle",
principle:"support",
condition:"rooftop-lifestyle support variant 1",
decision:"Apply support policy for rooftop-lifestyle",
role:"stroke",
policy:"retro-pop",
weight:76
},
{
id:"rooftop-lifestyle:support:2",
story:"rooftop-lifestyle",
principle:"support",
condition:"rooftop-lifestyle support variant 2",
decision:"Apply support policy for rooftop-lifestyle",
role:"glow",
policy:"neutral-editorial",
weight:83
},
{
id:"rooftop-lifestyle:support:3",
story:"rooftop-lifestyle",
principle:"support",
condition:"rooftop-lifestyle support variant 3",
decision:"Apply support policy for rooftop-lifestyle",
role:"neutral",
policy:"image-led",
weight:90
},
{
id:"rooftop-lifestyle:support:4",
story:"rooftop-lifestyle",
principle:"support",
condition:"rooftop-lifestyle support variant 4",
decision:"Apply support policy for rooftop-lifestyle",
role:"utility",
policy:"warm-premium",
weight:97
},
{
id:"rooftop-lifestyle:accent:1",
story:"rooftop-lifestyle",
principle:"accent",
condition:"rooftop-lifestyle accent variant 1",
decision:"Apply accent policy for rooftop-lifestyle",
role:"background",
policy:"champagne-black",
weight:73
},
{
id:"rooftop-lifestyle:accent:2",
story:"rooftop-lifestyle",
principle:"accent",
condition:"rooftop-lifestyle accent variant 2",
decision:"Apply accent policy for rooftop-lifestyle",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:80
},
{
id:"rooftop-lifestyle:accent:3",
story:"rooftop-lifestyle",
principle:"accent",
condition:"rooftop-lifestyle accent variant 3",
decision:"Apply accent policy for rooftop-lifestyle",
role:"headline",
policy:"rose-glamour",
weight:87
},
{
id:"rooftop-lifestyle:accent:4",
story:"rooftop-lifestyle",
principle:"accent",
condition:"rooftop-lifestyle accent variant 4",
decision:"Apply accent policy for rooftop-lifestyle",
role:"accent",
policy:"sunset-warm",
weight:94
},
{
id:"rooftop-lifestyle:neutral:1",
story:"rooftop-lifestyle",
principle:"neutral",
condition:"rooftop-lifestyle neutral variant 1",
decision:"Apply neutral policy for rooftop-lifestyle",
role:"metadata",
policy:"burgundy-intimate",
weight:70
},
{
id:"rooftop-lifestyle:neutral:2",
story:"rooftop-lifestyle",
principle:"neutral",
condition:"rooftop-lifestyle neutral variant 2",
decision:"Apply neutral policy for rooftop-lifestyle",
role:"dateTime",
policy:"electric-night",
weight:77
},
{
id:"rooftop-lifestyle:neutral:3",
story:"rooftop-lifestyle",
principle:"neutral",
condition:"rooftop-lifestyle neutral variant 3",
decision:"Apply neutral policy for rooftop-lifestyle",
role:"venue",
policy:"industrial-monochrome",
weight:84
},
{
id:"rooftop-lifestyle:neutral:4",
story:"rooftop-lifestyle",
principle:"neutral",
condition:"rooftop-lifestyle neutral variant 4",
decision:"Apply neutral policy for rooftop-lifestyle",
role:"badgeBackground",
policy:"retro-pop",
weight:91
},
{
id:"rooftop-lifestyle:contrast:1",
story:"rooftop-lifestyle",
principle:"contrast",
condition:"rooftop-lifestyle contrast variant 1",
decision:"Apply contrast policy for rooftop-lifestyle",
role:"badgeText",
policy:"neutral-editorial",
weight:98
},
{
id:"rooftop-lifestyle:contrast:2",
story:"rooftop-lifestyle",
principle:"contrast",
condition:"rooftop-lifestyle contrast variant 2",
decision:"Apply contrast policy for rooftop-lifestyle",
role:"presenter",
policy:"image-led",
weight:74
},
{
id:"rooftop-lifestyle:contrast:3",
story:"rooftop-lifestyle",
principle:"contrast",
condition:"rooftop-lifestyle contrast variant 3",
decision:"Apply contrast policy for rooftop-lifestyle",
role:"footer",
policy:"warm-premium",
weight:81
},
{
id:"rooftop-lifestyle:contrast:4",
story:"rooftop-lifestyle",
principle:"contrast",
condition:"rooftop-lifestyle contrast variant 4",
decision:"Apply contrast policy for rooftop-lifestyle",
role:"stroke",
policy:"champagne-black",
weight:88
},
{
id:"rooftop-lifestyle:skin:1",
story:"rooftop-lifestyle",
principle:"skin",
condition:"rooftop-lifestyle skin variant 1",
decision:"Apply skin policy for rooftop-lifestyle",
role:"glow",
policy:"tropical-emerald",
weight:95
},
{
id:"rooftop-lifestyle:skin:2",
story:"rooftop-lifestyle",
principle:"skin",
condition:"rooftop-lifestyle skin variant 2",
decision:"Apply skin policy for rooftop-lifestyle",
role:"neutral",
policy:"rose-glamour",
weight:71
},
{
id:"rooftop-lifestyle:skin:3",
story:"rooftop-lifestyle",
principle:"skin",
condition:"rooftop-lifestyle skin variant 3",
decision:"Apply skin policy for rooftop-lifestyle",
role:"utility",
policy:"sunset-warm",
weight:78
},
{
id:"rooftop-lifestyle:skin:4",
story:"rooftop-lifestyle",
principle:"skin",
condition:"rooftop-lifestyle skin variant 4",
decision:"Apply skin policy for rooftop-lifestyle",
role:"background",
policy:"burgundy-intimate",
weight:85
},
{
id:"rooftop-lifestyle:saturation:1",
story:"rooftop-lifestyle",
principle:"saturation",
condition:"rooftop-lifestyle saturation variant 1",
decision:"Apply saturation policy for rooftop-lifestyle",
role:"backgroundSecondary",
policy:"electric-night",
weight:92
},
{
id:"rooftop-lifestyle:saturation:2",
story:"rooftop-lifestyle",
principle:"saturation",
condition:"rooftop-lifestyle saturation variant 2",
decision:"Apply saturation policy for rooftop-lifestyle",
role:"headline",
policy:"industrial-monochrome",
weight:99
},
{
id:"rooftop-lifestyle:saturation:3",
story:"rooftop-lifestyle",
principle:"saturation",
condition:"rooftop-lifestyle saturation variant 3",
decision:"Apply saturation policy for rooftop-lifestyle",
role:"accent",
policy:"retro-pop",
weight:75
},
{
id:"rooftop-lifestyle:saturation:4",
story:"rooftop-lifestyle",
principle:"saturation",
condition:"rooftop-lifestyle saturation variant 4",
decision:"Apply saturation policy for rooftop-lifestyle",
role:"metadata",
policy:"neutral-editorial",
weight:82
},
{
id:"rooftop-lifestyle:harmony:1",
story:"rooftop-lifestyle",
principle:"harmony",
condition:"rooftop-lifestyle harmony variant 1",
decision:"Apply harmony policy for rooftop-lifestyle",
role:"dateTime",
policy:"image-led",
weight:89
},
{
id:"rooftop-lifestyle:harmony:2",
story:"rooftop-lifestyle",
principle:"harmony",
condition:"rooftop-lifestyle harmony variant 2",
decision:"Apply harmony policy for rooftop-lifestyle",
role:"venue",
policy:"warm-premium",
weight:96
},
{
id:"rooftop-lifestyle:harmony:3",
story:"rooftop-lifestyle",
principle:"harmony",
condition:"rooftop-lifestyle harmony variant 3",
decision:"Apply harmony policy for rooftop-lifestyle",
role:"badgeBackground",
policy:"champagne-black",
weight:72
},
{
id:"rooftop-lifestyle:harmony:4",
story:"rooftop-lifestyle",
principle:"harmony",
condition:"rooftop-lifestyle harmony variant 4",
decision:"Apply harmony policy for rooftop-lifestyle",
role:"badgeText",
policy:"tropical-emerald",
weight:79
},
{
id:"rooftop-lifestyle:temperature:1",
story:"rooftop-lifestyle",
principle:"temperature",
condition:"rooftop-lifestyle temperature variant 1",
decision:"Apply temperature policy for rooftop-lifestyle",
role:"presenter",
policy:"rose-glamour",
weight:86
},
{
id:"rooftop-lifestyle:temperature:2",
story:"rooftop-lifestyle",
principle:"temperature",
condition:"rooftop-lifestyle temperature variant 2",
decision:"Apply temperature policy for rooftop-lifestyle",
role:"footer",
policy:"sunset-warm",
weight:93
},
{
id:"rooftop-lifestyle:temperature:3",
story:"rooftop-lifestyle",
principle:"temperature",
condition:"rooftop-lifestyle temperature variant 3",
decision:"Apply temperature policy for rooftop-lifestyle",
role:"stroke",
policy:"burgundy-intimate",
weight:100
},
{
id:"rooftop-lifestyle:temperature:4",
story:"rooftop-lifestyle",
principle:"temperature",
condition:"rooftop-lifestyle temperature variant 4",
decision:"Apply temperature policy for rooftop-lifestyle",
role:"glow",
policy:"electric-night",
weight:76
},
{
id:"rooftop-lifestyle:background:1",
story:"rooftop-lifestyle",
principle:"background",
condition:"rooftop-lifestyle background variant 1",
decision:"Apply background policy for rooftop-lifestyle",
role:"neutral",
policy:"industrial-monochrome",
weight:83
},
{
id:"rooftop-lifestyle:background:2",
story:"rooftop-lifestyle",
principle:"background",
condition:"rooftop-lifestyle background variant 2",
decision:"Apply background policy for rooftop-lifestyle",
role:"utility",
policy:"retro-pop",
weight:90
},
{
id:"rooftop-lifestyle:background:3",
story:"rooftop-lifestyle",
principle:"background",
condition:"rooftop-lifestyle background variant 3",
decision:"Apply background policy for rooftop-lifestyle",
role:"background",
policy:"neutral-editorial",
weight:97
},
{
id:"rooftop-lifestyle:background:4",
story:"rooftop-lifestyle",
principle:"background",
condition:"rooftop-lifestyle background variant 4",
decision:"Apply background policy for rooftop-lifestyle",
role:"backgroundSecondary",
policy:"image-led",
weight:73
},
{
id:"rooftop-lifestyle:headline:1",
story:"rooftop-lifestyle",
principle:"headline",
condition:"rooftop-lifestyle headline variant 1",
decision:"Apply headline policy for rooftop-lifestyle",
role:"headline",
policy:"warm-premium",
weight:80
},
{
id:"rooftop-lifestyle:headline:2",
story:"rooftop-lifestyle",
principle:"headline",
condition:"rooftop-lifestyle headline variant 2",
decision:"Apply headline policy for rooftop-lifestyle",
role:"accent",
policy:"champagne-black",
weight:87
},
{
id:"rooftop-lifestyle:headline:3",
story:"rooftop-lifestyle",
principle:"headline",
condition:"rooftop-lifestyle headline variant 3",
decision:"Apply headline policy for rooftop-lifestyle",
role:"metadata",
policy:"tropical-emerald",
weight:94
},
{
id:"rooftop-lifestyle:headline:4",
story:"rooftop-lifestyle",
principle:"headline",
condition:"rooftop-lifestyle headline variant 4",
decision:"Apply headline policy for rooftop-lifestyle",
role:"dateTime",
policy:"rose-glamour",
weight:70
},
{
id:"rooftop-lifestyle:metadata:1",
story:"rooftop-lifestyle",
principle:"metadata",
condition:"rooftop-lifestyle metadata variant 1",
decision:"Apply metadata policy for rooftop-lifestyle",
role:"venue",
policy:"sunset-warm",
weight:77
},
{
id:"rooftop-lifestyle:metadata:2",
story:"rooftop-lifestyle",
principle:"metadata",
condition:"rooftop-lifestyle metadata variant 2",
decision:"Apply metadata policy for rooftop-lifestyle",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:84
},
{
id:"rooftop-lifestyle:metadata:3",
story:"rooftop-lifestyle",
principle:"metadata",
condition:"rooftop-lifestyle metadata variant 3",
decision:"Apply metadata policy for rooftop-lifestyle",
role:"badgeText",
policy:"electric-night",
weight:91
},
{
id:"rooftop-lifestyle:metadata:4",
story:"rooftop-lifestyle",
principle:"metadata",
condition:"rooftop-lifestyle metadata variant 4",
decision:"Apply metadata policy for rooftop-lifestyle",
role:"presenter",
policy:"industrial-monochrome",
weight:98
},
{
id:"rooftop-lifestyle:badge:1",
story:"rooftop-lifestyle",
principle:"badge",
condition:"rooftop-lifestyle badge variant 1",
decision:"Apply badge policy for rooftop-lifestyle",
role:"footer",
policy:"retro-pop",
weight:74
},
{
id:"rooftop-lifestyle:badge:2",
story:"rooftop-lifestyle",
principle:"badge",
condition:"rooftop-lifestyle badge variant 2",
decision:"Apply badge policy for rooftop-lifestyle",
role:"stroke",
policy:"neutral-editorial",
weight:81
},
{
id:"rooftop-lifestyle:badge:3",
story:"rooftop-lifestyle",
principle:"badge",
condition:"rooftop-lifestyle badge variant 3",
decision:"Apply badge policy for rooftop-lifestyle",
role:"glow",
policy:"image-led",
weight:88
},
{
id:"rooftop-lifestyle:badge:4",
story:"rooftop-lifestyle",
principle:"badge",
condition:"rooftop-lifestyle badge variant 4",
decision:"Apply badge policy for rooftop-lifestyle",
role:"neutral",
policy:"warm-premium",
weight:95
},
{
id:"rooftop-lifestyle:glow:1",
story:"rooftop-lifestyle",
principle:"glow",
condition:"rooftop-lifestyle glow variant 1",
decision:"Apply glow policy for rooftop-lifestyle",
role:"utility",
policy:"champagne-black",
weight:71
},
{
id:"rooftop-lifestyle:glow:2",
story:"rooftop-lifestyle",
principle:"glow",
condition:"rooftop-lifestyle glow variant 2",
decision:"Apply glow policy for rooftop-lifestyle",
role:"background",
policy:"tropical-emerald",
weight:78
},
{
id:"rooftop-lifestyle:glow:3",
story:"rooftop-lifestyle",
principle:"glow",
condition:"rooftop-lifestyle glow variant 3",
decision:"Apply glow policy for rooftop-lifestyle",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:85
},
{
id:"rooftop-lifestyle:glow:4",
story:"rooftop-lifestyle",
principle:"glow",
condition:"rooftop-lifestyle glow variant 4",
decision:"Apply glow policy for rooftop-lifestyle",
role:"headline",
policy:"sunset-warm",
weight:92
},
{
id:"rooftop-lifestyle:cast:1",
story:"rooftop-lifestyle",
principle:"cast",
condition:"rooftop-lifestyle cast variant 1",
decision:"Apply cast policy for rooftop-lifestyle",
role:"accent",
policy:"burgundy-intimate",
weight:99
},
{
id:"rooftop-lifestyle:cast:2",
story:"rooftop-lifestyle",
principle:"cast",
condition:"rooftop-lifestyle cast variant 2",
decision:"Apply cast policy for rooftop-lifestyle",
role:"metadata",
policy:"electric-night",
weight:75
},
{
id:"rooftop-lifestyle:cast:3",
story:"rooftop-lifestyle",
principle:"cast",
condition:"rooftop-lifestyle cast variant 3",
decision:"Apply cast policy for rooftop-lifestyle",
role:"dateTime",
policy:"industrial-monochrome",
weight:82
},
{
id:"rooftop-lifestyle:cast:4",
story:"rooftop-lifestyle",
principle:"cast",
condition:"rooftop-lifestyle cast variant 4",
decision:"Apply cast policy for rooftop-lifestyle",
role:"venue",
policy:"retro-pop",
weight:89
},
{
id:"rooftop-lifestyle:brand:1",
story:"rooftop-lifestyle",
principle:"brand",
condition:"rooftop-lifestyle brand variant 1",
decision:"Apply brand policy for rooftop-lifestyle",
role:"badgeBackground",
policy:"neutral-editorial",
weight:96
},
{
id:"rooftop-lifestyle:brand:2",
story:"rooftop-lifestyle",
principle:"brand",
condition:"rooftop-lifestyle brand variant 2",
decision:"Apply brand policy for rooftop-lifestyle",
role:"badgeText",
policy:"image-led",
weight:72
},
{
id:"rooftop-lifestyle:brand:3",
story:"rooftop-lifestyle",
principle:"brand",
condition:"rooftop-lifestyle brand variant 3",
decision:"Apply brand policy for rooftop-lifestyle",
role:"presenter",
policy:"warm-premium",
weight:79
},
{
id:"rooftop-lifestyle:brand:4",
story:"rooftop-lifestyle",
principle:"brand",
condition:"rooftop-lifestyle brand variant 4",
decision:"Apply brand policy for rooftop-lifestyle",
role:"footer",
policy:"champagne-black",
weight:86
},
{
id:"rooftop-lifestyle:export:1",
story:"rooftop-lifestyle",
principle:"export",
condition:"rooftop-lifestyle export variant 1",
decision:"Apply export policy for rooftop-lifestyle",
role:"stroke",
policy:"tropical-emerald",
weight:93
},
{
id:"rooftop-lifestyle:export:2",
story:"rooftop-lifestyle",
principle:"export",
condition:"rooftop-lifestyle export variant 2",
decision:"Apply export policy for rooftop-lifestyle",
role:"glow",
policy:"rose-glamour",
weight:100
},
{
id:"rooftop-lifestyle:export:3",
story:"rooftop-lifestyle",
principle:"export",
condition:"rooftop-lifestyle export variant 3",
decision:"Apply export policy for rooftop-lifestyle",
role:"neutral",
policy:"sunset-warm",
weight:76
},
{
id:"rooftop-lifestyle:export:4",
story:"rooftop-lifestyle",
principle:"export",
condition:"rooftop-lifestyle export variant 4",
decision:"Apply export policy for rooftop-lifestyle",
role:"utility",
policy:"burgundy-intimate",
weight:83
},
{
id:"rooftop-lifestyle:accessibility:1",
story:"rooftop-lifestyle",
principle:"accessibility",
condition:"rooftop-lifestyle accessibility variant 1",
decision:"Apply accessibility policy for rooftop-lifestyle",
role:"background",
policy:"electric-night",
weight:90
},
{
id:"rooftop-lifestyle:accessibility:2",
story:"rooftop-lifestyle",
principle:"accessibility",
condition:"rooftop-lifestyle accessibility variant 2",
decision:"Apply accessibility policy for rooftop-lifestyle",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:97
},
{
id:"rooftop-lifestyle:accessibility:3",
story:"rooftop-lifestyle",
principle:"accessibility",
condition:"rooftop-lifestyle accessibility variant 3",
decision:"Apply accessibility policy for rooftop-lifestyle",
role:"headline",
policy:"retro-pop",
weight:73
},
{
id:"rooftop-lifestyle:accessibility:4",
story:"rooftop-lifestyle",
principle:"accessibility",
condition:"rooftop-lifestyle accessibility variant 4",
decision:"Apply accessibility policy for rooftop-lifestyle",
role:"accent",
policy:"neutral-editorial",
weight:80
},
{
id:"pool-day-party:dominant:1",
story:"pool-day-party",
principle:"dominant",
condition:"pool-day-party dominant variant 1",
decision:"Apply dominant policy for pool-day-party",
role:"metadata",
policy:"image-led",
weight:87
},
{
id:"pool-day-party:dominant:2",
story:"pool-day-party",
principle:"dominant",
condition:"pool-day-party dominant variant 2",
decision:"Apply dominant policy for pool-day-party",
role:"dateTime",
policy:"warm-premium",
weight:94
},
{
id:"pool-day-party:dominant:3",
story:"pool-day-party",
principle:"dominant",
condition:"pool-day-party dominant variant 3",
decision:"Apply dominant policy for pool-day-party",
role:"venue",
policy:"champagne-black",
weight:70
},
{
id:"pool-day-party:dominant:4",
story:"pool-day-party",
principle:"dominant",
condition:"pool-day-party dominant variant 4",
decision:"Apply dominant policy for pool-day-party",
role:"badgeBackground",
policy:"tropical-emerald",
weight:77
},
{
id:"pool-day-party:support:1",
story:"pool-day-party",
principle:"support",
condition:"pool-day-party support variant 1",
decision:"Apply support policy for pool-day-party",
role:"badgeText",
policy:"rose-glamour",
weight:84
},
{
id:"pool-day-party:support:2",
story:"pool-day-party",
principle:"support",
condition:"pool-day-party support variant 2",
decision:"Apply support policy for pool-day-party",
role:"presenter",
policy:"sunset-warm",
weight:91
},
{
id:"pool-day-party:support:3",
story:"pool-day-party",
principle:"support",
condition:"pool-day-party support variant 3",
decision:"Apply support policy for pool-day-party",
role:"footer",
policy:"burgundy-intimate",
weight:98
},
{
id:"pool-day-party:support:4",
story:"pool-day-party",
principle:"support",
condition:"pool-day-party support variant 4",
decision:"Apply support policy for pool-day-party",
role:"stroke",
policy:"electric-night",
weight:74
},
{
id:"pool-day-party:accent:1",
story:"pool-day-party",
principle:"accent",
condition:"pool-day-party accent variant 1",
decision:"Apply accent policy for pool-day-party",
role:"glow",
policy:"industrial-monochrome",
weight:81
},
{
id:"pool-day-party:accent:2",
story:"pool-day-party",
principle:"accent",
condition:"pool-day-party accent variant 2",
decision:"Apply accent policy for pool-day-party",
role:"neutral",
policy:"retro-pop",
weight:88
},
{
id:"pool-day-party:accent:3",
story:"pool-day-party",
principle:"accent",
condition:"pool-day-party accent variant 3",
decision:"Apply accent policy for pool-day-party",
role:"utility",
policy:"neutral-editorial",
weight:95
},
{
id:"pool-day-party:accent:4",
story:"pool-day-party",
principle:"accent",
condition:"pool-day-party accent variant 4",
decision:"Apply accent policy for pool-day-party",
role:"background",
policy:"image-led",
weight:71
},
{
id:"pool-day-party:neutral:1",
story:"pool-day-party",
principle:"neutral",
condition:"pool-day-party neutral variant 1",
decision:"Apply neutral policy for pool-day-party",
role:"backgroundSecondary",
policy:"warm-premium",
weight:78
},
{
id:"pool-day-party:neutral:2",
story:"pool-day-party",
principle:"neutral",
condition:"pool-day-party neutral variant 2",
decision:"Apply neutral policy for pool-day-party",
role:"headline",
policy:"champagne-black",
weight:85
},
{
id:"pool-day-party:neutral:3",
story:"pool-day-party",
principle:"neutral",
condition:"pool-day-party neutral variant 3",
decision:"Apply neutral policy for pool-day-party",
role:"accent",
policy:"tropical-emerald",
weight:92
},
{
id:"pool-day-party:neutral:4",
story:"pool-day-party",
principle:"neutral",
condition:"pool-day-party neutral variant 4",
decision:"Apply neutral policy for pool-day-party",
role:"metadata",
policy:"rose-glamour",
weight:99
},
{
id:"pool-day-party:contrast:1",
story:"pool-day-party",
principle:"contrast",
condition:"pool-day-party contrast variant 1",
decision:"Apply contrast policy for pool-day-party",
role:"dateTime",
policy:"sunset-warm",
weight:75
},
{
id:"pool-day-party:contrast:2",
story:"pool-day-party",
principle:"contrast",
condition:"pool-day-party contrast variant 2",
decision:"Apply contrast policy for pool-day-party",
role:"venue",
policy:"burgundy-intimate",
weight:82
},
{
id:"pool-day-party:contrast:3",
story:"pool-day-party",
principle:"contrast",
condition:"pool-day-party contrast variant 3",
decision:"Apply contrast policy for pool-day-party",
role:"badgeBackground",
policy:"electric-night",
weight:89
},
{
id:"pool-day-party:contrast:4",
story:"pool-day-party",
principle:"contrast",
condition:"pool-day-party contrast variant 4",
decision:"Apply contrast policy for pool-day-party",
role:"badgeText",
policy:"industrial-monochrome",
weight:96
},
{
id:"pool-day-party:skin:1",
story:"pool-day-party",
principle:"skin",
condition:"pool-day-party skin variant 1",
decision:"Apply skin policy for pool-day-party",
role:"presenter",
policy:"retro-pop",
weight:72
},
{
id:"pool-day-party:skin:2",
story:"pool-day-party",
principle:"skin",
condition:"pool-day-party skin variant 2",
decision:"Apply skin policy for pool-day-party",
role:"footer",
policy:"neutral-editorial",
weight:79
},
{
id:"pool-day-party:skin:3",
story:"pool-day-party",
principle:"skin",
condition:"pool-day-party skin variant 3",
decision:"Apply skin policy for pool-day-party",
role:"stroke",
policy:"image-led",
weight:86
},
{
id:"pool-day-party:skin:4",
story:"pool-day-party",
principle:"skin",
condition:"pool-day-party skin variant 4",
decision:"Apply skin policy for pool-day-party",
role:"glow",
policy:"warm-premium",
weight:93
},
{
id:"pool-day-party:saturation:1",
story:"pool-day-party",
principle:"saturation",
condition:"pool-day-party saturation variant 1",
decision:"Apply saturation policy for pool-day-party",
role:"neutral",
policy:"champagne-black",
weight:100
},
{
id:"pool-day-party:saturation:2",
story:"pool-day-party",
principle:"saturation",
condition:"pool-day-party saturation variant 2",
decision:"Apply saturation policy for pool-day-party",
role:"utility",
policy:"tropical-emerald",
weight:76
},
{
id:"pool-day-party:saturation:3",
story:"pool-day-party",
principle:"saturation",
condition:"pool-day-party saturation variant 3",
decision:"Apply saturation policy for pool-day-party",
role:"background",
policy:"rose-glamour",
weight:83
},
{
id:"pool-day-party:saturation:4",
story:"pool-day-party",
principle:"saturation",
condition:"pool-day-party saturation variant 4",
decision:"Apply saturation policy for pool-day-party",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:90
},
{
id:"pool-day-party:harmony:1",
story:"pool-day-party",
principle:"harmony",
condition:"pool-day-party harmony variant 1",
decision:"Apply harmony policy for pool-day-party",
role:"headline",
policy:"burgundy-intimate",
weight:97
},
{
id:"pool-day-party:harmony:2",
story:"pool-day-party",
principle:"harmony",
condition:"pool-day-party harmony variant 2",
decision:"Apply harmony policy for pool-day-party",
role:"accent",
policy:"electric-night",
weight:73
},
{
id:"pool-day-party:harmony:3",
story:"pool-day-party",
principle:"harmony",
condition:"pool-day-party harmony variant 3",
decision:"Apply harmony policy for pool-day-party",
role:"metadata",
policy:"industrial-monochrome",
weight:80
},
{
id:"pool-day-party:harmony:4",
story:"pool-day-party",
principle:"harmony",
condition:"pool-day-party harmony variant 4",
decision:"Apply harmony policy for pool-day-party",
role:"dateTime",
policy:"retro-pop",
weight:87
},
{
id:"pool-day-party:temperature:1",
story:"pool-day-party",
principle:"temperature",
condition:"pool-day-party temperature variant 1",
decision:"Apply temperature policy for pool-day-party",
role:"venue",
policy:"neutral-editorial",
weight:94
},
{
id:"pool-day-party:temperature:2",
story:"pool-day-party",
principle:"temperature",
condition:"pool-day-party temperature variant 2",
decision:"Apply temperature policy for pool-day-party",
role:"badgeBackground",
policy:"image-led",
weight:70
},
{
id:"pool-day-party:temperature:3",
story:"pool-day-party",
principle:"temperature",
condition:"pool-day-party temperature variant 3",
decision:"Apply temperature policy for pool-day-party",
role:"badgeText",
policy:"warm-premium",
weight:77
},
{
id:"pool-day-party:temperature:4",
story:"pool-day-party",
principle:"temperature",
condition:"pool-day-party temperature variant 4",
decision:"Apply temperature policy for pool-day-party",
role:"presenter",
policy:"champagne-black",
weight:84
},
{
id:"pool-day-party:background:1",
story:"pool-day-party",
principle:"background",
condition:"pool-day-party background variant 1",
decision:"Apply background policy for pool-day-party",
role:"footer",
policy:"tropical-emerald",
weight:91
},
{
id:"pool-day-party:background:2",
story:"pool-day-party",
principle:"background",
condition:"pool-day-party background variant 2",
decision:"Apply background policy for pool-day-party",
role:"stroke",
policy:"rose-glamour",
weight:98
},
{
id:"pool-day-party:background:3",
story:"pool-day-party",
principle:"background",
condition:"pool-day-party background variant 3",
decision:"Apply background policy for pool-day-party",
role:"glow",
policy:"sunset-warm",
weight:74
},
{
id:"pool-day-party:background:4",
story:"pool-day-party",
principle:"background",
condition:"pool-day-party background variant 4",
decision:"Apply background policy for pool-day-party",
role:"neutral",
policy:"burgundy-intimate",
weight:81
},
{
id:"pool-day-party:headline:1",
story:"pool-day-party",
principle:"headline",
condition:"pool-day-party headline variant 1",
decision:"Apply headline policy for pool-day-party",
role:"utility",
policy:"electric-night",
weight:88
},
{
id:"pool-day-party:headline:2",
story:"pool-day-party",
principle:"headline",
condition:"pool-day-party headline variant 2",
decision:"Apply headline policy for pool-day-party",
role:"background",
policy:"industrial-monochrome",
weight:95
},
{
id:"pool-day-party:headline:3",
story:"pool-day-party",
principle:"headline",
condition:"pool-day-party headline variant 3",
decision:"Apply headline policy for pool-day-party",
role:"backgroundSecondary",
policy:"retro-pop",
weight:71
},
{
id:"pool-day-party:headline:4",
story:"pool-day-party",
principle:"headline",
condition:"pool-day-party headline variant 4",
decision:"Apply headline policy for pool-day-party",
role:"headline",
policy:"neutral-editorial",
weight:78
},
{
id:"pool-day-party:metadata:1",
story:"pool-day-party",
principle:"metadata",
condition:"pool-day-party metadata variant 1",
decision:"Apply metadata policy for pool-day-party",
role:"accent",
policy:"image-led",
weight:85
},
{
id:"pool-day-party:metadata:2",
story:"pool-day-party",
principle:"metadata",
condition:"pool-day-party metadata variant 2",
decision:"Apply metadata policy for pool-day-party",
role:"metadata",
policy:"warm-premium",
weight:92
},
{
id:"pool-day-party:metadata:3",
story:"pool-day-party",
principle:"metadata",
condition:"pool-day-party metadata variant 3",
decision:"Apply metadata policy for pool-day-party",
role:"dateTime",
policy:"champagne-black",
weight:99
},
{
id:"pool-day-party:metadata:4",
story:"pool-day-party",
principle:"metadata",
condition:"pool-day-party metadata variant 4",
decision:"Apply metadata policy for pool-day-party",
role:"venue",
policy:"tropical-emerald",
weight:75
},
{
id:"pool-day-party:badge:1",
story:"pool-day-party",
principle:"badge",
condition:"pool-day-party badge variant 1",
decision:"Apply badge policy for pool-day-party",
role:"badgeBackground",
policy:"rose-glamour",
weight:82
},
{
id:"pool-day-party:badge:2",
story:"pool-day-party",
principle:"badge",
condition:"pool-day-party badge variant 2",
decision:"Apply badge policy for pool-day-party",
role:"badgeText",
policy:"sunset-warm",
weight:89
},
{
id:"pool-day-party:badge:3",
story:"pool-day-party",
principle:"badge",
condition:"pool-day-party badge variant 3",
decision:"Apply badge policy for pool-day-party",
role:"presenter",
policy:"burgundy-intimate",
weight:96
},
{
id:"pool-day-party:badge:4",
story:"pool-day-party",
principle:"badge",
condition:"pool-day-party badge variant 4",
decision:"Apply badge policy for pool-day-party",
role:"footer",
policy:"electric-night",
weight:72
},
{
id:"pool-day-party:glow:1",
story:"pool-day-party",
principle:"glow",
condition:"pool-day-party glow variant 1",
decision:"Apply glow policy for pool-day-party",
role:"stroke",
policy:"industrial-monochrome",
weight:79
},
{
id:"pool-day-party:glow:2",
story:"pool-day-party",
principle:"glow",
condition:"pool-day-party glow variant 2",
decision:"Apply glow policy for pool-day-party",
role:"glow",
policy:"retro-pop",
weight:86
},
{
id:"pool-day-party:glow:3",
story:"pool-day-party",
principle:"glow",
condition:"pool-day-party glow variant 3",
decision:"Apply glow policy for pool-day-party",
role:"neutral",
policy:"neutral-editorial",
weight:93
},
{
id:"pool-day-party:glow:4",
story:"pool-day-party",
principle:"glow",
condition:"pool-day-party glow variant 4",
decision:"Apply glow policy for pool-day-party",
role:"utility",
policy:"image-led",
weight:100
},
{
id:"pool-day-party:cast:1",
story:"pool-day-party",
principle:"cast",
condition:"pool-day-party cast variant 1",
decision:"Apply cast policy for pool-day-party",
role:"background",
policy:"warm-premium",
weight:76
},
{
id:"pool-day-party:cast:2",
story:"pool-day-party",
principle:"cast",
condition:"pool-day-party cast variant 2",
decision:"Apply cast policy for pool-day-party",
role:"backgroundSecondary",
policy:"champagne-black",
weight:83
},
{
id:"pool-day-party:cast:3",
story:"pool-day-party",
principle:"cast",
condition:"pool-day-party cast variant 3",
decision:"Apply cast policy for pool-day-party",
role:"headline",
policy:"tropical-emerald",
weight:90
},
{
id:"pool-day-party:cast:4",
story:"pool-day-party",
principle:"cast",
condition:"pool-day-party cast variant 4",
decision:"Apply cast policy for pool-day-party",
role:"accent",
policy:"rose-glamour",
weight:97
},
{
id:"pool-day-party:brand:1",
story:"pool-day-party",
principle:"brand",
condition:"pool-day-party brand variant 1",
decision:"Apply brand policy for pool-day-party",
role:"metadata",
policy:"sunset-warm",
weight:73
},
{
id:"pool-day-party:brand:2",
story:"pool-day-party",
principle:"brand",
condition:"pool-day-party brand variant 2",
decision:"Apply brand policy for pool-day-party",
role:"dateTime",
policy:"burgundy-intimate",
weight:80
},
{
id:"pool-day-party:brand:3",
story:"pool-day-party",
principle:"brand",
condition:"pool-day-party brand variant 3",
decision:"Apply brand policy for pool-day-party",
role:"venue",
policy:"electric-night",
weight:87
},
{
id:"pool-day-party:brand:4",
story:"pool-day-party",
principle:"brand",
condition:"pool-day-party brand variant 4",
decision:"Apply brand policy for pool-day-party",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:94
},
{
id:"pool-day-party:export:1",
story:"pool-day-party",
principle:"export",
condition:"pool-day-party export variant 1",
decision:"Apply export policy for pool-day-party",
role:"badgeText",
policy:"retro-pop",
weight:70
},
{
id:"pool-day-party:export:2",
story:"pool-day-party",
principle:"export",
condition:"pool-day-party export variant 2",
decision:"Apply export policy for pool-day-party",
role:"presenter",
policy:"neutral-editorial",
weight:77
},
{
id:"pool-day-party:export:3",
story:"pool-day-party",
principle:"export",
condition:"pool-day-party export variant 3",
decision:"Apply export policy for pool-day-party",
role:"footer",
policy:"image-led",
weight:84
},
{
id:"pool-day-party:export:4",
story:"pool-day-party",
principle:"export",
condition:"pool-day-party export variant 4",
decision:"Apply export policy for pool-day-party",
role:"stroke",
policy:"warm-premium",
weight:91
},
{
id:"pool-day-party:accessibility:1",
story:"pool-day-party",
principle:"accessibility",
condition:"pool-day-party accessibility variant 1",
decision:"Apply accessibility policy for pool-day-party",
role:"glow",
policy:"champagne-black",
weight:98
},
{
id:"pool-day-party:accessibility:2",
story:"pool-day-party",
principle:"accessibility",
condition:"pool-day-party accessibility variant 2",
decision:"Apply accessibility policy for pool-day-party",
role:"neutral",
policy:"tropical-emerald",
weight:74
},
{
id:"pool-day-party:accessibility:3",
story:"pool-day-party",
principle:"accessibility",
condition:"pool-day-party accessibility variant 3",
decision:"Apply accessibility policy for pool-day-party",
role:"utility",
policy:"rose-glamour",
weight:81
},
{
id:"pool-day-party:accessibility:4",
story:"pool-day-party",
principle:"accessibility",
condition:"pool-day-party accessibility variant 4",
decision:"Apply accessibility policy for pool-day-party",
role:"background",
policy:"sunset-warm",
weight:88
},
{
id:"high-energy-club:dominant:1",
story:"high-energy-club",
principle:"dominant",
condition:"high-energy-club dominant variant 1",
decision:"Apply dominant policy for high-energy-club",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:95
},
{
id:"high-energy-club:dominant:2",
story:"high-energy-club",
principle:"dominant",
condition:"high-energy-club dominant variant 2",
decision:"Apply dominant policy for high-energy-club",
role:"headline",
policy:"electric-night",
weight:71
},
{
id:"high-energy-club:dominant:3",
story:"high-energy-club",
principle:"dominant",
condition:"high-energy-club dominant variant 3",
decision:"Apply dominant policy for high-energy-club",
role:"accent",
policy:"industrial-monochrome",
weight:78
},
{
id:"high-energy-club:dominant:4",
story:"high-energy-club",
principle:"dominant",
condition:"high-energy-club dominant variant 4",
decision:"Apply dominant policy for high-energy-club",
role:"metadata",
policy:"retro-pop",
weight:85
},
{
id:"high-energy-club:support:1",
story:"high-energy-club",
principle:"support",
condition:"high-energy-club support variant 1",
decision:"Apply support policy for high-energy-club",
role:"dateTime",
policy:"neutral-editorial",
weight:92
},
{
id:"high-energy-club:support:2",
story:"high-energy-club",
principle:"support",
condition:"high-energy-club support variant 2",
decision:"Apply support policy for high-energy-club",
role:"venue",
policy:"image-led",
weight:99
},
{
id:"high-energy-club:support:3",
story:"high-energy-club",
principle:"support",
condition:"high-energy-club support variant 3",
decision:"Apply support policy for high-energy-club",
role:"badgeBackground",
policy:"warm-premium",
weight:75
},
{
id:"high-energy-club:support:4",
story:"high-energy-club",
principle:"support",
condition:"high-energy-club support variant 4",
decision:"Apply support policy for high-energy-club",
role:"badgeText",
policy:"champagne-black",
weight:82
},
{
id:"high-energy-club:accent:1",
story:"high-energy-club",
principle:"accent",
condition:"high-energy-club accent variant 1",
decision:"Apply accent policy for high-energy-club",
role:"presenter",
policy:"tropical-emerald",
weight:89
},
{
id:"high-energy-club:accent:2",
story:"high-energy-club",
principle:"accent",
condition:"high-energy-club accent variant 2",
decision:"Apply accent policy for high-energy-club",
role:"footer",
policy:"rose-glamour",
weight:96
},
{
id:"high-energy-club:accent:3",
story:"high-energy-club",
principle:"accent",
condition:"high-energy-club accent variant 3",
decision:"Apply accent policy for high-energy-club",
role:"stroke",
policy:"sunset-warm",
weight:72
},
{
id:"high-energy-club:accent:4",
story:"high-energy-club",
principle:"accent",
condition:"high-energy-club accent variant 4",
decision:"Apply accent policy for high-energy-club",
role:"glow",
policy:"burgundy-intimate",
weight:79
},
{
id:"high-energy-club:neutral:1",
story:"high-energy-club",
principle:"neutral",
condition:"high-energy-club neutral variant 1",
decision:"Apply neutral policy for high-energy-club",
role:"neutral",
policy:"electric-night",
weight:86
},
{
id:"high-energy-club:neutral:2",
story:"high-energy-club",
principle:"neutral",
condition:"high-energy-club neutral variant 2",
decision:"Apply neutral policy for high-energy-club",
role:"utility",
policy:"industrial-monochrome",
weight:93
},
{
id:"high-energy-club:neutral:3",
story:"high-energy-club",
principle:"neutral",
condition:"high-energy-club neutral variant 3",
decision:"Apply neutral policy for high-energy-club",
role:"background",
policy:"retro-pop",
weight:100
},
{
id:"high-energy-club:neutral:4",
story:"high-energy-club",
principle:"neutral",
condition:"high-energy-club neutral variant 4",
decision:"Apply neutral policy for high-energy-club",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:76
},
{
id:"high-energy-club:contrast:1",
story:"high-energy-club",
principle:"contrast",
condition:"high-energy-club contrast variant 1",
decision:"Apply contrast policy for high-energy-club",
role:"headline",
policy:"image-led",
weight:83
},
{
id:"high-energy-club:contrast:2",
story:"high-energy-club",
principle:"contrast",
condition:"high-energy-club contrast variant 2",
decision:"Apply contrast policy for high-energy-club",
role:"accent",
policy:"warm-premium",
weight:90
},
{
id:"high-energy-club:contrast:3",
story:"high-energy-club",
principle:"contrast",
condition:"high-energy-club contrast variant 3",
decision:"Apply contrast policy for high-energy-club",
role:"metadata",
policy:"champagne-black",
weight:97
},
{
id:"high-energy-club:contrast:4",
story:"high-energy-club",
principle:"contrast",
condition:"high-energy-club contrast variant 4",
decision:"Apply contrast policy for high-energy-club",
role:"dateTime",
policy:"tropical-emerald",
weight:73
},
{
id:"high-energy-club:skin:1",
story:"high-energy-club",
principle:"skin",
condition:"high-energy-club skin variant 1",
decision:"Apply skin policy for high-energy-club",
role:"venue",
policy:"rose-glamour",
weight:80
},
{
id:"high-energy-club:skin:2",
story:"high-energy-club",
principle:"skin",
condition:"high-energy-club skin variant 2",
decision:"Apply skin policy for high-energy-club",
role:"badgeBackground",
policy:"sunset-warm",
weight:87
},
{
id:"high-energy-club:skin:3",
story:"high-energy-club",
principle:"skin",
condition:"high-energy-club skin variant 3",
decision:"Apply skin policy for high-energy-club",
role:"badgeText",
policy:"burgundy-intimate",
weight:94
},
{
id:"high-energy-club:skin:4",
story:"high-energy-club",
principle:"skin",
condition:"high-energy-club skin variant 4",
decision:"Apply skin policy for high-energy-club",
role:"presenter",
policy:"electric-night",
weight:70
},
{
id:"high-energy-club:saturation:1",
story:"high-energy-club",
principle:"saturation",
condition:"high-energy-club saturation variant 1",
decision:"Apply saturation policy for high-energy-club",
role:"footer",
policy:"industrial-monochrome",
weight:77
},
{
id:"high-energy-club:saturation:2",
story:"high-energy-club",
principle:"saturation",
condition:"high-energy-club saturation variant 2",
decision:"Apply saturation policy for high-energy-club",
role:"stroke",
policy:"retro-pop",
weight:84
},
{
id:"high-energy-club:saturation:3",
story:"high-energy-club",
principle:"saturation",
condition:"high-energy-club saturation variant 3",
decision:"Apply saturation policy for high-energy-club",
role:"glow",
policy:"neutral-editorial",
weight:91
},
{
id:"high-energy-club:saturation:4",
story:"high-energy-club",
principle:"saturation",
condition:"high-energy-club saturation variant 4",
decision:"Apply saturation policy for high-energy-club",
role:"neutral",
policy:"image-led",
weight:98
},
{
id:"high-energy-club:harmony:1",
story:"high-energy-club",
principle:"harmony",
condition:"high-energy-club harmony variant 1",
decision:"Apply harmony policy for high-energy-club",
role:"utility",
policy:"warm-premium",
weight:74
},
{
id:"high-energy-club:harmony:2",
story:"high-energy-club",
principle:"harmony",
condition:"high-energy-club harmony variant 2",
decision:"Apply harmony policy for high-energy-club",
role:"background",
policy:"champagne-black",
weight:81
},
{
id:"high-energy-club:harmony:3",
story:"high-energy-club",
principle:"harmony",
condition:"high-energy-club harmony variant 3",
decision:"Apply harmony policy for high-energy-club",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:88
},
{
id:"high-energy-club:harmony:4",
story:"high-energy-club",
principle:"harmony",
condition:"high-energy-club harmony variant 4",
decision:"Apply harmony policy for high-energy-club",
role:"headline",
policy:"rose-glamour",
weight:95
},
{
id:"high-energy-club:temperature:1",
story:"high-energy-club",
principle:"temperature",
condition:"high-energy-club temperature variant 1",
decision:"Apply temperature policy for high-energy-club",
role:"accent",
policy:"sunset-warm",
weight:71
},
{
id:"high-energy-club:temperature:2",
story:"high-energy-club",
principle:"temperature",
condition:"high-energy-club temperature variant 2",
decision:"Apply temperature policy for high-energy-club",
role:"metadata",
policy:"burgundy-intimate",
weight:78
},
{
id:"high-energy-club:temperature:3",
story:"high-energy-club",
principle:"temperature",
condition:"high-energy-club temperature variant 3",
decision:"Apply temperature policy for high-energy-club",
role:"dateTime",
policy:"electric-night",
weight:85
},
{
id:"high-energy-club:temperature:4",
story:"high-energy-club",
principle:"temperature",
condition:"high-energy-club temperature variant 4",
decision:"Apply temperature policy for high-energy-club",
role:"venue",
policy:"industrial-monochrome",
weight:92
},
{
id:"high-energy-club:background:1",
story:"high-energy-club",
principle:"background",
condition:"high-energy-club background variant 1",
decision:"Apply background policy for high-energy-club",
role:"badgeBackground",
policy:"retro-pop",
weight:99
},
{
id:"high-energy-club:background:2",
story:"high-energy-club",
principle:"background",
condition:"high-energy-club background variant 2",
decision:"Apply background policy for high-energy-club",
role:"badgeText",
policy:"neutral-editorial",
weight:75
},
{
id:"high-energy-club:background:3",
story:"high-energy-club",
principle:"background",
condition:"high-energy-club background variant 3",
decision:"Apply background policy for high-energy-club",
role:"presenter",
policy:"image-led",
weight:82
},
{
id:"high-energy-club:background:4",
story:"high-energy-club",
principle:"background",
condition:"high-energy-club background variant 4",
decision:"Apply background policy for high-energy-club",
role:"footer",
policy:"warm-premium",
weight:89
},
{
id:"high-energy-club:headline:1",
story:"high-energy-club",
principle:"headline",
condition:"high-energy-club headline variant 1",
decision:"Apply headline policy for high-energy-club",
role:"stroke",
policy:"champagne-black",
weight:96
},
{
id:"high-energy-club:headline:2",
story:"high-energy-club",
principle:"headline",
condition:"high-energy-club headline variant 2",
decision:"Apply headline policy for high-energy-club",
role:"glow",
policy:"tropical-emerald",
weight:72
},
{
id:"high-energy-club:headline:3",
story:"high-energy-club",
principle:"headline",
condition:"high-energy-club headline variant 3",
decision:"Apply headline policy for high-energy-club",
role:"neutral",
policy:"rose-glamour",
weight:79
},
{
id:"high-energy-club:headline:4",
story:"high-energy-club",
principle:"headline",
condition:"high-energy-club headline variant 4",
decision:"Apply headline policy for high-energy-club",
role:"utility",
policy:"sunset-warm",
weight:86
},
{
id:"high-energy-club:metadata:1",
story:"high-energy-club",
principle:"metadata",
condition:"high-energy-club metadata variant 1",
decision:"Apply metadata policy for high-energy-club",
role:"background",
policy:"burgundy-intimate",
weight:93
},
{
id:"high-energy-club:metadata:2",
story:"high-energy-club",
principle:"metadata",
condition:"high-energy-club metadata variant 2",
decision:"Apply metadata policy for high-energy-club",
role:"backgroundSecondary",
policy:"electric-night",
weight:100
},
{
id:"high-energy-club:metadata:3",
story:"high-energy-club",
principle:"metadata",
condition:"high-energy-club metadata variant 3",
decision:"Apply metadata policy for high-energy-club",
role:"headline",
policy:"industrial-monochrome",
weight:76
},
{
id:"high-energy-club:metadata:4",
story:"high-energy-club",
principle:"metadata",
condition:"high-energy-club metadata variant 4",
decision:"Apply metadata policy for high-energy-club",
role:"accent",
policy:"retro-pop",
weight:83
},
{
id:"high-energy-club:badge:1",
story:"high-energy-club",
principle:"badge",
condition:"high-energy-club badge variant 1",
decision:"Apply badge policy for high-energy-club",
role:"metadata",
policy:"neutral-editorial",
weight:90
},
{
id:"high-energy-club:badge:2",
story:"high-energy-club",
principle:"badge",
condition:"high-energy-club badge variant 2",
decision:"Apply badge policy for high-energy-club",
role:"dateTime",
policy:"image-led",
weight:97
},
{
id:"high-energy-club:badge:3",
story:"high-energy-club",
principle:"badge",
condition:"high-energy-club badge variant 3",
decision:"Apply badge policy for high-energy-club",
role:"venue",
policy:"warm-premium",
weight:73
},
{
id:"high-energy-club:badge:4",
story:"high-energy-club",
principle:"badge",
condition:"high-energy-club badge variant 4",
decision:"Apply badge policy for high-energy-club",
role:"badgeBackground",
policy:"champagne-black",
weight:80
},
{
id:"high-energy-club:glow:1",
story:"high-energy-club",
principle:"glow",
condition:"high-energy-club glow variant 1",
decision:"Apply glow policy for high-energy-club",
role:"badgeText",
policy:"tropical-emerald",
weight:87
},
{
id:"high-energy-club:glow:2",
story:"high-energy-club",
principle:"glow",
condition:"high-energy-club glow variant 2",
decision:"Apply glow policy for high-energy-club",
role:"presenter",
policy:"rose-glamour",
weight:94
},
{
id:"high-energy-club:glow:3",
story:"high-energy-club",
principle:"glow",
condition:"high-energy-club glow variant 3",
decision:"Apply glow policy for high-energy-club",
role:"footer",
policy:"sunset-warm",
weight:70
},
{
id:"high-energy-club:glow:4",
story:"high-energy-club",
principle:"glow",
condition:"high-energy-club glow variant 4",
decision:"Apply glow policy for high-energy-club",
role:"stroke",
policy:"burgundy-intimate",
weight:77
},
{
id:"high-energy-club:cast:1",
story:"high-energy-club",
principle:"cast",
condition:"high-energy-club cast variant 1",
decision:"Apply cast policy for high-energy-club",
role:"glow",
policy:"electric-night",
weight:84
},
{
id:"high-energy-club:cast:2",
story:"high-energy-club",
principle:"cast",
condition:"high-energy-club cast variant 2",
decision:"Apply cast policy for high-energy-club",
role:"neutral",
policy:"industrial-monochrome",
weight:91
},
{
id:"high-energy-club:cast:3",
story:"high-energy-club",
principle:"cast",
condition:"high-energy-club cast variant 3",
decision:"Apply cast policy for high-energy-club",
role:"utility",
policy:"retro-pop",
weight:98
},
{
id:"high-energy-club:cast:4",
story:"high-energy-club",
principle:"cast",
condition:"high-energy-club cast variant 4",
decision:"Apply cast policy for high-energy-club",
role:"background",
policy:"neutral-editorial",
weight:74
},
{
id:"high-energy-club:brand:1",
story:"high-energy-club",
principle:"brand",
condition:"high-energy-club brand variant 1",
decision:"Apply brand policy for high-energy-club",
role:"backgroundSecondary",
policy:"image-led",
weight:81
},
{
id:"high-energy-club:brand:2",
story:"high-energy-club",
principle:"brand",
condition:"high-energy-club brand variant 2",
decision:"Apply brand policy for high-energy-club",
role:"headline",
policy:"warm-premium",
weight:88
},
{
id:"high-energy-club:brand:3",
story:"high-energy-club",
principle:"brand",
condition:"high-energy-club brand variant 3",
decision:"Apply brand policy for high-energy-club",
role:"accent",
policy:"champagne-black",
weight:95
},
{
id:"high-energy-club:brand:4",
story:"high-energy-club",
principle:"brand",
condition:"high-energy-club brand variant 4",
decision:"Apply brand policy for high-energy-club",
role:"metadata",
policy:"tropical-emerald",
weight:71
},
{
id:"high-energy-club:export:1",
story:"high-energy-club",
principle:"export",
condition:"high-energy-club export variant 1",
decision:"Apply export policy for high-energy-club",
role:"dateTime",
policy:"rose-glamour",
weight:78
},
{
id:"high-energy-club:export:2",
story:"high-energy-club",
principle:"export",
condition:"high-energy-club export variant 2",
decision:"Apply export policy for high-energy-club",
role:"venue",
policy:"sunset-warm",
weight:85
},
{
id:"high-energy-club:export:3",
story:"high-energy-club",
principle:"export",
condition:"high-energy-club export variant 3",
decision:"Apply export policy for high-energy-club",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:92
},
{
id:"high-energy-club:export:4",
story:"high-energy-club",
principle:"export",
condition:"high-energy-club export variant 4",
decision:"Apply export policy for high-energy-club",
role:"badgeText",
policy:"electric-night",
weight:99
},
{
id:"high-energy-club:accessibility:1",
story:"high-energy-club",
principle:"accessibility",
condition:"high-energy-club accessibility variant 1",
decision:"Apply accessibility policy for high-energy-club",
role:"presenter",
policy:"industrial-monochrome",
weight:75
},
{
id:"high-energy-club:accessibility:2",
story:"high-energy-club",
principle:"accessibility",
condition:"high-energy-club accessibility variant 2",
decision:"Apply accessibility policy for high-energy-club",
role:"footer",
policy:"retro-pop",
weight:82
},
{
id:"high-energy-club:accessibility:3",
story:"high-energy-club",
principle:"accessibility",
condition:"high-energy-club accessibility variant 3",
decision:"Apply accessibility policy for high-energy-club",
role:"stroke",
policy:"neutral-editorial",
weight:89
},
{
id:"high-energy-club:accessibility:4",
story:"high-energy-club",
principle:"accessibility",
condition:"high-energy-club accessibility variant 4",
decision:"Apply accessibility policy for high-energy-club",
role:"glow",
policy:"image-led",
weight:96
},
{
id:"edm-rave:dominant:1",
story:"edm-rave",
principle:"dominant",
condition:"edm-rave dominant variant 1",
decision:"Apply dominant policy for edm-rave",
role:"neutral",
policy:"warm-premium",
weight:72
},
{
id:"edm-rave:dominant:2",
story:"edm-rave",
principle:"dominant",
condition:"edm-rave dominant variant 2",
decision:"Apply dominant policy for edm-rave",
role:"utility",
policy:"champagne-black",
weight:79
},
{
id:"edm-rave:dominant:3",
story:"edm-rave",
principle:"dominant",
condition:"edm-rave dominant variant 3",
decision:"Apply dominant policy for edm-rave",
role:"background",
policy:"tropical-emerald",
weight:86
},
{
id:"edm-rave:dominant:4",
story:"edm-rave",
principle:"dominant",
condition:"edm-rave dominant variant 4",
decision:"Apply dominant policy for edm-rave",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:93
},
{
id:"edm-rave:support:1",
story:"edm-rave",
principle:"support",
condition:"edm-rave support variant 1",
decision:"Apply support policy for edm-rave",
role:"headline",
policy:"sunset-warm",
weight:100
},
{
id:"edm-rave:support:2",
story:"edm-rave",
principle:"support",
condition:"edm-rave support variant 2",
decision:"Apply support policy for edm-rave",
role:"accent",
policy:"burgundy-intimate",
weight:76
},
{
id:"edm-rave:support:3",
story:"edm-rave",
principle:"support",
condition:"edm-rave support variant 3",
decision:"Apply support policy for edm-rave",
role:"metadata",
policy:"electric-night",
weight:83
},
{
id:"edm-rave:support:4",
story:"edm-rave",
principle:"support",
condition:"edm-rave support variant 4",
decision:"Apply support policy for edm-rave",
role:"dateTime",
policy:"industrial-monochrome",
weight:90
},
{
id:"edm-rave:accent:1",
story:"edm-rave",
principle:"accent",
condition:"edm-rave accent variant 1",
decision:"Apply accent policy for edm-rave",
role:"venue",
policy:"retro-pop",
weight:97
},
{
id:"edm-rave:accent:2",
story:"edm-rave",
principle:"accent",
condition:"edm-rave accent variant 2",
decision:"Apply accent policy for edm-rave",
role:"badgeBackground",
policy:"neutral-editorial",
weight:73
},
{
id:"edm-rave:accent:3",
story:"edm-rave",
principle:"accent",
condition:"edm-rave accent variant 3",
decision:"Apply accent policy for edm-rave",
role:"badgeText",
policy:"image-led",
weight:80
},
{
id:"edm-rave:accent:4",
story:"edm-rave",
principle:"accent",
condition:"edm-rave accent variant 4",
decision:"Apply accent policy for edm-rave",
role:"presenter",
policy:"warm-premium",
weight:87
},
{
id:"edm-rave:neutral:1",
story:"edm-rave",
principle:"neutral",
condition:"edm-rave neutral variant 1",
decision:"Apply neutral policy for edm-rave",
role:"footer",
policy:"champagne-black",
weight:94
},
{
id:"edm-rave:neutral:2",
story:"edm-rave",
principle:"neutral",
condition:"edm-rave neutral variant 2",
decision:"Apply neutral policy for edm-rave",
role:"stroke",
policy:"tropical-emerald",
weight:70
},
{
id:"edm-rave:neutral:3",
story:"edm-rave",
principle:"neutral",
condition:"edm-rave neutral variant 3",
decision:"Apply neutral policy for edm-rave",
role:"glow",
policy:"rose-glamour",
weight:77
},
{
id:"edm-rave:neutral:4",
story:"edm-rave",
principle:"neutral",
condition:"edm-rave neutral variant 4",
decision:"Apply neutral policy for edm-rave",
role:"neutral",
policy:"sunset-warm",
weight:84
},
{
id:"edm-rave:contrast:1",
story:"edm-rave",
principle:"contrast",
condition:"edm-rave contrast variant 1",
decision:"Apply contrast policy for edm-rave",
role:"utility",
policy:"burgundy-intimate",
weight:91
},
{
id:"edm-rave:contrast:2",
story:"edm-rave",
principle:"contrast",
condition:"edm-rave contrast variant 2",
decision:"Apply contrast policy for edm-rave",
role:"background",
policy:"electric-night",
weight:98
},
{
id:"edm-rave:contrast:3",
story:"edm-rave",
principle:"contrast",
condition:"edm-rave contrast variant 3",
decision:"Apply contrast policy for edm-rave",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:74
},
{
id:"edm-rave:contrast:4",
story:"edm-rave",
principle:"contrast",
condition:"edm-rave contrast variant 4",
decision:"Apply contrast policy for edm-rave",
role:"headline",
policy:"retro-pop",
weight:81
},
{
id:"edm-rave:skin:1",
story:"edm-rave",
principle:"skin",
condition:"edm-rave skin variant 1",
decision:"Apply skin policy for edm-rave",
role:"accent",
policy:"neutral-editorial",
weight:88
},
{
id:"edm-rave:skin:2",
story:"edm-rave",
principle:"skin",
condition:"edm-rave skin variant 2",
decision:"Apply skin policy for edm-rave",
role:"metadata",
policy:"image-led",
weight:95
},
{
id:"edm-rave:skin:3",
story:"edm-rave",
principle:"skin",
condition:"edm-rave skin variant 3",
decision:"Apply skin policy for edm-rave",
role:"dateTime",
policy:"warm-premium",
weight:71
},
{
id:"edm-rave:skin:4",
story:"edm-rave",
principle:"skin",
condition:"edm-rave skin variant 4",
decision:"Apply skin policy for edm-rave",
role:"venue",
policy:"champagne-black",
weight:78
},
{
id:"edm-rave:saturation:1",
story:"edm-rave",
principle:"saturation",
condition:"edm-rave saturation variant 1",
decision:"Apply saturation policy for edm-rave",
role:"badgeBackground",
policy:"tropical-emerald",
weight:85
},
{
id:"edm-rave:saturation:2",
story:"edm-rave",
principle:"saturation",
condition:"edm-rave saturation variant 2",
decision:"Apply saturation policy for edm-rave",
role:"badgeText",
policy:"rose-glamour",
weight:92
},
{
id:"edm-rave:saturation:3",
story:"edm-rave",
principle:"saturation",
condition:"edm-rave saturation variant 3",
decision:"Apply saturation policy for edm-rave",
role:"presenter",
policy:"sunset-warm",
weight:99
},
{
id:"edm-rave:saturation:4",
story:"edm-rave",
principle:"saturation",
condition:"edm-rave saturation variant 4",
decision:"Apply saturation policy for edm-rave",
role:"footer",
policy:"burgundy-intimate",
weight:75
},
{
id:"edm-rave:harmony:1",
story:"edm-rave",
principle:"harmony",
condition:"edm-rave harmony variant 1",
decision:"Apply harmony policy for edm-rave",
role:"stroke",
policy:"electric-night",
weight:82
},
{
id:"edm-rave:harmony:2",
story:"edm-rave",
principle:"harmony",
condition:"edm-rave harmony variant 2",
decision:"Apply harmony policy for edm-rave",
role:"glow",
policy:"industrial-monochrome",
weight:89
},
{
id:"edm-rave:harmony:3",
story:"edm-rave",
principle:"harmony",
condition:"edm-rave harmony variant 3",
decision:"Apply harmony policy for edm-rave",
role:"neutral",
policy:"retro-pop",
weight:96
},
{
id:"edm-rave:harmony:4",
story:"edm-rave",
principle:"harmony",
condition:"edm-rave harmony variant 4",
decision:"Apply harmony policy for edm-rave",
role:"utility",
policy:"neutral-editorial",
weight:72
},
{
id:"edm-rave:temperature:1",
story:"edm-rave",
principle:"temperature",
condition:"edm-rave temperature variant 1",
decision:"Apply temperature policy for edm-rave",
role:"background",
policy:"image-led",
weight:79
},
{
id:"edm-rave:temperature:2",
story:"edm-rave",
principle:"temperature",
condition:"edm-rave temperature variant 2",
decision:"Apply temperature policy for edm-rave",
role:"backgroundSecondary",
policy:"warm-premium",
weight:86
},
{
id:"edm-rave:temperature:3",
story:"edm-rave",
principle:"temperature",
condition:"edm-rave temperature variant 3",
decision:"Apply temperature policy for edm-rave",
role:"headline",
policy:"champagne-black",
weight:93
},
{
id:"edm-rave:temperature:4",
story:"edm-rave",
principle:"temperature",
condition:"edm-rave temperature variant 4",
decision:"Apply temperature policy for edm-rave",
role:"accent",
policy:"tropical-emerald",
weight:100
},
{
id:"edm-rave:background:1",
story:"edm-rave",
principle:"background",
condition:"edm-rave background variant 1",
decision:"Apply background policy for edm-rave",
role:"metadata",
policy:"rose-glamour",
weight:76
},
{
id:"edm-rave:background:2",
story:"edm-rave",
principle:"background",
condition:"edm-rave background variant 2",
decision:"Apply background policy for edm-rave",
role:"dateTime",
policy:"sunset-warm",
weight:83
},
{
id:"edm-rave:background:3",
story:"edm-rave",
principle:"background",
condition:"edm-rave background variant 3",
decision:"Apply background policy for edm-rave",
role:"venue",
policy:"burgundy-intimate",
weight:90
},
{
id:"edm-rave:background:4",
story:"edm-rave",
principle:"background",
condition:"edm-rave background variant 4",
decision:"Apply background policy for edm-rave",
role:"badgeBackground",
policy:"electric-night",
weight:97
},
{
id:"edm-rave:headline:1",
story:"edm-rave",
principle:"headline",
condition:"edm-rave headline variant 1",
decision:"Apply headline policy for edm-rave",
role:"badgeText",
policy:"industrial-monochrome",
weight:73
},
{
id:"edm-rave:headline:2",
story:"edm-rave",
principle:"headline",
condition:"edm-rave headline variant 2",
decision:"Apply headline policy for edm-rave",
role:"presenter",
policy:"retro-pop",
weight:80
},
{
id:"edm-rave:headline:3",
story:"edm-rave",
principle:"headline",
condition:"edm-rave headline variant 3",
decision:"Apply headline policy for edm-rave",
role:"footer",
policy:"neutral-editorial",
weight:87
},
{
id:"edm-rave:headline:4",
story:"edm-rave",
principle:"headline",
condition:"edm-rave headline variant 4",
decision:"Apply headline policy for edm-rave",
role:"stroke",
policy:"image-led",
weight:94
},
{
id:"edm-rave:metadata:1",
story:"edm-rave",
principle:"metadata",
condition:"edm-rave metadata variant 1",
decision:"Apply metadata policy for edm-rave",
role:"glow",
policy:"warm-premium",
weight:70
},
{
id:"edm-rave:metadata:2",
story:"edm-rave",
principle:"metadata",
condition:"edm-rave metadata variant 2",
decision:"Apply metadata policy for edm-rave",
role:"neutral",
policy:"champagne-black",
weight:77
},
{
id:"edm-rave:metadata:3",
story:"edm-rave",
principle:"metadata",
condition:"edm-rave metadata variant 3",
decision:"Apply metadata policy for edm-rave",
role:"utility",
policy:"tropical-emerald",
weight:84
},
{
id:"edm-rave:metadata:4",
story:"edm-rave",
principle:"metadata",
condition:"edm-rave metadata variant 4",
decision:"Apply metadata policy for edm-rave",
role:"background",
policy:"rose-glamour",
weight:91
},
{
id:"edm-rave:badge:1",
story:"edm-rave",
principle:"badge",
condition:"edm-rave badge variant 1",
decision:"Apply badge policy for edm-rave",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:98
},
{
id:"edm-rave:badge:2",
story:"edm-rave",
principle:"badge",
condition:"edm-rave badge variant 2",
decision:"Apply badge policy for edm-rave",
role:"headline",
policy:"burgundy-intimate",
weight:74
},
{
id:"edm-rave:badge:3",
story:"edm-rave",
principle:"badge",
condition:"edm-rave badge variant 3",
decision:"Apply badge policy for edm-rave",
role:"accent",
policy:"electric-night",
weight:81
},
{
id:"edm-rave:badge:4",
story:"edm-rave",
principle:"badge",
condition:"edm-rave badge variant 4",
decision:"Apply badge policy for edm-rave",
role:"metadata",
policy:"industrial-monochrome",
weight:88
},
{
id:"edm-rave:glow:1",
story:"edm-rave",
principle:"glow",
condition:"edm-rave glow variant 1",
decision:"Apply glow policy for edm-rave",
role:"dateTime",
policy:"retro-pop",
weight:95
},
{
id:"edm-rave:glow:2",
story:"edm-rave",
principle:"glow",
condition:"edm-rave glow variant 2",
decision:"Apply glow policy for edm-rave",
role:"venue",
policy:"neutral-editorial",
weight:71
},
{
id:"edm-rave:glow:3",
story:"edm-rave",
principle:"glow",
condition:"edm-rave glow variant 3",
decision:"Apply glow policy for edm-rave",
role:"badgeBackground",
policy:"image-led",
weight:78
},
{
id:"edm-rave:glow:4",
story:"edm-rave",
principle:"glow",
condition:"edm-rave glow variant 4",
decision:"Apply glow policy for edm-rave",
role:"badgeText",
policy:"warm-premium",
weight:85
},
{
id:"edm-rave:cast:1",
story:"edm-rave",
principle:"cast",
condition:"edm-rave cast variant 1",
decision:"Apply cast policy for edm-rave",
role:"presenter",
policy:"champagne-black",
weight:92
},
{
id:"edm-rave:cast:2",
story:"edm-rave",
principle:"cast",
condition:"edm-rave cast variant 2",
decision:"Apply cast policy for edm-rave",
role:"footer",
policy:"tropical-emerald",
weight:99
},
{
id:"edm-rave:cast:3",
story:"edm-rave",
principle:"cast",
condition:"edm-rave cast variant 3",
decision:"Apply cast policy for edm-rave",
role:"stroke",
policy:"rose-glamour",
weight:75
},
{
id:"edm-rave:cast:4",
story:"edm-rave",
principle:"cast",
condition:"edm-rave cast variant 4",
decision:"Apply cast policy for edm-rave",
role:"glow",
policy:"sunset-warm",
weight:82
},
{
id:"edm-rave:brand:1",
story:"edm-rave",
principle:"brand",
condition:"edm-rave brand variant 1",
decision:"Apply brand policy for edm-rave",
role:"neutral",
policy:"burgundy-intimate",
weight:89
},
{
id:"edm-rave:brand:2",
story:"edm-rave",
principle:"brand",
condition:"edm-rave brand variant 2",
decision:"Apply brand policy for edm-rave",
role:"utility",
policy:"electric-night",
weight:96
},
{
id:"edm-rave:brand:3",
story:"edm-rave",
principle:"brand",
condition:"edm-rave brand variant 3",
decision:"Apply brand policy for edm-rave",
role:"background",
policy:"industrial-monochrome",
weight:72
},
{
id:"edm-rave:brand:4",
story:"edm-rave",
principle:"brand",
condition:"edm-rave brand variant 4",
decision:"Apply brand policy for edm-rave",
role:"backgroundSecondary",
policy:"retro-pop",
weight:79
},
{
id:"edm-rave:export:1",
story:"edm-rave",
principle:"export",
condition:"edm-rave export variant 1",
decision:"Apply export policy for edm-rave",
role:"headline",
policy:"neutral-editorial",
weight:86
},
{
id:"edm-rave:export:2",
story:"edm-rave",
principle:"export",
condition:"edm-rave export variant 2",
decision:"Apply export policy for edm-rave",
role:"accent",
policy:"image-led",
weight:93
},
{
id:"edm-rave:export:3",
story:"edm-rave",
principle:"export",
condition:"edm-rave export variant 3",
decision:"Apply export policy for edm-rave",
role:"metadata",
policy:"warm-premium",
weight:100
},
{
id:"edm-rave:export:4",
story:"edm-rave",
principle:"export",
condition:"edm-rave export variant 4",
decision:"Apply export policy for edm-rave",
role:"dateTime",
policy:"champagne-black",
weight:76
},
{
id:"edm-rave:accessibility:1",
story:"edm-rave",
principle:"accessibility",
condition:"edm-rave accessibility variant 1",
decision:"Apply accessibility policy for edm-rave",
role:"venue",
policy:"tropical-emerald",
weight:83
},
{
id:"edm-rave:accessibility:2",
story:"edm-rave",
principle:"accessibility",
condition:"edm-rave accessibility variant 2",
decision:"Apply accessibility policy for edm-rave",
role:"badgeBackground",
policy:"rose-glamour",
weight:90
},
{
id:"edm-rave:accessibility:3",
story:"edm-rave",
principle:"accessibility",
condition:"edm-rave accessibility variant 3",
decision:"Apply accessibility policy for edm-rave",
role:"badgeText",
policy:"sunset-warm",
weight:97
},
{
id:"edm-rave:accessibility:4",
story:"edm-rave",
principle:"accessibility",
condition:"edm-rave accessibility variant 4",
decision:"Apply accessibility policy for edm-rave",
role:"presenter",
policy:"burgundy-intimate",
weight:73
},
{
id:"techno-underground:dominant:1",
story:"techno-underground",
principle:"dominant",
condition:"techno-underground dominant variant 1",
decision:"Apply dominant policy for techno-underground",
role:"footer",
policy:"electric-night",
weight:80
},
{
id:"techno-underground:dominant:2",
story:"techno-underground",
principle:"dominant",
condition:"techno-underground dominant variant 2",
decision:"Apply dominant policy for techno-underground",
role:"stroke",
policy:"industrial-monochrome",
weight:87
},
{
id:"techno-underground:dominant:3",
story:"techno-underground",
principle:"dominant",
condition:"techno-underground dominant variant 3",
decision:"Apply dominant policy for techno-underground",
role:"glow",
policy:"retro-pop",
weight:94
},
{
id:"techno-underground:dominant:4",
story:"techno-underground",
principle:"dominant",
condition:"techno-underground dominant variant 4",
decision:"Apply dominant policy for techno-underground",
role:"neutral",
policy:"neutral-editorial",
weight:70
},
{
id:"techno-underground:support:1",
story:"techno-underground",
principle:"support",
condition:"techno-underground support variant 1",
decision:"Apply support policy for techno-underground",
role:"utility",
policy:"image-led",
weight:77
},
{
id:"techno-underground:support:2",
story:"techno-underground",
principle:"support",
condition:"techno-underground support variant 2",
decision:"Apply support policy for techno-underground",
role:"background",
policy:"warm-premium",
weight:84
},
{
id:"techno-underground:support:3",
story:"techno-underground",
principle:"support",
condition:"techno-underground support variant 3",
decision:"Apply support policy for techno-underground",
role:"backgroundSecondary",
policy:"champagne-black",
weight:91
},
{
id:"techno-underground:support:4",
story:"techno-underground",
principle:"support",
condition:"techno-underground support variant 4",
decision:"Apply support policy for techno-underground",
role:"headline",
policy:"tropical-emerald",
weight:98
},
{
id:"techno-underground:accent:1",
story:"techno-underground",
principle:"accent",
condition:"techno-underground accent variant 1",
decision:"Apply accent policy for techno-underground",
role:"accent",
policy:"rose-glamour",
weight:74
},
{
id:"techno-underground:accent:2",
story:"techno-underground",
principle:"accent",
condition:"techno-underground accent variant 2",
decision:"Apply accent policy for techno-underground",
role:"metadata",
policy:"sunset-warm",
weight:81
},
{
id:"techno-underground:accent:3",
story:"techno-underground",
principle:"accent",
condition:"techno-underground accent variant 3",
decision:"Apply accent policy for techno-underground",
role:"dateTime",
policy:"burgundy-intimate",
weight:88
},
{
id:"techno-underground:accent:4",
story:"techno-underground",
principle:"accent",
condition:"techno-underground accent variant 4",
decision:"Apply accent policy for techno-underground",
role:"venue",
policy:"electric-night",
weight:95
},
{
id:"techno-underground:neutral:1",
story:"techno-underground",
principle:"neutral",
condition:"techno-underground neutral variant 1",
decision:"Apply neutral policy for techno-underground",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:71
},
{
id:"techno-underground:neutral:2",
story:"techno-underground",
principle:"neutral",
condition:"techno-underground neutral variant 2",
decision:"Apply neutral policy for techno-underground",
role:"badgeText",
policy:"retro-pop",
weight:78
},
{
id:"techno-underground:neutral:3",
story:"techno-underground",
principle:"neutral",
condition:"techno-underground neutral variant 3",
decision:"Apply neutral policy for techno-underground",
role:"presenter",
policy:"neutral-editorial",
weight:85
},
{
id:"techno-underground:neutral:4",
story:"techno-underground",
principle:"neutral",
condition:"techno-underground neutral variant 4",
decision:"Apply neutral policy for techno-underground",
role:"footer",
policy:"image-led",
weight:92
},
{
id:"techno-underground:contrast:1",
story:"techno-underground",
principle:"contrast",
condition:"techno-underground contrast variant 1",
decision:"Apply contrast policy for techno-underground",
role:"stroke",
policy:"warm-premium",
weight:99
},
{
id:"techno-underground:contrast:2",
story:"techno-underground",
principle:"contrast",
condition:"techno-underground contrast variant 2",
decision:"Apply contrast policy for techno-underground",
role:"glow",
policy:"champagne-black",
weight:75
},
{
id:"techno-underground:contrast:3",
story:"techno-underground",
principle:"contrast",
condition:"techno-underground contrast variant 3",
decision:"Apply contrast policy for techno-underground",
role:"neutral",
policy:"tropical-emerald",
weight:82
},
{
id:"techno-underground:contrast:4",
story:"techno-underground",
principle:"contrast",
condition:"techno-underground contrast variant 4",
decision:"Apply contrast policy for techno-underground",
role:"utility",
policy:"rose-glamour",
weight:89
},
{
id:"techno-underground:skin:1",
story:"techno-underground",
principle:"skin",
condition:"techno-underground skin variant 1",
decision:"Apply skin policy for techno-underground",
role:"background",
policy:"sunset-warm",
weight:96
},
{
id:"techno-underground:skin:2",
story:"techno-underground",
principle:"skin",
condition:"techno-underground skin variant 2",
decision:"Apply skin policy for techno-underground",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:72
},
{
id:"techno-underground:skin:3",
story:"techno-underground",
principle:"skin",
condition:"techno-underground skin variant 3",
decision:"Apply skin policy for techno-underground",
role:"headline",
policy:"electric-night",
weight:79
},
{
id:"techno-underground:skin:4",
story:"techno-underground",
principle:"skin",
condition:"techno-underground skin variant 4",
decision:"Apply skin policy for techno-underground",
role:"accent",
policy:"industrial-monochrome",
weight:86
},
{
id:"techno-underground:saturation:1",
story:"techno-underground",
principle:"saturation",
condition:"techno-underground saturation variant 1",
decision:"Apply saturation policy for techno-underground",
role:"metadata",
policy:"retro-pop",
weight:93
},
{
id:"techno-underground:saturation:2",
story:"techno-underground",
principle:"saturation",
condition:"techno-underground saturation variant 2",
decision:"Apply saturation policy for techno-underground",
role:"dateTime",
policy:"neutral-editorial",
weight:100
},
{
id:"techno-underground:saturation:3",
story:"techno-underground",
principle:"saturation",
condition:"techno-underground saturation variant 3",
decision:"Apply saturation policy for techno-underground",
role:"venue",
policy:"image-led",
weight:76
},
{
id:"techno-underground:saturation:4",
story:"techno-underground",
principle:"saturation",
condition:"techno-underground saturation variant 4",
decision:"Apply saturation policy for techno-underground",
role:"badgeBackground",
policy:"warm-premium",
weight:83
},
{
id:"techno-underground:harmony:1",
story:"techno-underground",
principle:"harmony",
condition:"techno-underground harmony variant 1",
decision:"Apply harmony policy for techno-underground",
role:"badgeText",
policy:"champagne-black",
weight:90
},
{
id:"techno-underground:harmony:2",
story:"techno-underground",
principle:"harmony",
condition:"techno-underground harmony variant 2",
decision:"Apply harmony policy for techno-underground",
role:"presenter",
policy:"tropical-emerald",
weight:97
},
{
id:"techno-underground:harmony:3",
story:"techno-underground",
principle:"harmony",
condition:"techno-underground harmony variant 3",
decision:"Apply harmony policy for techno-underground",
role:"footer",
policy:"rose-glamour",
weight:73
},
{
id:"techno-underground:harmony:4",
story:"techno-underground",
principle:"harmony",
condition:"techno-underground harmony variant 4",
decision:"Apply harmony policy for techno-underground",
role:"stroke",
policy:"sunset-warm",
weight:80
},
{
id:"techno-underground:temperature:1",
story:"techno-underground",
principle:"temperature",
condition:"techno-underground temperature variant 1",
decision:"Apply temperature policy for techno-underground",
role:"glow",
policy:"burgundy-intimate",
weight:87
},
{
id:"techno-underground:temperature:2",
story:"techno-underground",
principle:"temperature",
condition:"techno-underground temperature variant 2",
decision:"Apply temperature policy for techno-underground",
role:"neutral",
policy:"electric-night",
weight:94
},
{
id:"techno-underground:temperature:3",
story:"techno-underground",
principle:"temperature",
condition:"techno-underground temperature variant 3",
decision:"Apply temperature policy for techno-underground",
role:"utility",
policy:"industrial-monochrome",
weight:70
},
{
id:"techno-underground:temperature:4",
story:"techno-underground",
principle:"temperature",
condition:"techno-underground temperature variant 4",
decision:"Apply temperature policy for techno-underground",
role:"background",
policy:"retro-pop",
weight:77
},
{
id:"techno-underground:background:1",
story:"techno-underground",
principle:"background",
condition:"techno-underground background variant 1",
decision:"Apply background policy for techno-underground",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:84
},
{
id:"techno-underground:background:2",
story:"techno-underground",
principle:"background",
condition:"techno-underground background variant 2",
decision:"Apply background policy for techno-underground",
role:"headline",
policy:"image-led",
weight:91
},
{
id:"techno-underground:background:3",
story:"techno-underground",
principle:"background",
condition:"techno-underground background variant 3",
decision:"Apply background policy for techno-underground",
role:"accent",
policy:"warm-premium",
weight:98
},
{
id:"techno-underground:background:4",
story:"techno-underground",
principle:"background",
condition:"techno-underground background variant 4",
decision:"Apply background policy for techno-underground",
role:"metadata",
policy:"champagne-black",
weight:74
},
{
id:"techno-underground:headline:1",
story:"techno-underground",
principle:"headline",
condition:"techno-underground headline variant 1",
decision:"Apply headline policy for techno-underground",
role:"dateTime",
policy:"tropical-emerald",
weight:81
},
{
id:"techno-underground:headline:2",
story:"techno-underground",
principle:"headline",
condition:"techno-underground headline variant 2",
decision:"Apply headline policy for techno-underground",
role:"venue",
policy:"rose-glamour",
weight:88
},
{
id:"techno-underground:headline:3",
story:"techno-underground",
principle:"headline",
condition:"techno-underground headline variant 3",
decision:"Apply headline policy for techno-underground",
role:"badgeBackground",
policy:"sunset-warm",
weight:95
},
{
id:"techno-underground:headline:4",
story:"techno-underground",
principle:"headline",
condition:"techno-underground headline variant 4",
decision:"Apply headline policy for techno-underground",
role:"badgeText",
policy:"burgundy-intimate",
weight:71
},
{
id:"techno-underground:metadata:1",
story:"techno-underground",
principle:"metadata",
condition:"techno-underground metadata variant 1",
decision:"Apply metadata policy for techno-underground",
role:"presenter",
policy:"electric-night",
weight:78
},
{
id:"techno-underground:metadata:2",
story:"techno-underground",
principle:"metadata",
condition:"techno-underground metadata variant 2",
decision:"Apply metadata policy for techno-underground",
role:"footer",
policy:"industrial-monochrome",
weight:85
},
{
id:"techno-underground:metadata:3",
story:"techno-underground",
principle:"metadata",
condition:"techno-underground metadata variant 3",
decision:"Apply metadata policy for techno-underground",
role:"stroke",
policy:"retro-pop",
weight:92
},
{
id:"techno-underground:metadata:4",
story:"techno-underground",
principle:"metadata",
condition:"techno-underground metadata variant 4",
decision:"Apply metadata policy for techno-underground",
role:"glow",
policy:"neutral-editorial",
weight:99
},
{
id:"techno-underground:badge:1",
story:"techno-underground",
principle:"badge",
condition:"techno-underground badge variant 1",
decision:"Apply badge policy for techno-underground",
role:"neutral",
policy:"image-led",
weight:75
},
{
id:"techno-underground:badge:2",
story:"techno-underground",
principle:"badge",
condition:"techno-underground badge variant 2",
decision:"Apply badge policy for techno-underground",
role:"utility",
policy:"warm-premium",
weight:82
},
{
id:"techno-underground:badge:3",
story:"techno-underground",
principle:"badge",
condition:"techno-underground badge variant 3",
decision:"Apply badge policy for techno-underground",
role:"background",
policy:"champagne-black",
weight:89
},
{
id:"techno-underground:badge:4",
story:"techno-underground",
principle:"badge",
condition:"techno-underground badge variant 4",
decision:"Apply badge policy for techno-underground",
role:"backgroundSecondary",
policy:"tropical-emerald",
weight:96
},
{
id:"techno-underground:glow:1",
story:"techno-underground",
principle:"glow",
condition:"techno-underground glow variant 1",
decision:"Apply glow policy for techno-underground",
role:"headline",
policy:"rose-glamour",
weight:72
},
{
id:"techno-underground:glow:2",
story:"techno-underground",
principle:"glow",
condition:"techno-underground glow variant 2",
decision:"Apply glow policy for techno-underground",
role:"accent",
policy:"sunset-warm",
weight:79
},
{
id:"techno-underground:glow:3",
story:"techno-underground",
principle:"glow",
condition:"techno-underground glow variant 3",
decision:"Apply glow policy for techno-underground",
role:"metadata",
policy:"burgundy-intimate",
weight:86
},
{
id:"techno-underground:glow:4",
story:"techno-underground",
principle:"glow",
condition:"techno-underground glow variant 4",
decision:"Apply glow policy for techno-underground",
role:"dateTime",
policy:"electric-night",
weight:93
},
{
id:"techno-underground:cast:1",
story:"techno-underground",
principle:"cast",
condition:"techno-underground cast variant 1",
decision:"Apply cast policy for techno-underground",
role:"venue",
policy:"industrial-monochrome",
weight:100
},
{
id:"techno-underground:cast:2",
story:"techno-underground",
principle:"cast",
condition:"techno-underground cast variant 2",
decision:"Apply cast policy for techno-underground",
role:"badgeBackground",
policy:"retro-pop",
weight:76
},
{
id:"techno-underground:cast:3",
story:"techno-underground",
principle:"cast",
condition:"techno-underground cast variant 3",
decision:"Apply cast policy for techno-underground",
role:"badgeText",
policy:"neutral-editorial",
weight:83
},
{
id:"techno-underground:cast:4",
story:"techno-underground",
principle:"cast",
condition:"techno-underground cast variant 4",
decision:"Apply cast policy for techno-underground",
role:"presenter",
policy:"image-led",
weight:90
},
{
id:"techno-underground:brand:1",
story:"techno-underground",
principle:"brand",
condition:"techno-underground brand variant 1",
decision:"Apply brand policy for techno-underground",
role:"footer",
policy:"warm-premium",
weight:97
},
{
id:"techno-underground:brand:2",
story:"techno-underground",
principle:"brand",
condition:"techno-underground brand variant 2",
decision:"Apply brand policy for techno-underground",
role:"stroke",
policy:"champagne-black",
weight:73
},
{
id:"techno-underground:brand:3",
story:"techno-underground",
principle:"brand",
condition:"techno-underground brand variant 3",
decision:"Apply brand policy for techno-underground",
role:"glow",
policy:"tropical-emerald",
weight:80
},
{
id:"techno-underground:brand:4",
story:"techno-underground",
principle:"brand",
condition:"techno-underground brand variant 4",
decision:"Apply brand policy for techno-underground",
role:"neutral",
policy:"rose-glamour",
weight:87
},
{
id:"techno-underground:export:1",
story:"techno-underground",
principle:"export",
condition:"techno-underground export variant 1",
decision:"Apply export policy for techno-underground",
role:"utility",
policy:"sunset-warm",
weight:94
},
{
id:"techno-underground:export:2",
story:"techno-underground",
principle:"export",
condition:"techno-underground export variant 2",
decision:"Apply export policy for techno-underground",
role:"background",
policy:"burgundy-intimate",
weight:70
},
{
id:"techno-underground:export:3",
story:"techno-underground",
principle:"export",
condition:"techno-underground export variant 3",
decision:"Apply export policy for techno-underground",
role:"backgroundSecondary",
policy:"electric-night",
weight:77
},
{
id:"techno-underground:export:4",
story:"techno-underground",
principle:"export",
condition:"techno-underground export variant 4",
decision:"Apply export policy for techno-underground",
role:"headline",
policy:"industrial-monochrome",
weight:84
},
{
id:"techno-underground:accessibility:1",
story:"techno-underground",
principle:"accessibility",
condition:"techno-underground accessibility variant 1",
decision:"Apply accessibility policy for techno-underground",
role:"accent",
policy:"retro-pop",
weight:91
},
{
id:"techno-underground:accessibility:2",
story:"techno-underground",
principle:"accessibility",
condition:"techno-underground accessibility variant 2",
decision:"Apply accessibility policy for techno-underground",
role:"metadata",
policy:"neutral-editorial",
weight:98
},
{
id:"techno-underground:accessibility:3",
story:"techno-underground",
principle:"accessibility",
condition:"techno-underground accessibility variant 3",
decision:"Apply accessibility policy for techno-underground",
role:"dateTime",
policy:"image-led",
weight:74
},
{
id:"techno-underground:accessibility:4",
story:"techno-underground",
principle:"accessibility",
condition:"techno-underground accessibility variant 4",
decision:"Apply accessibility policy for techno-underground",
role:"venue",
policy:"warm-premium",
weight:81
},
{
id:"editorial-fashion:dominant:1",
story:"editorial-fashion",
principle:"dominant",
condition:"editorial-fashion dominant variant 1",
decision:"Apply dominant policy for editorial-fashion",
role:"badgeBackground",
policy:"champagne-black",
weight:88
},
{
id:"editorial-fashion:dominant:2",
story:"editorial-fashion",
principle:"dominant",
condition:"editorial-fashion dominant variant 2",
decision:"Apply dominant policy for editorial-fashion",
role:"badgeText",
policy:"tropical-emerald",
weight:95
},
{
id:"editorial-fashion:dominant:3",
story:"editorial-fashion",
principle:"dominant",
condition:"editorial-fashion dominant variant 3",
decision:"Apply dominant policy for editorial-fashion",
role:"presenter",
policy:"rose-glamour",
weight:71
},
{
id:"editorial-fashion:dominant:4",
story:"editorial-fashion",
principle:"dominant",
condition:"editorial-fashion dominant variant 4",
decision:"Apply dominant policy for editorial-fashion",
role:"footer",
policy:"sunset-warm",
weight:78
},
{
id:"editorial-fashion:support:1",
story:"editorial-fashion",
principle:"support",
condition:"editorial-fashion support variant 1",
decision:"Apply support policy for editorial-fashion",
role:"stroke",
policy:"burgundy-intimate",
weight:85
},
{
id:"editorial-fashion:support:2",
story:"editorial-fashion",
principle:"support",
condition:"editorial-fashion support variant 2",
decision:"Apply support policy for editorial-fashion",
role:"glow",
policy:"electric-night",
weight:92
},
{
id:"editorial-fashion:support:3",
story:"editorial-fashion",
principle:"support",
condition:"editorial-fashion support variant 3",
decision:"Apply support policy for editorial-fashion",
role:"neutral",
policy:"industrial-monochrome",
weight:99
},
{
id:"editorial-fashion:support:4",
story:"editorial-fashion",
principle:"support",
condition:"editorial-fashion support variant 4",
decision:"Apply support policy for editorial-fashion",
role:"utility",
policy:"retro-pop",
weight:75
},
{
id:"editorial-fashion:accent:1",
story:"editorial-fashion",
principle:"accent",
condition:"editorial-fashion accent variant 1",
decision:"Apply accent policy for editorial-fashion",
role:"background",
policy:"neutral-editorial",
weight:82
},
{
id:"editorial-fashion:accent:2",
story:"editorial-fashion",
principle:"accent",
condition:"editorial-fashion accent variant 2",
decision:"Apply accent policy for editorial-fashion",
role:"backgroundSecondary",
policy:"image-led",
weight:89
},
{
id:"editorial-fashion:accent:3",
story:"editorial-fashion",
principle:"accent",
condition:"editorial-fashion accent variant 3",
decision:"Apply accent policy for editorial-fashion",
role:"headline",
policy:"warm-premium",
weight:96
},
{
id:"editorial-fashion:accent:4",
story:"editorial-fashion",
principle:"accent",
condition:"editorial-fashion accent variant 4",
decision:"Apply accent policy for editorial-fashion",
role:"accent",
policy:"champagne-black",
weight:72
},
{
id:"editorial-fashion:neutral:1",
story:"editorial-fashion",
principle:"neutral",
condition:"editorial-fashion neutral variant 1",
decision:"Apply neutral policy for editorial-fashion",
role:"metadata",
policy:"tropical-emerald",
weight:79
},
{
id:"editorial-fashion:neutral:2",
story:"editorial-fashion",
principle:"neutral",
condition:"editorial-fashion neutral variant 2",
decision:"Apply neutral policy for editorial-fashion",
role:"dateTime",
policy:"rose-glamour",
weight:86
},
{
id:"editorial-fashion:neutral:3",
story:"editorial-fashion",
principle:"neutral",
condition:"editorial-fashion neutral variant 3",
decision:"Apply neutral policy for editorial-fashion",
role:"venue",
policy:"sunset-warm",
weight:93
},
{
id:"editorial-fashion:neutral:4",
story:"editorial-fashion",
principle:"neutral",
condition:"editorial-fashion neutral variant 4",
decision:"Apply neutral policy for editorial-fashion",
role:"badgeBackground",
policy:"burgundy-intimate",
weight:100
},
{
id:"editorial-fashion:contrast:1",
story:"editorial-fashion",
principle:"contrast",
condition:"editorial-fashion contrast variant 1",
decision:"Apply contrast policy for editorial-fashion",
role:"badgeText",
policy:"electric-night",
weight:76
},
{
id:"editorial-fashion:contrast:2",
story:"editorial-fashion",
principle:"contrast",
condition:"editorial-fashion contrast variant 2",
decision:"Apply contrast policy for editorial-fashion",
role:"presenter",
policy:"industrial-monochrome",
weight:83
},
{
id:"editorial-fashion:contrast:3",
story:"editorial-fashion",
principle:"contrast",
condition:"editorial-fashion contrast variant 3",
decision:"Apply contrast policy for editorial-fashion",
role:"footer",
policy:"retro-pop",
weight:90
},
{
id:"editorial-fashion:contrast:4",
story:"editorial-fashion",
principle:"contrast",
condition:"editorial-fashion contrast variant 4",
decision:"Apply contrast policy for editorial-fashion",
role:"stroke",
policy:"neutral-editorial",
weight:97
},
{
id:"editorial-fashion:skin:1",
story:"editorial-fashion",
principle:"skin",
condition:"editorial-fashion skin variant 1",
decision:"Apply skin policy for editorial-fashion",
role:"glow",
policy:"image-led",
weight:73
},
{
id:"editorial-fashion:skin:2",
story:"editorial-fashion",
principle:"skin",
condition:"editorial-fashion skin variant 2",
decision:"Apply skin policy for editorial-fashion",
role:"neutral",
policy:"warm-premium",
weight:80
},
{
id:"editorial-fashion:skin:3",
story:"editorial-fashion",
principle:"skin",
condition:"editorial-fashion skin variant 3",
decision:"Apply skin policy for editorial-fashion",
role:"utility",
policy:"champagne-black",
weight:87
},
{
id:"editorial-fashion:skin:4",
story:"editorial-fashion",
principle:"skin",
condition:"editorial-fashion skin variant 4",
decision:"Apply skin policy for editorial-fashion",
role:"background",
policy:"tropical-emerald",
weight:94
},
{
id:"editorial-fashion:saturation:1",
story:"editorial-fashion",
principle:"saturation",
condition:"editorial-fashion saturation variant 1",
decision:"Apply saturation policy for editorial-fashion",
role:"backgroundSecondary",
policy:"rose-glamour",
weight:70
},
{
id:"editorial-fashion:saturation:2",
story:"editorial-fashion",
principle:"saturation",
condition:"editorial-fashion saturation variant 2",
decision:"Apply saturation policy for editorial-fashion",
role:"headline",
policy:"sunset-warm",
weight:77
},
{
id:"editorial-fashion:saturation:3",
story:"editorial-fashion",
principle:"saturation",
condition:"editorial-fashion saturation variant 3",
decision:"Apply saturation policy for editorial-fashion",
role:"accent",
policy:"burgundy-intimate",
weight:84
},
{
id:"editorial-fashion:saturation:4",
story:"editorial-fashion",
principle:"saturation",
condition:"editorial-fashion saturation variant 4",
decision:"Apply saturation policy for editorial-fashion",
role:"metadata",
policy:"electric-night",
weight:91
},
{
id:"editorial-fashion:harmony:1",
story:"editorial-fashion",
principle:"harmony",
condition:"editorial-fashion harmony variant 1",
decision:"Apply harmony policy for editorial-fashion",
role:"dateTime",
policy:"industrial-monochrome",
weight:98
},
{
id:"editorial-fashion:harmony:2",
story:"editorial-fashion",
principle:"harmony",
condition:"editorial-fashion harmony variant 2",
decision:"Apply harmony policy for editorial-fashion",
role:"venue",
policy:"retro-pop",
weight:74
},
{
id:"editorial-fashion:harmony:3",
story:"editorial-fashion",
principle:"harmony",
condition:"editorial-fashion harmony variant 3",
decision:"Apply harmony policy for editorial-fashion",
role:"badgeBackground",
policy:"neutral-editorial",
weight:81
},
{
id:"editorial-fashion:harmony:4",
story:"editorial-fashion",
principle:"harmony",
condition:"editorial-fashion harmony variant 4",
decision:"Apply harmony policy for editorial-fashion",
role:"badgeText",
policy:"image-led",
weight:88
},
{
id:"editorial-fashion:temperature:1",
story:"editorial-fashion",
principle:"temperature",
condition:"editorial-fashion temperature variant 1",
decision:"Apply temperature policy for editorial-fashion",
role:"presenter",
policy:"warm-premium",
weight:95
},
{
id:"editorial-fashion:temperature:2",
story:"editorial-fashion",
principle:"temperature",
condition:"editorial-fashion temperature variant 2",
decision:"Apply temperature policy for editorial-fashion",
role:"footer",
policy:"champagne-black",
weight:71
},
{
id:"editorial-fashion:temperature:3",
story:"editorial-fashion",
principle:"temperature",
condition:"editorial-fashion temperature variant 3",
decision:"Apply temperature policy for editorial-fashion",
role:"stroke",
policy:"tropical-emerald",
weight:78
},
{
id:"editorial-fashion:temperature:4",
story:"editorial-fashion",
principle:"temperature",
condition:"editorial-fashion temperature variant 4",
decision:"Apply temperature policy for editorial-fashion",
role:"glow",
policy:"rose-glamour",
weight:85
},
{
id:"editorial-fashion:background:1",
story:"editorial-fashion",
principle:"background",
condition:"editorial-fashion background variant 1",
decision:"Apply background policy for editorial-fashion",
role:"neutral",
policy:"sunset-warm",
weight:92
},
{
id:"editorial-fashion:background:2",
story:"editorial-fashion",
principle:"background",
condition:"editorial-fashion background variant 2",
decision:"Apply background policy for editorial-fashion",
role:"utility",
policy:"burgundy-intimate",
weight:99
},
{
id:"editorial-fashion:background:3",
story:"editorial-fashion",
principle:"background",
condition:"editorial-fashion background variant 3",
decision:"Apply background policy for editorial-fashion",
role:"background",
policy:"electric-night",
weight:75
},
{
id:"editorial-fashion:background:4",
story:"editorial-fashion",
principle:"background",
condition:"editorial-fashion background variant 4",
decision:"Apply background policy for editorial-fashion",
role:"backgroundSecondary",
policy:"industrial-monochrome",
weight:82
},
{
id:"editorial-fashion:headline:1",
story:"editorial-fashion",
principle:"headline",
condition:"editorial-fashion headline variant 1",
decision:"Apply headline policy for editorial-fashion",
role:"headline",
policy:"retro-pop",
weight:89
},
{
id:"editorial-fashion:headline:2",
story:"editorial-fashion",
principle:"headline",
condition:"editorial-fashion headline variant 2",
decision:"Apply headline policy for editorial-fashion",
role:"accent",
policy:"neutral-editorial",
weight:96
},
{
id:"editorial-fashion:headline:3",
story:"editorial-fashion",
principle:"headline",
condition:"editorial-fashion headline variant 3",
decision:"Apply headline policy for editorial-fashion",
role:"metadata",
policy:"image-led",
weight:72
},
{
id:"editorial-fashion:headline:4",
story:"editorial-fashion",
principle:"headline",
condition:"editorial-fashion headline variant 4",
decision:"Apply headline policy for editorial-fashion",
role:"dateTime",
policy:"warm-premium",
weight:79
},
{
id:"editorial-fashion:metadata:1",
story:"editorial-fashion",
principle:"metadata",
condition:"editorial-fashion metadata variant 1",
decision:"Apply metadata policy for editorial-fashion",
role:"venue",
policy:"champagne-black",
weight:86
},
{
id:"editorial-fashion:metadata:2",
story:"editorial-fashion",
principle:"metadata",
condition:"editorial-fashion metadata variant 2",
decision:"Apply metadata policy for editorial-fashion",
role:"badgeBackground",
policy:"tropical-emerald",
weight:93
},
{
id:"editorial-fashion:metadata:3",
story:"editorial-fashion",
principle:"metadata",
condition:"editorial-fashion metadata variant 3",
decision:"Apply metadata policy for editorial-fashion",
role:"badgeText",
policy:"rose-glamour",
weight:100
},
{
id:"editorial-fashion:metadata:4",
story:"editorial-fashion",
principle:"metadata",
condition:"editorial-fashion metadata variant 4",
decision:"Apply metadata policy for editorial-fashion",
role:"presenter",
policy:"sunset-warm",
weight:76
},
{
id:"editorial-fashion:badge:1",
story:"editorial-fashion",
principle:"badge",
condition:"editorial-fashion badge variant 1",
decision:"Apply badge policy for editorial-fashion",
role:"footer",
policy:"burgundy-intimate",
weight:83
},
{
id:"editorial-fashion:badge:2",
story:"editorial-fashion",
principle:"badge",
condition:"editorial-fashion badge variant 2",
decision:"Apply badge policy for editorial-fashion",
role:"stroke",
policy:"electric-night",
weight:90
},
{
id:"editorial-fashion:badge:3",
story:"editorial-fashion",
principle:"badge",
condition:"editorial-fashion badge variant 3",
decision:"Apply badge policy for editorial-fashion",
role:"glow",
policy:"industrial-monochrome",
weight:97
},
{
id:"editorial-fashion:badge:4",
story:"editorial-fashion",
principle:"badge",
condition:"editorial-fashion badge variant 4",
decision:"Apply badge policy for editorial-fashion",
role:"neutral",
policy:"retro-pop",
weight:73
},
{
id:"editorial-fashion:glow:1",
story:"editorial-fashion",
principle:"glow",
condition:"editorial-fashion glow variant 1",
decision:"Apply glow policy for editorial-fashion",
role:"utility",
policy:"neutral-editorial",
weight:80
},
{
id:"editorial-fashion:glow:2",
story:"editorial-fashion",
principle:"glow",
condition:"editorial-fashion glow variant 2",
decision:"Apply glow policy for editorial-fashion",
role:"background",
policy:"image-led",
weight:87
},
{
id:"editorial-fashion:glow:3",
story:"editorial-fashion",
principle:"glow",
condition:"editorial-fashion glow variant 3",
decision:"Apply glow policy for editorial-fashion",
role:"backgroundSecondary",
policy:"warm-premium",
weight:94
},
{
id:"editorial-fashion:glow:4",
story:"editorial-fashion",
principle:"glow",
condition:"editorial-fashion glow variant 4",
decision:"Apply glow policy for editorial-fashion",
role:"headline",
policy:"champagne-black",
weight:70
},
{
id:"editorial-fashion:cast:1",
story:"editorial-fashion",
principle:"cast",
condition:"editorial-fashion cast variant 1",
decision:"Apply cast policy for editorial-fashion",
role:"accent",
policy:"tropical-emerald",
weight:77
},
{
id:"editorial-fashion:cast:2",
story:"editorial-fashion",
principle:"cast",
condition:"editorial-fashion cast variant 2",
decision:"Apply cast policy for editorial-fashion",
role:"metadata",
policy:"rose-glamour",
weight:84
},
{
id:"editorial-fashion:cast:3",
story:"editorial-fashion",
principle:"cast",
condition:"editorial-fashion cast variant 3",
decision:"Apply cast policy for editorial-fashion",
role:"dateTime",
policy:"sunset-warm",
weight:91
},
{
id:"editorial-fashion:cast:4",
story:"editorial-fashion",
principle:"cast",
condition:"editorial-fashion cast variant 4",
decision:"Apply cast policy for editorial-fashion",
role:"venue",
policy:"burgundy-intimate",
weight:98
},
{
id:"editorial-fashion:brand:1",
story:"editorial-fashion",
principle:"brand",
condition:"editorial-fashion brand variant 1",
decision:"Apply brand policy for editorial-fashion",
role:"badgeBackground",
policy:"electric-night",
weight:74
},
{
id:"editorial-fashion:brand:2",
story:"editorial-fashion",
principle:"brand",
condition:"editorial-fashion brand variant 2",
decision:"Apply brand policy for editorial-fashion",
role:"badgeText",
policy:"industrial-monochrome",
weight:81
},
{
id:"editorial-fashion:brand:3",
story:"editorial-fashion",
principle:"brand",
condition:"editorial-fashion brand variant 3",
decision:"Apply brand policy for editorial-fashion",
role:"presenter",
policy:"retro-pop",
weight:88
},
{
id:"editorial-fashion:brand:4",
story:"editorial-fashion",
principle:"brand",
condition:"editorial-fashion brand variant 4",
decision:"Apply brand policy for editorial-fashion",
role:"footer",
policy:"neutral-editorial",
weight:95
},
{
id:"editorial-fashion:export:1",
story:"editorial-fashion",
principle:"export",
condition:"editorial-fashion export variant 1",
decision:"Apply export policy for editorial-fashion",
role:"stroke",
policy:"image-led",
weight:71
},
{
id:"editorial-fashion:export:2",
story:"editorial-fashion",
principle:"export",
condition:"editorial-fashion export variant 2",
decision:"Apply export policy for editorial-fashion",
role:"glow",
policy:"warm-premium",
weight:78
},
{
id:"editorial-fashion:export:3",
story:"editorial-fashion",
principle:"export",
condition:"editorial-fashion export variant 3",
decision:"Apply export policy for editorial-fashion",
role:"neutral",
policy:"champagne-black",
weight:85
},
{
id:"editorial-fashion:export:4",
story:"editorial-fashion",
principle:"export",
condition:"editorial-fashion export variant 4",
decision:"Apply export policy for editorial-fashion",
role:"utility",
policy:"tropical-emerald",
weight:92
},
{
id:"editorial-fashion:accessibility:1",
story:"editorial-fashion",
principle:"accessibility",
condition:"editorial-fashion accessibility variant 1",
decision:"Apply accessibility policy for editorial-fashion",
role:"background",
policy:"rose-glamour",
weight:99
},
{
id:"editorial-fashion:accessibility:2",
story:"editorial-fashion",
principle:"accessibility",
condition:"editorial-fashion accessibility variant 2",
decision:"Apply accessibility policy for editorial-fashion",
role:"backgroundSecondary",
policy:"sunset-warm",
weight:75
},
{
id:"editorial-fashion:accessibility:3",
story:"editorial-fashion",
principle:"accessibility",
condition:"editorial-fashion accessibility variant 3",
decision:"Apply accessibility policy for editorial-fashion",
role:"headline",
policy:"burgundy-intimate",
weight:82
},
{
id:"editorial-fashion:accessibility:4",
story:"editorial-fashion",
principle:"accessibility",
condition:"editorial-fashion accessibility variant 4",
decision:"Apply accessibility policy for editorial-fashion",
role:"accent",
policy:"electric-night",
weight:89
},
{
id:"general-nightlife:dominant:1",
story:"general-nightlife",
principle:"dominant",
condition:"general-nightlife dominant variant 1",
decision:"Apply dominant policy for general-nightlife",
role:"metadata",
policy:"industrial-monochrome",
weight:96
},
{
id:"general-nightlife:dominant:2",
story:"general-nightlife",
principle:"dominant",
condition:"general-nightlife dominant variant 2",
decision:"Apply dominant policy for general-nightlife",
role:"dateTime",
policy:"retro-pop",
weight:72
},
{
id:"general-nightlife:dominant:3",
story:"general-nightlife",
principle:"dominant",
condition:"general-nightlife dominant variant 3",
decision:"Apply dominant policy for general-nightlife",
role:"venue",
policy:"neutral-editorial",
weight:79
},
{
id:"general-nightlife:dominant:4",
story:"general-nightlife",
principle:"dominant",
condition:"general-nightlife dominant variant 4",
decision:"Apply dominant policy for general-nightlife",
role:"badgeBackground",
policy:"image-led",
weight:86
},
{
id:"general-nightlife:support:1",
story:"general-nightlife",
principle:"support",
condition:"general-nightlife support variant 1",
decision:"Apply support policy for general-nightlife",
role:"badgeText",
policy:"warm-premium",
weight:93
},
{
id:"general-nightlife:support:2",
story:"general-nightlife",
principle:"support",
condition:"general-nightlife support variant 2",
decision:"Apply support policy for general-nightlife",
role:"presenter",
policy:"champagne-black",
weight:100
},
{
id:"general-nightlife:support:3",
story:"general-nightlife",
principle:"support",
condition:"general-nightlife support variant 3",
decision:"Apply support policy for general-nightlife",
role:"footer",
policy:"tropical-emerald",
weight:76
},
{
id:"general-nightlife:support:4",
story:"general-nightlife",
principle:"support",
condition:"general-nightlife support variant 4",
decision:"Apply support policy for general-nightlife",
role:"stroke",
policy:"rose-glamour",
weight:83
},
{
id:"general-nightlife:accent:1",
story:"general-nightlife",
principle:"accent",
condition:"general-nightlife accent variant 1",
decision:"Apply accent policy for general-nightlife",
role:"glow",
policy:"sunset-warm",
weight:90
},
{
id:"general-nightlife:accent:2",
story:"general-nightlife",
principle:"accent",
condition:"general-nightlife accent variant 2",
decision:"Apply accent policy for general-nightlife",
role:"neutral",
policy:"burgundy-intimate",
weight:97
},
{
id:"general-nightlife:accent:3",
story:"general-nightlife",
principle:"accent",
condition:"general-nightlife accent variant 3",
decision:"Apply accent policy for general-nightlife",
role:"utility",
policy:"electric-night",
weight:73
},
{
id:"general-nightlife:accent:4",
story:"general-nightlife",
principle:"accent",
condition:"general-nightlife accent variant 4",
decision:"Apply accent policy for general-nightlife",
role:"background",
policy:"industrial-monochrome",
weight:80
},
{
id:"general-nightlife:neutral:1",
story:"general-nightlife",
principle:"neutral",
condition:"general-nightlife neutral variant 1",
decision:"Apply neutral policy for general-nightlife",
role:"backgroundSecondary",
policy:"retro-pop",
weight:87
},
{
id:"general-nightlife:neutral:2",
story:"general-nightlife",
principle:"neutral",
condition:"general-nightlife neutral variant 2",
decision:"Apply neutral policy for general-nightlife",
role:"headline",
policy:"neutral-editorial",
weight:94
},
{
id:"general-nightlife:neutral:3",
story:"general-nightlife",
principle:"neutral",
condition:"general-nightlife neutral variant 3",
decision:"Apply neutral policy for general-nightlife",
role:"accent",
policy:"image-led",
weight:70
},
{
id:"general-nightlife:neutral:4",
story:"general-nightlife",
principle:"neutral",
condition:"general-nightlife neutral variant 4",
decision:"Apply neutral policy for general-nightlife",
role:"metadata",
policy:"warm-premium",
weight:77
},
{
id:"general-nightlife:contrast:1",
story:"general-nightlife",
principle:"contrast",
condition:"general-nightlife contrast variant 1",
decision:"Apply contrast policy for general-nightlife",
role:"dateTime",
policy:"champagne-black",
weight:84
},
{
id:"general-nightlife:contrast:2",
story:"general-nightlife",
principle:"contrast",
condition:"general-nightlife contrast variant 2",
decision:"Apply contrast policy for general-nightlife",
role:"venue",
policy:"tropical-emerald",
weight:91
},
{
id:"general-nightlife:contrast:3",
story:"general-nightlife",
principle:"contrast",
condition:"general-nightlife contrast variant 3",
decision:"Apply contrast policy for general-nightlife",
role:"badgeBackground",
policy:"rose-glamour",
weight:98
},
{
id:"general-nightlife:contrast:4",
story:"general-nightlife",
principle:"contrast",
condition:"general-nightlife contrast variant 4",
decision:"Apply contrast policy for general-nightlife",
role:"badgeText",
policy:"sunset-warm",
weight:74
},
{
id:"general-nightlife:skin:1",
story:"general-nightlife",
principle:"skin",
condition:"general-nightlife skin variant 1",
decision:"Apply skin policy for general-nightlife",
role:"presenter",
policy:"burgundy-intimate",
weight:81
},
{
id:"general-nightlife:skin:2",
story:"general-nightlife",
principle:"skin",
condition:"general-nightlife skin variant 2",
decision:"Apply skin policy for general-nightlife",
role:"footer",
policy:"electric-night",
weight:88
},
{
id:"general-nightlife:skin:3",
story:"general-nightlife",
principle:"skin",
condition:"general-nightlife skin variant 3",
decision:"Apply skin policy for general-nightlife",
role:"stroke",
policy:"industrial-monochrome",
weight:95
},
{
id:"general-nightlife:skin:4",
story:"general-nightlife",
principle:"skin",
condition:"general-nightlife skin variant 4",
decision:"Apply skin policy for general-nightlife",
role:"glow",
policy:"retro-pop",
weight:71
},
{
id:"general-nightlife:saturation:1",
story:"general-nightlife",
principle:"saturation",
condition:"general-nightlife saturation variant 1",
decision:"Apply saturation policy for general-nightlife",
role:"neutral",
policy:"neutral-editorial",
weight:78
},
{
id:"general-nightlife:saturation:2",
story:"general-nightlife",
principle:"saturation",
condition:"general-nightlife saturation variant 2",
decision:"Apply saturation policy for general-nightlife",
role:"utility",
policy:"image-led",
weight:85
},
{
id:"general-nightlife:saturation:3",
story:"general-nightlife",
principle:"saturation",
condition:"general-nightlife saturation variant 3",
decision:"Apply saturation policy for general-nightlife",
role:"background",
policy:"warm-premium",
weight:92
},
{
id:"general-nightlife:saturation:4",
story:"general-nightlife",
principle:"saturation",
condition:"general-nightlife saturation variant 4",
decision:"Apply saturation policy for general-nightlife",
role:"backgroundSecondary",
policy:"champagne-black",
weight:99
},
{
id:"general-nightlife:harmony:1",
story:"general-nightlife",
principle:"harmony",
condition:"general-nightlife harmony variant 1",
decision:"Apply harmony policy for general-nightlife",
role:"headline",
policy:"tropical-emerald",
weight:75
},
{
id:"general-nightlife:harmony:2",
story:"general-nightlife",
principle:"harmony",
condition:"general-nightlife harmony variant 2",
decision:"Apply harmony policy for general-nightlife",
role:"accent",
policy:"rose-glamour",
weight:82
},
{
id:"general-nightlife:harmony:3",
story:"general-nightlife",
principle:"harmony",
condition:"general-nightlife harmony variant 3",
decision:"Apply harmony policy for general-nightlife",
role:"metadata",
policy:"sunset-warm",
weight:89
},
{
id:"general-nightlife:harmony:4",
story:"general-nightlife",
principle:"harmony",
condition:"general-nightlife harmony variant 4",
decision:"Apply harmony policy for general-nightlife",
role:"dateTime",
policy:"burgundy-intimate",
weight:96
},
{
id:"general-nightlife:temperature:1",
story:"general-nightlife",
principle:"temperature",
condition:"general-nightlife temperature variant 1",
decision:"Apply temperature policy for general-nightlife",
role:"venue",
policy:"electric-night",
weight:72
},
{
id:"general-nightlife:temperature:2",
story:"general-nightlife",
principle:"temperature",
condition:"general-nightlife temperature variant 2",
decision:"Apply temperature policy for general-nightlife",
role:"badgeBackground",
policy:"industrial-monochrome",
weight:79
},
{
id:"general-nightlife:temperature:3",
story:"general-nightlife",
principle:"temperature",
condition:"general-nightlife temperature variant 3",
decision:"Apply temperature policy for general-nightlife",
role:"badgeText",
policy:"retro-pop",
weight:86
},
{
id:"general-nightlife:temperature:4",
story:"general-nightlife",
principle:"temperature",
condition:"general-nightlife temperature variant 4",
decision:"Apply temperature policy for general-nightlife",
role:"presenter",
policy:"neutral-editorial",
weight:93
},
{
id:"general-nightlife:background:1",
story:"general-nightlife",
principle:"background",
condition:"general-nightlife background variant 1",
decision:"Apply background policy for general-nightlife",
role:"footer",
policy:"image-led",
weight:100
},
{
id:"general-nightlife:background:2",
story:"general-nightlife",
principle:"background",
condition:"general-nightlife background variant 2",
decision:"Apply background policy for general-nightlife",
role:"stroke",
policy:"warm-premium",
weight:76
},
{
id:"general-nightlife:background:3",
story:"general-nightlife",
principle:"background",
condition:"general-nightlife background variant 3",
decision:"Apply background policy for general-nightlife",
role:"glow",
policy:"champagne-black",
weight:83
},
{
id:"general-nightlife:background:4",
story:"general-nightlife",
principle:"background",
condition:"general-nightlife background variant 4",
decision:"Apply background policy for general-nightlife",
role:"neutral",
policy:"tropical-emerald",
weight:90
},
{
id:"general-nightlife:headline:1",
story:"general-nightlife",
principle:"headline",
condition:"general-nightlife headline variant 1",
decision:"Apply headline policy for general-nightlife",
role:"utility",
policy:"rose-glamour",
weight:97
},
{
id:"general-nightlife:headline:2",
story:"general-nightlife",
principle:"headline",
condition:"general-nightlife headline variant 2",
decision:"Apply headline policy for general-nightlife",
role:"background",
policy:"sunset-warm",
weight:73
},
{
id:"general-nightlife:headline:3",
story:"general-nightlife",
principle:"headline",
condition:"general-nightlife headline variant 3",
decision:"Apply headline policy for general-nightlife",
role:"backgroundSecondary",
policy:"burgundy-intimate",
weight:80
},
{
id:"general-nightlife:headline:4",
story:"general-nightlife",
principle:"headline",
condition:"general-nightlife headline variant 4",
decision:"Apply headline policy for general-nightlife",
role:"headline",
policy:"electric-night",
weight:87
},
{
id:"general-nightlife:metadata:1",
story:"general-nightlife",
principle:"metadata",
condition:"general-nightlife metadata variant 1",
decision:"Apply metadata policy for general-nightlife",
role:"accent",
policy:"industrial-monochrome",
weight:94
},
{
id:"general-nightlife:metadata:2",
story:"general-nightlife",
principle:"metadata",
condition:"general-nightlife metadata variant 2",
decision:"Apply metadata policy for general-nightlife",
role:"metadata",
policy:"retro-pop",
weight:70
},
{
id:"general-nightlife:metadata:3",
story:"general-nightlife",
principle:"metadata",
condition:"general-nightlife metadata variant 3",
decision:"Apply metadata policy for general-nightlife",
role:"dateTime",
policy:"neutral-editorial",
weight:77
},
{
id:"general-nightlife:metadata:4",
story:"general-nightlife",
principle:"metadata",
condition:"general-nightlife metadata variant 4",
decision:"Apply metadata policy for general-nightlife",
role:"venue",
policy:"image-led",
weight:84
},
{
id:"general-nightlife:badge:1",
story:"general-nightlife",
principle:"badge",
condition:"general-nightlife badge variant 1",
decision:"Apply badge policy for general-nightlife",
role:"badgeBackground",
policy:"warm-premium",
weight:91
},
{
id:"general-nightlife:badge:2",
story:"general-nightlife",
principle:"badge",
condition:"general-nightlife badge variant 2",
decision:"Apply badge policy for general-nightlife",
role:"badgeText",
policy:"champagne-black",
weight:98
},
{
id:"general-nightlife:badge:3",
story:"general-nightlife",
principle:"badge",
condition:"general-nightlife badge variant 3",
decision:"Apply badge policy for general-nightlife",
role:"presenter",
policy:"tropical-emerald",
weight:74
},
{
id:"general-nightlife:badge:4",
story:"general-nightlife",
principle:"badge",
condition:"general-nightlife badge variant 4",
decision:"Apply badge policy for general-nightlife",
role:"footer",
policy:"rose-glamour",
weight:81
},
{
id:"general-nightlife:glow:1",
story:"general-nightlife",
principle:"glow",
condition:"general-nightlife glow variant 1",
decision:"Apply glow policy for general-nightlife",
role:"stroke",
policy:"sunset-warm",
weight:88
},
{
id:"general-nightlife:glow:2",
story:"general-nightlife",
principle:"glow",
condition:"general-nightlife glow variant 2",
decision:"Apply glow policy for general-nightlife",
role:"glow",
policy:"burgundy-intimate",
weight:95
},
{
id:"general-nightlife:glow:3",
story:"general-nightlife",
principle:"glow",
condition:"general-nightlife glow variant 3",
decision:"Apply glow policy for general-nightlife",
role:"neutral",
policy:"electric-night",
weight:71
},
{
id:"general-nightlife:glow:4",
story:"general-nightlife",
principle:"glow",
condition:"general-nightlife glow variant 4",
decision:"Apply glow policy for general-nightlife",
role:"utility",
policy:"industrial-monochrome",
weight:78
},
{
id:"general-nightlife:cast:1",
story:"general-nightlife",
principle:"cast",
condition:"general-nightlife cast variant 1",
decision:"Apply cast policy for general-nightlife",
role:"background",
policy:"retro-pop",
weight:85
},
{
id:"general-nightlife:cast:2",
story:"general-nightlife",
principle:"cast",
condition:"general-nightlife cast variant 2",
decision:"Apply cast policy for general-nightlife",
role:"backgroundSecondary",
policy:"neutral-editorial",
weight:92
},
{
id:"general-nightlife:cast:3",
story:"general-nightlife",
principle:"cast",
condition:"general-nightlife cast variant 3",
decision:"Apply cast policy for general-nightlife",
role:"headline",
policy:"image-led",
weight:99
},
{
id:"general-nightlife:cast:4",
story:"general-nightlife",
principle:"cast",
condition:"general-nightlife cast variant 4",
decision:"Apply cast policy for general-nightlife",
role:"accent",
policy:"warm-premium",
weight:75
},
{
id:"general-nightlife:brand:1",
story:"general-nightlife",
principle:"brand",
condition:"general-nightlife brand variant 1",
decision:"Apply brand policy for general-nightlife",
role:"metadata",
policy:"champagne-black",
weight:82
},
{
id:"general-nightlife:brand:2",
story:"general-nightlife",
principle:"brand",
condition:"general-nightlife brand variant 2",
decision:"Apply brand policy for general-nightlife",
role:"dateTime",
policy:"tropical-emerald",
weight:89
},
{
id:"general-nightlife:brand:3",
story:"general-nightlife",
principle:"brand",
condition:"general-nightlife brand variant 3",
decision:"Apply brand policy for general-nightlife",
role:"venue",
policy:"rose-glamour",
weight:96
},
{
id:"general-nightlife:brand:4",
story:"general-nightlife",
principle:"brand",
condition:"general-nightlife brand variant 4",
decision:"Apply brand policy for general-nightlife",
role:"badgeBackground",
policy:"sunset-warm",
weight:72
},
{
id:"general-nightlife:export:1",
story:"general-nightlife",
principle:"export",
condition:"general-nightlife export variant 1",
decision:"Apply export policy for general-nightlife",
role:"badgeText",
policy:"burgundy-intimate",
weight:79
},
{
id:"general-nightlife:export:2",
story:"general-nightlife",
principle:"export",
condition:"general-nightlife export variant 2",
decision:"Apply export policy for general-nightlife",
role:"presenter",
policy:"electric-night",
weight:86
},
{
id:"general-nightlife:export:3",
story:"general-nightlife",
principle:"export",
condition:"general-nightlife export variant 3",
decision:"Apply export policy for general-nightlife",
role:"footer",
policy:"industrial-monochrome",
weight:93
},
{
id:"general-nightlife:export:4",
story:"general-nightlife",
principle:"export",
condition:"general-nightlife export variant 4",
decision:"Apply export policy for general-nightlife",
role:"stroke",
policy:"retro-pop",
weight:100
},
{
id:"general-nightlife:accessibility:1",
story:"general-nightlife",
principle:"accessibility",
condition:"general-nightlife accessibility variant 1",
decision:"Apply accessibility policy for general-nightlife",
role:"glow",
policy:"neutral-editorial",
weight:76
},
{
id:"general-nightlife:accessibility:2",
story:"general-nightlife",
principle:"accessibility",
condition:"general-nightlife accessibility variant 2",
decision:"Apply accessibility policy for general-nightlife",
role:"neutral",
policy:"image-led",
weight:83
},
{
id:"general-nightlife:accessibility:3",
story:"general-nightlife",
principle:"accessibility",
condition:"general-nightlife accessibility variant 3",
decision:"Apply accessibility policy for general-nightlife",
role:"utility",
policy:"warm-premium",
weight:90
},
{
id:"general-nightlife:accessibility:4",
story:"general-nightlife",
principle:"accessibility",
condition:"general-nightlife accessibility variant 4",
decision:"Apply accessibility policy for general-nightlife",
role:"background",
policy:"champagne-black",
weight:97
},
];
