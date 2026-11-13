const assert=require('node:assert/strict'); const http=require('node:http');
const {validateEndpoint,streamChat,firstCodeBlock,isSensitivePath}=require('./provider-check.cjs');
(async()=>{
 let n=0;for(const u of ['https://example.test/v1','http://localhost:11434','http://127.0.0.1:11434','http://[::1]:11434']){assert.ok(validateEndpoint(u));n++;}
 for(const u of ['http://api.example.test','http://127.1.2.999','https://a:b@example.test','https://example.test?key=x','file:///tmp/x']){assert.throws(()=>validateEndpoint(u));n++;}
 for(const f of ['x/.env','x/.ssh/id_rsa','x/cert.key']){assert.equal(isSensitivePath(f),true);n++;}assert.equal(isSensitivePath('/tmp/test.ts'),false);n++;
 assert.equal(firstCodeBlock('hello\n```ts\nconst a=1;\n```'),'const a=1;\n');n++;
 let requests=[];const server=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;requests.push({url:req.url,body:JSON.parse(body)});res.writeHead(200,{'content-type':'text/event-stream'});if(req.url==='/api/chat'){res.write('{"message":{"content":"hello "}}\n');res.end('{"message":{"content":"world"}}\n');}else{res.write('data: {"choices":[{"delta":{"content":"hello "}}]}\n\n');res.end('data: {"choices":[{"delta":{"content":"world"}}]}\n\ndata: [DONE]\n\n');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));try{
 const endpoint='http://127.0.0.1:'+server.address().port;for(const provider of ['ollama','openai-compatible']){let updates=[];const result=await streamChat({provider,endpoint,model:'fixture-only'},[{role:'user',content:'test fixture'}],new AbortController().signal,s=>updates.push(s));assert.equal(result,'hello world');assert.equal(updates.length,2);n+=2;}
 assert.equal(requests[0].url,'/api/chat');assert.equal(requests[1].url,'/v1/chat/completions');n+=2;
 await assert.rejects(streamChat({provider:'ollama',endpoint,model:''},[],new AbortController().signal,()=>{}),/Nothing has been sent/);n++;
 const c=new AbortController();c.abort();await assert.rejects(streamChat({provider:'ollama',endpoint,model:'fixture-only'},[],c.signal,()=>{}));n++;
 }finally{await new Promise(r=>server.close(r));}
 console.log('PASS',n,'assertions: endpoint policy, sensitive paths, code fence extraction, both local fixture streams, missing model and cancellation. Not a real provider/model test.');
})().catch(e=>{console.error(e);process.exit(1)});
