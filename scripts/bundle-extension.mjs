import path from 'node:path';import {createRequire} from 'node:module';
const root=process.argv[2];if(!root)throw new Error('Provide source root');const req=createRequire(path.join(root,'package.json'));const esbuild=req(path.join(root,'build/node_modules/esbuild'));
await esbuild.build({entryPoints:[path.join(root,'extensions/aperture-ai/src/extension.ts')],bundle:true,platform:'node',format:'cjs',external:['vscode'],outfile:path.join(root,'extensions/aperture-ai/out/extension.js')});

await esbuild.build({entryPoints:[path.join(root,'extensions/aperture-ai/src/provider.ts')],bundle:true,platform:'node',format:'cjs',outfile:new URL('./provider-check.cjs',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,'')});
