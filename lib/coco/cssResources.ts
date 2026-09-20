/** Tokenize large embedded assets without running a regex across megabytes. */
export function tokenizeCssResources(source:string,resources:string[]):string {
  const parts:string[]=[];
  const indices=new Map(resources.map((value,index)=>[value,index]));
  let cursor=0,search=0;
  while(search<source.length){
    const start=source.indexOf('data:',search);
    if(start<0)break;
    const header=/^data:(?:image|font|application)\/[\w.+-]+;base64,/.exec(source.slice(start,start+120));
    if(!header){search=start+5;continue;}
    let end=start+header[0].length;
    const payload=end;
    while(end<source.length){
      const c=source.charCodeAt(end);
      if(!((c>=65&&c<=90)||(c>=97&&c<=122)||(c>=48&&c<=57)||c===43||c===47||c===61))break;
      end++;
    }
    if(end===payload){search=end;continue;}
    const resource=source.slice(start,end);
    let index=indices.get(resource);
    if(index===undefined){index=resources.length;resources.push(resource);indices.set(resource,index);}
    parts.push(source.slice(cursor,start),`__EXISTING_RESOURCE_${index}__`);
    cursor=end;search=end;
  }
  parts.push(source.slice(cursor));
  return parts.join('');
}
