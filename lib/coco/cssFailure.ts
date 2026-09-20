// Report categories and provider trace metadata, never payloads or credentials.
export function describeCssFailure(error:unknown){
  const chain:Record<string,unknown>[]=[];
  const seen=new Set<unknown>();
  let current=error;
  while(current&&typeof current==='object'&&!seen.has(current)&&chain.length<8){
    seen.add(current);chain.push(current as Record<string,unknown>);current=(current as {cause?:unknown}).cause;
  }
  const messages=chain.map(e=>typeof e.message==='string'?e.message:'');
  const status=chain.map(e=>e.status).find(v=>typeof v==='number'&&Number.isInteger(v)&&v>=400&&v<=599) as number|undefined;
  const codes=chain.map(e=>String(e.code||''));
  const requestId=chain.map(e=>e.request_id??e._request_id).find(v=>typeof v==='string'&&/^req_[a-zA-Z0-9_-]{1,150}$/.test(v)) as string|undefined;
  let reason='An unclassified operation failed. The diagnostic ID identifies its stage.';
  if(status===401)reason='The AI service rejected authentication. Check the server API key.';
  else if(status===403)reason='The AI service denied access to the configured model or project.';
  else if(status===429)reason='The AI service returned HTTP 429: rate limit or quota exceeded.';
  else if(status&&status>=500)reason=`The AI service returned HTTP ${status}.`;
  else if(status)reason=`The AI service rejected the request (HTTP ${status}).`;
  else if(messages.some(m=>/timeout|timed out/i.test(m)))reason='The operation timed out.';
  else if(codes.some(c=>['ECONNRESET','ECONNREFUSED','ENOTFOUND','EAI_AGAIN','ETIMEDOUT'].includes(c))||messages.some(m=>/connection error|fetch failed/i.test(m)))reason='The connection to the AI service failed.';
  else if(messages.some(m=>/extract_area|bad extract area|composite.*dimensions/i.test(m)))reason='A comparison crop is outside the rendered image bounds.';
  else if(chain.some(e=>e.name==='SyntaxError')||messages.some(m=>/JSON/i.test(m)))reason='The AI response could not be parsed as valid JSON.';
  else {
    const known=messages.find(m=>/^(CSS renderer failed|Use |Upload |Each |The model|Missing review|Incomplete |Invalid CSS)/.test(m));
    if(known)reason=known.slice(0,700);
  }
  return {reason,status,requestId};
}
