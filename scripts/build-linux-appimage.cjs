// Assemble a type-2 AppImage on Windows from verified, official Linux binaries.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),work=path.join(root,'.growth-atlas-build'),tools=path.join(work,'tools'),dir=path.join(work,'Linux-1.2.1.AppDir'),runtimeDir=path.join(dir,'usr/lib/growth-atlas');
const run=(exe,args,options={})=>cp.execFileSync(exe,args,{stdio:'inherit',...options});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const receipt of JSON.parse(fs.readFileSync(path.join(tools,'download-receipts.json')))){if(hash(path.join(tools,receipt.file))!==receipt.sha256)throw Error('Build tool digest mismatch: '+receipt.file)}
fs.mkdirSync(runtimeDir,{recursive:true});
run('tar.exe',['-xf',path.join(tools,'electron-v44.9.0-linux-x64.zip'),'-C',runtimeDir]);
fs.renameSync(path.join(runtimeDir,'electron'),path.join(runtimeDir,'growth-atlas'));
const asar=path.join(root,'build/desktop/win-unpacked/resources/app.asar');
fs.copyFileSync(asar,path.join(runtimeDir,'resources/app.asar'));
fs.writeFileSync(path.join(dir,'AppRun'),'#!/bin/sh\nHERE="${APPDIR:-$(dirname "$(readlink -f "$0")")}"\nexec "$HERE/usr/lib/growth-atlas/growth-atlas" "$@"\n');
fs.writeFileSync(path.join(dir,'growth-atlas.desktop'),'[Desktop Entry]\nType=Application\nName=纹间\nComment=Natural growth research and jewelry concepts\nExec=AppRun\nIcon=growth-atlas\nTerminal=false\nCategories=Education;Science;Graphics;\n');
for(const name of ['growth-atlas.png','.DirIcon'])fs.copyFileSync(path.join(root,'desktop/icon.png'),path.join(dir,name));
const tarPath=path.join(work,'linux-appdir.tar');
run('tar.exe',['--format=ustar','-cf',tarPath,'-C',dir,'.']);
// ZIP extraction on NTFS cannot preserve executable bits. Normalize TAR metadata
// explicitly before packing SquashFS, including Chromium's sandbox helper.
const tar=fs.readFileSync(tarPath);let offset=0,files=0;
while(offset+512<=tar.length){const h=tar.subarray(offset,offset+512);if(h.every(v=>v===0))break;
 const str=(a,b)=>h.subarray(a,b).toString().replace(/\0.*$/s,'');
 const name=(str(345,500)?str(345,500)+'/':'')+str(0,100),size=parseInt(str(124,136).trim()||'0',8),type=String.fromCharCode(h[156]);
 let mode=type==='5'?0o755:0o644;if(/(?:^|\/)(AppRun|growth-atlas|chrome_crashpad_handler)$/.test(name))mode=0o755;if(/\/chrome-sandbox$/.test(name))mode=0o4755;
 const octal=(value,start,len)=>{h.fill(0,start,start+len);h.write(value.toString(8).padStart(len-1,'0'),start,len-1,'ascii')};
 octal(mode,100,8);octal(0,108,8);octal(0,116,8);h.fill(0,265,329);h.fill(32,148,156);let sum=0;for(const n of h)sum+=n;h.write(sum.toString(8).padStart(6,'0')+'\0 ',148,8,'ascii');
 offset+=512+Math.ceil(size/512)*512;files++;
}
fs.writeFileSync(tarPath,tar);
const sqfs=path.join(work,'linux-app.squashfs'),bin=path.join(tools,'squashfs/squashfs-tools-ng-1.3.2-mingw64/bin');
const fd=fs.openSync(tarPath,'r');try{run(path.join(bin,'tar2sqfs.exe'),['-f','-q','-c','xz','-j','4',sqfs],{stdio:[fd,'inherit','inherit']})}finally{fs.closeSync(fd)}
const runtime=fs.readFileSync(path.join(tools,'appimage-runtime-x86_64'));
if(runtime.readUInt16LE(18)!==62||runtime.subarray(0,4).toString('hex')!=='7f454c46'||runtime.subarray(8,11).toString('hex')!=='414902')throw Error('Not a type 2 AppImage runtime');
const output=path.join(root,'build/desktop/WenJian-1.2.1-Linux-x64.AppImage');fs.writeFileSync(output,Buffer.concat([runtime,fs.readFileSync(sqfs)]));
const describe=cp.execFileSync(path.join(bin,'rdsquashfs.exe'),['-l','/',sqfs],{encoding:'utf8'});fs.writeFileSync(path.join(work,'linux-squashfs-list.txt'),describe);
for(const file of ['AppRun','usr/lib/growth-atlas/growth-atlas','usr/lib/growth-atlas/chrome-sandbox','usr/lib/growth-atlas/resources/app.asar']){const stat=cp.execFileSync(path.join(bin,'rdsquashfs.exe'),['-s','/'+file,sqfs],{encoding:'utf8'});fs.writeFileSync(path.join(work,'linux-'+path.basename(file)+'.stat.txt'),stat);console.log(stat.split('\n').slice(0,7).join('\n'))}
const packedAsar=cp.execFileSync(path.join(bin,'rdsquashfs.exe'),['-c','/usr/lib/growth-atlas/resources/app.asar',sqfs],{maxBuffer:100*1024*1024});
if(crypto.createHash('sha256').update(packedAsar).digest('hex')!==hash(asar))throw Error('Payload verification failed');
const report={version:'1.2.1',platform:'linux-x64',runtimeBytes:runtime.length,squashfsMagic:fs.readFileSync(output).subarray(runtime.length,runtime.length+4).toString(),files,asarSHA256:hash(asar),appImageSHA256:hash(output),verified:['official runtime digests','ELF x64 type-2 AppImage header','SquashFS listing and executable modes','identical app.asar extracted from Windows and Linux payload'],launchTested:false,limitation:'Built on Windows. Linux launch, display and Chromium sandbox require verification on a Linux computer.'};
if(report.squashfsMagic!=='hsqs')throw Error('SquashFS offset incorrect');fs.writeFileSync(path.join(root,'verification/linux-structure.json'),JSON.stringify(report,null,2));console.log('Built '+output);
