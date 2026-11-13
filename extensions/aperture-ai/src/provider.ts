// Copyright 2026 Charan Sai Pathuri. MIT License.
export type Message = { role: 'system' | 'user' | 'assistant'; content: string };
export type ModelConfig = { provider: string; endpoint: string; model: string; key?: string };
export function validateEndpoint(raw: string): URL {
 const u = new URL(raw);
 if (u.username || u.password || u.search || u.hash) throw new Error('Use a plain endpoint URL without credentials, query or fragment.');
 const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
 const local = host === 'localhost' || host === '::1' || /^127\.(\d{1,3}\.){2}\d{1,3}$/.test(host) && host.split('.').every(n => Number(n) <= 255);
 if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) throw new Error('Remote providers require HTTPS. HTTP is allowed only on your own machine.');
 return u;
}
export async function streamChat(config: ModelConfig, messages: Message[], signal: AbortSignal, onText: (text: string) => void): Promise<string> {
 if (!config.model.trim()) throw new Error('Connect a model first. Nothing has been sent.');
 const base = validateEndpoint(config.endpoint);
 const ollama = config.provider === 'ollama';
 const path = base.pathname.replace(/\/$/, '');
 base.pathname = ollama ? path + '/api/chat' : path.endsWith('/v1') ? path + '/chat/completions' : path + '/v1/chat/completions';
 const timeout = AbortSignal.timeout(120000);
 const combined = AbortSignal.any([signal, timeout]);
 const response = await fetch(base, {
  method:'POST', redirect:'error', signal:combined,
  headers:{'Content-Type':'application/json',...(config.key ? {Authorization:'Bearer '+config.key} : {})},
  body:JSON.stringify({model:config.model,messages,stream:true,...(!ollama ? {max_tokens:4096} : {})})
 });
 if (!response.ok) throw new Error(`Model request failed (${response.status}). Check endpoint, model and credentials. Response body is not logged.`);
 if (!response.body) throw new Error('Provider returned an empty response.');
 let pending = '', full = ''; const decoder = new TextDecoder();
 const parse = (line: string) => {
  const payload = line.trim().replace(/^data:\s*/, '');
  if (!payload || payload === '[DONE]' || payload.startsWith(':') || payload.startsWith('event:')) return;
  let x: any; try{x=JSON.parse(payload);}catch{return;}
  if (x.error) throw new Error('The model returned an error. Verify that the selected model is available.');
  const part = ollama ? x.message?.content : x.choices?.[0]?.delta?.content;
  if (typeof part === 'string') {full += part; if (full.length > 250000) throw new Error('Response exceeded the safety limit.'); onText(full);}
 };
 const reader = response.body.getReader();
 try {while (true) {const {done,value}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});let index;while((index=pending.indexOf('\n'))>=0){parse(pending.slice(0,index));pending=pending.slice(index+1);}if(pending.length>1000000)throw new Error('Invalid provider stream.');}pending+=decoder.decode();if(pending.trim())parse(pending);}
 finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
 if(!full)throw new Error('No text returned. This model may not support chat streaming.');
 return full;
}
export function firstCodeBlock(text: string): string | undefined {return /```[^\n]*\n([\s\S]*?)```/.exec(text)?.[1];}
export function isSensitivePath(path: string): boolean {return /(?:^|[\\/])(?:\.env(?:\.[^\\/]*)?|\.ssh|\.aws|\.kube|credentials(?:\.json)?|secrets?)(?:[\\/]|$)|\.(?:pem|key|p12|pfx)$/i.test(path);}
