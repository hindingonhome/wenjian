const {app,BrowserWindow,Menu,protocol,session,shell,dialog,net,screen}=require('electron');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const qaArg=process.argv.find(arg=>arg.startsWith('--verify-output='));const qaDir=qaArg?path.resolve(qaArg.slice('--verify-output='.length)):null;
if(qaDir)app.setPath('userData',path.join(qaDir,'profile'));
app.setName('纹间');if(process.platform==='win32')app.setAppUserModelId('cn.growthatlas.desktop');
protocol.registerSchemesAsPrivileged([{scheme:'atlas',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}]);
const webRoot=path.join(__dirname,'..','desktop-web'),allowed=new Set(JSON.parse(fs.readFileSync(path.join(webRoot,'asset-manifest.json'),'utf8')));
function localAsset(raw){try{const u=new URL(raw);if(u.protocol!=='atlas:'||u.hostname!=='app')return null;const name=decodeURIComponent(u.pathname).replace(/^\//,'');if(!allowed.has(name))return null;const resolved=path.resolve(webRoot,name);return resolved.startsWith(webRoot+path.sep)?resolved:null}catch{return null}}
function externalLink(raw){try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null}catch{return null}}
const errorLog=[],downloads=[];let mainWindow,qaCancelNext=false;
function notify(text){if(mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.executeJavaScript(`typeof showToast==='function'&&showToast(${JSON.stringify(text)})`).catch(()=>{})}
function openLink(raw){const outside=externalLink(raw);if(outside){shell.openExternal(outside);return}const asset=localAsset(raw);if(asset&&/\.(jpg|jpeg|png|svg|md)$/i.test(asset)){const viewer=new BrowserWindow({width:1000,height:800,title:'档案材料',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});viewer.webContents.setWindowOpenHandler(()=>({action:'deny'}));viewer.webContents.on('will-navigate',(event,url)=>{if(!localAsset(url))event.preventDefault()});viewer.loadURL(raw)}}
app.whenReady().then(async()=>{
  if(qaDir){fs.mkdirSync(qaDir,{recursive:true});fs.appendFileSync(path.join(qaDir,'progress.log'),'ready\n')}
  protocol.handle('atlas',async request=>{const file=localAsset(request.url);if(!file)return new Response('Asset unavailable',{status:404});const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.woff2':'font/woff2','.js':'text/javascript; charset=utf-8'};try{return new Response(await fs.promises.readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Asset unavailable',{status:404})}});
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith('atlas://app/')&&!details.url.startsWith('data:')&&!details.url.startsWith('devtools:')}));
  session.defaultSession.on('will-download',(event,item)=>{
    const raw=item.getURL();if(!localAsset(raw)&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raw)){event.preventDefault();return}
    const name=path.basename(item.getFilename()).replace(/[<>:"/\\|?*\x00-\x1f]/g,'-');
    if(qaCancelNext){qaCancelNext=false;event.preventDefault();downloads.push({name,status:'cancelled'});return}
    if(qaDir){fs.mkdirSync(path.join(qaDir,'exports'),{recursive:true});item.setSavePath(path.join(qaDir,'exports',name))}
    else item.setSaveDialogOptions({title:'导出图片',defaultPath:path.join(app.getPath('downloads'),name),filters:[{name:'图片',extensions:['png','jpg']}]});
    item.once('done',(_event,status)=>{downloads.push({name,status,path:item.getSavePath()});notify(status==='completed'?'图片已导出':status==='cancelled'?'已取消导出':'导出失败，请重试')});
  });
  const area=screen.getPrimaryDisplay().workAreaSize;
  mainWindow=new BrowserWindow({width:Math.min(1480,area.width-64),height:Math.min(960,area.height-64),minWidth:760,minHeight:500,title:'纹间',icon:path.join(__dirname,'icon.png'),backgroundColor:'#f5f5f7',show:!qaDir,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false,offscreen:false}});
  Menu.setApplicationMenu(null);
  mainWindow.webContents.on('console-message',(event,details)=>{const record=details&&typeof details==='object'?details:event;if(['error',2,3].includes(record.level))errorLog.push(record.message);if(qaDir)fs.appendFileSync(path.join(qaDir,'console.log'),JSON.stringify({level:record.level,message:record.message})+'\n')});
  mainWindow.webContents.on('render-process-gone',(_e,details)=>errorLog.push('Renderer stopped: '+details.reason));
  mainWindow.webContents.setWindowOpenHandler(({url})=>{openLink(url);return{action:'deny'}});
  mainWindow.webContents.on('will-navigate',(event,url)=>{try{const u=new URL(url);if(u.protocol==='atlas:'&&u.hostname==='app'&&u.pathname==='/index.html')return}catch{}event.preventDefault();openLink(url)});
  mainWindow.webContents.on('before-input-event',(event,input)=>{if(input.type==='keyDown'&&(input.control||input.meta)&&['+','=','-','0'].includes(input.key)){event.preventDefault();const current=mainWindow.webContents.getZoomFactor();mainWindow.webContents.setZoomFactor(input.key==='0'?1:Math.max(.7,Math.min(1.8,current+(input.key==='-'?-.1:.1))))}});
  mainWindow.webContents.once('did-fail-load',(_event,code,description)=>{if(code===-3)return;if(qaDir)fs.writeFileSync(path.join(qaDir,'failure.txt'),description);else dialog.showErrorBox('启动未完成','离线页面未能载入：'+description);app.exit(1)});
  await mainWindow.loadURL('atlas://app/index.html#laboratory');
  if(qaDir)fs.appendFileSync(path.join(qaDir,'progress.log'),'page loaded\n');
  if(qaDir){try{await require('./self-check.cjs')({win:mainWindow,out:qaDir,errors:errorLog,downloads,cancelNext:()=>qaCancelNext=true});app.exit(0)}catch(error){fs.mkdirSync(qaDir,{recursive:true});fs.writeFileSync(path.join(qaDir,'failure.txt'),error.stack+'\nRenderer errors:\n'+errorLog.join('\n'));app.exit(1)}}
});
app.on('window-all-closed',()=>app.quit());
module.exports={localAsset,externalLink};
