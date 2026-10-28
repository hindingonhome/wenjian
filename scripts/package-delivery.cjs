const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
const dependency=name=>require(require.resolve(name,{paths:[root,process.env.GROWTH_BUILD_MODULES||root]}));
const yazl=dependency('yazl'),yauzl=dependency('yauzl');
const output=path.join(root,'交付',`2026-10-28-纹间-${version}-验收版`),stage=path.join(root,'build/delivery-1.2.1');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const windowsReport=JSON.parse(fs.readFileSync(path.join(root,'verification/windows-release-1.2.1/report.json')));
assert.equal(windowsReport.version,version);assert.equal(windowsReport.errors.length,0);assert.equal(windowsReport.layouts.length,16);
const linuxReport=JSON.parse(fs.readFileSync(path.join(root,'verification/linux-structure.json')));
assert.equal(linuxReport.appImageSHA256,hash(fs.readFileSync(path.join(root,`build/desktop/WenJian-${version}-Linux-x64.AppImage`))));
assert.equal(linuxReport.asarSHA256,hash(fs.readFileSync(path.join(root,'build/desktop/win-unpacked/resources/app.asar'))));
fs.mkdirSync(output,{recursive:true});
const collect=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?collect(path.join(dir,d.name)):[path.join(dir,d.name)]);
function copy(source,target){fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(source,target,{recursive:true})}
function zipFolder(folder,target){return new Promise((resolve,reject)=>{const zip=new yazl.ZipFile(),out=fs.createWriteStream(target);zip.outputStream.pipe(out);zip.outputStream.on('error',reject);out.on('error',reject);out.on('close',resolve);for(const file of collect(folder)){const name=path.relative(folder,file).split(path.sep).join('/');zip.addFile(file,name,{mode:/\.(sh|AppImage)$/.test(name)?0o100755:0o100644,mtime:new Date('2026-10-28T00:00:00Z'),compress:!file.endsWith('.AppImage')&&!file.endsWith('.exe')})}zip.end()})}
function verifyZip(file,expected){return new Promise((resolve,reject)=>{yauzl.open(file,{lazyEntries:true},(err,zip)=>{if(err)return reject(err);let count=0;const fail=e=>{zip.close();reject(e)};zip.on('error',fail);zip.on('entry',entry=>{assert.ok(!entry.fileName.startsWith('/')&&!entry.fileName.split('/').includes('..'));zip.openReadStream(entry,(error,stream)=>{if(error)return fail(error);const digest=crypto.createHash('sha256');stream.on('data',chunk=>digest.update(chunk));stream.on('error',fail);stream.on('end',()=>{try{assert.equal(digest.digest('hex'),expected[entry.fileName],entry.fileName);count++;zip.readEntry()}catch(e){fail(e)}})})});zip.on('end',()=>{try{assert.equal(count,Object.keys(expected).length);resolve(count)}catch(e){reject(e)}});zip.readEntry()})})}
(async()=>{
 const archives=[],report=[];
 for(const platform of ['Windows','Linux']){
  const folder=path.join(stage,platform);fs.mkdirSync(folder,{recursive:true});
  const binary=`WenJian-${version}-${platform}-x64.${platform==='Windows'?'exe':'AppImage'}`;
  copy(path.join(root,'build/desktop',binary),path.join(folder,binary));
  for(const name of ['README.md','User-Guide.md','CHANGELOG.md','LICENSE','THIRD_PARTY_LICENSE.txt'])copy(path.join(root,name),path.join(folder,name));
  copy(path.join(root,'docs/BUILD-NOTES.md'),path.join(folder,'BUILD-NOTES.md'));
  copy(path.join(root,'desktop-web'),path.join(folder,'Backup-HTML'));
  // Browser fallback uses the original source without the desktop-only CSP.
  copy(path.join(root,'index.html'),path.join(folder,'Backup-HTML/index.html'));
  for(const name of ['icon.png','icon.ico'])copy(path.join(root,'desktop',name),path.join(folder,'Branding',name));
  for(const name of ['LICENSE.electron.txt','LICENSES.chromium.html'])copy(path.join(root,'build/desktop/win-unpacked',name),path.join(folder,'Licenses',name));
  copy(path.join(root,'docs/licenses/SOURCES.txt'),path.join(folder,'Licenses/SOURCES.txt'));
  copy(path.join(root,'assets/fonts/GenSen-OFL.txt'),path.join(folder,'Licenses/GenSen-OFL.txt'));
  copy(path.join(root,'验收说明.md'),path.join(folder,'验收说明.md'));
  copy(path.join(root,'verification/font-coverage.json'),path.join(folder,'Verification/font-coverage.json'));
  copy(path.join(root,'assets/fonts/OFL.txt'),path.join(folder,'Licenses/NotoSansSC-OFL.txt'));
  copy(path.join(root,'docs/FONTS.md'),path.join(folder,'FONT-LICENSE.md'));
  copy(path.join(root,'desktop/icon.svg'),path.join(folder,'Branding/icon.svg'));
  if(platform==='Linux'){
   copy(path.join(root,'docs/licenses/AppImage-runtime-LICENSE.txt'),path.join(folder,'Licenses/AppImage-runtime-LICENSE.txt'));
   copy(path.join(root,'verification/linux-structure.json'),path.join(folder,'Verification/linux-structure.json'));
   fs.writeFileSync(path.join(folder,'Launch.sh'),'#!/bin/sh\nset -eu\ncd -- "$(dirname -- "$0")"\nchmod u+x "'+binary+'"\nexec "./'+binary+'" "$@"\n');
  }
  for(const name of ['report.json','light-1440.png','dark-1366.png','references-light.png','concept-light.png','algorithm-menu.png','parameters-light.png','quick-guide.png'])copy(path.join(root,'verification/windows-release-1.2.1',name),path.join(folder,'Verification/windows',name));
  copy(path.join(root,'.growth-atlas-build/tools/download-receipts.json'),path.join(folder,'Verification/download-receipts.json'));
  const expected={};for(const file of collect(folder)){const name=path.relative(folder,file).split(path.sep).join('/');if(name!=='PACKAGE-MANIFEST.sha256')expected[name]=hash(fs.readFileSync(file))}
  const manifest=Object.entries(expected).sort(([a],[b])=>a.localeCompare(b)).map(([name,digest])=>digest+'  '+name).join('\n')+'\n';fs.writeFileSync(path.join(folder,'PACKAGE-MANIFEST.sha256'),manifest);expected['PACKAGE-MANIFEST.sha256']=hash(Buffer.from(manifest));
  const zipName=`WenJian-${version}-${platform}-x64.zip`,target=path.join(output,zipName);await zipFolder(folder,target);const count=await verifyZip(target,expected);archives.push(hash(fs.readFileSync(target))+'  '+zipName);report.push({platform,file:zipName,files:count,bytes:fs.statSync(target).size,sha256:hash(fs.readFileSync(target)),allEntryHashesVerified:true});console.log(`Verified ${zipName}: ${count} entries`);
 }
 fs.writeFileSync(path.join(output,'SHA256SUMS.txt'),archives.join('\n')+'\n');fs.writeFileSync(path.join(root,'verification/delivery.json'),JSON.stringify(report,null,2));console.log(output);
})().catch(error=>{console.error(error);process.exitCode=1});
