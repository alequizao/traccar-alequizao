/*comandos-bypass*/self.addEventListener("fetch",function(e){try{var u=new URL(e.request.url);if(u.pathname.indexOf("/comandos")===0){e.respondWith(fetch(e.request))}}catch(_){}});
