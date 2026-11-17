var http=require('http'),fs=require('fs'),path=require('path');var R=require('path').join(__dirname,'..','..');
var T={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.woff2':'font/woff2','.pdf':'application/pdf'};
http.createServer(function(q,s){var u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';var f=path.join(R,u);
if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){if(fs.existsSync(f+'.html'))f=f+'.html';else{s.writeHead(404);return s.end('nf');}}
s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(8899);
