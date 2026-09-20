/** Select the supplied SVG-derived font without flattening editable headline copy. */
export function useOffshoreGlyphs(v) {
  v.headline='oFFSHORE';
  v.headlineFamily='Offshore SVG';
  v.headlineUppercase=false;
  v.headTracking=-.025;
  v.textFx={...v.textFx,uppercase:false,tracking:-.025};
  const documents=[v.cocoCompositionSystem?.compiledDocument,v.cocoCssCompiler?.ir];
  for(const doc of documents){
    const o=doc?.objects?.find(o=>o.id==='headline');
    if(!o)continue;
    o.text=v.headline;
    o.transform={...o.transform,scaleX:.9};
    o.typography={...o.typography,fontFamily:v.headlineFamily,textTransform:'none',letterSpacingEm:v.headTracking};
    o.binding.initial={...o.binding.initial,text:v.headline,family:v.headlineFamily,tracking:v.headTracking};
    for(const run of o.textRuns||[])Object.assign(run,{text:v.headline,fontFamily:v.headlineFamily,runtimeFontFamily:v.headlineFamily});
  }
}
