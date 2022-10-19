const fs = require("fs");
const unirest = require("unirest");
const random_useragent = require("random-useragent");
const isUrl = require("is-valid-http-url");
const beautify = require("json-beautify");
const jsdom = require("jsdom");
const parseUrl = require("url-parse");
const removeHtmlComments = require("remove-html-comments");
const mime = require("mime-types");
const {
    gzip: gzip,
    ungzip: ungzip
} = require("node-gzip");
const {JSDOM: JSDOM} = jsdom, virtualConsole = new jsdom.VirtualConsole;
let headerDafult = {
    "User-Agent": 'Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90',
    referer: "https://www.google.com"
};

let getFile = async (path)=>{
  return new Promise((resolve,reject)=>{
    fs.readFile(process.cwd()+"/"+path,"utf-8", (err,data) => {
      if(err){
        resolve("err");
      }else{
        resolve(data);
      };
    });
  });
};

let getListFile = async (path)=>{
  return new Promise((resolve,reject)=>{
    fs.readdir(process.cwd()+"/"+path, (err, files) => {
      if(err){
        resolve([]);
      }else{
        let dataBack=[];
        files.forEach(file => {
          dataBack.push(path+"/"+file);
        });
        resolve(dataBack);
      };
    });
  });
};

const curlLink = async (url)=>{
  return new Promise((resolve,reject)=>{
    let testCurl = unirest.request({
      uri:url,
      headers: headerDafult,
      gzip: true
    }).on('error', error => {
      resolve("err");
    });
    testCurl.on('response',(response)=>{
      try{
        testCurl.destroy();
        let backSend={};
        backSend.headers = response.headers;
        backSend.code = response.statusCode;
        resolve(backSend);
      }catch(e){
        resolve("err");
      }
    });
  });
};

const curlContent = async (url)=>{
  return new Promise((resolve,reject)=>{
    let dataBody="";
    let testCurl = unirest.request({
      uri: url,
      headers: headerDafult,
      gzip: true
    }).on('error', error => {
      resolve("err");
    })
    .on('data', (data)=>{
      dataBody+=data;
    })
    .on('end',()=>{
      //console.log(dataBody)
      resolve(dataBody);
    });
  });
};

const removeElement = async (data,dom)=>{
  return new Promise((resolve,reject)=>{
    data.forEach((a)=>{
      dom.querySelectorAll(a).forEach((b)=>{
        b.remove();
      });
    });
    resolve();
  });
};

const remakeUrlElement = async (dom,option)=>{
  let addQuery="";
  if(option.scp&&option.element!="a"){
    addQuery="?costom";
  };
  return new Promise((resolve,reject)=>{
    let hostnameComing = option.hostname;
    dom.querySelectorAll(option.element).forEach((a)=>{
      let hrefAttr=a.getAttribute(option.target);
      if(hrefAttr==null){
        //console.log(hrefAttr)
      }else{
        if(hrefAttr.indexOf("//")==0){
          hrefAttr = hrefAttr.replace("//",option.proto+"://");
        }else{
          if(isUrl(hrefAttr)==false){
            if(hrefAttr.indexOf("#")==0){
              hrefAttr="#";
            }else if(hrefAttr.indexOf("javascript")==0){
              hrefAttr="#";
            }else if(hrefAttr.indexOf("/")==0){
              hrefAttr=option.url+hrefAttr;
            }else{
              hrefAttr=option.url+"/"+hrefAttr;
            };
          };
        };
        let hostnameHref = parseUrl(hrefAttr).hostname;
        if(hostnameHref==hostnameComing){
          const mapHref = parseUrl(hrefAttr);
          const pathHref = mapHref.pathname+mapHref.query;
          const dataReplace = option.origin+pathHref;
          a.setAttribute(option.remake,dataReplace+addQuery);
        }else{
          if(isUrl(hrefAttr)==false){
            a.setAttribute(option.remake,hrefAttr);
          }else{
            const mapHref = parseUrl(hrefAttr);
            const protoHref = mapHref.protocol.replace(":","-");
            const pathHref = mapHref.pathname+mapHref.query;
            const dataReplace = option.origin+"/"+option.permalink+"-"+protoHref+hostnameHref+pathHref;
            a.setAttribute(option.remake,dataReplace+addQuery);
          };
        };
      };
    });
    resolve();
  });
};

const cekPermalink = async (val,data)=>{
  return new Promise((resolve,reject)=>{
    try{
      if(typeof val=="string"&&typeof data=="object"){
        let dataMap = null;
        for(let map of data){
          if(val.indexOf("/"+map+"-")>=0){
            dataMap=map;
          };
        };
        resolve(dataMap);
      }else{
        resolve(null);
      };
    }catch(e){
      resolve(null);
    };
  });
};

const cekCostomPermalink = async (val,data)=>{
  return new Promise((resolve,reject)=>{
    try{
      if(typeof val=="string"&&typeof data=="object"){
        let dataMap = null;
        for(let map of data){
          if(val.indexOf("/"+map.map+"-")==0){
            for(let target of map.target){
              if(val.indexOf("-"+target)>0){
                dataMap=map.map;
              };
            };
          };
        };
        resolve(dataMap);
      }else{
        resolve(null);
      };
    }catch(e){
      resolve(null);
    };
  });
};

const randomPermalink = async (obj) =>{
  return new Promise((resolve,reject)=>{
    try{
      if(typeof obj=="object"){
        let dataMap = obj[parseInt(Math.random() * obj.length)];
        resolve(dataMap);
      }else{
        resolve("host");
      };
    }catch(e){
      resolve("host");
    };
  });
};

const getPermalinkCostom = async (url)=>{
  return new Promise((resolve,reject)=>{
    try{
      if(url.indexOf("/")==0){
        url=url.split("/")[1];
        if(url.indexOf("-")>1){
          url=url.split("-")[0];
          if(url.length>0){
            resolve(url);
          }else{
            resolve("null");
          };
        }else{
          resolve("null");
        };
      }else{
        resolve("null");
      };
    }catch(e){
      resolve("null");
    };
  });
};

module.exports = async (req, res) => {
  //--- handle send response vercel (01) --
  if(!res.status){
    res.status = (input)=>{
      res.writeHead(input);
    };
  };
  if(!res.send){
    res.send = (input)=>{
      res.end(input);
    };
  };
  //----- end (01) --------
  let dataSetting = await getFile("setting.json");
  dataSetting = await JSON.parse(dataSetting);
  const mapPermalink = await dataSetting["map-permalink"];
  const costomPermalink = await dataSetting["costom-permalink"];
  let targetSitemap = await getListFile("sitemap");
  let proto = req.headers['x-forwarded-proto'];
  if(proto){
    proto = proto;
  }else{
    proto = "http";
  };
  let originUrl = await proto+"://"+req.headers.host;
  let fullUrl = await originUrl+req.url;
  let typePermalink = await cekPermalink(req.url,mapPermalink);
  let typeCostomPermalink = await cekCostomPermalink(req.url,costomPermalink);
  let statusCostomPermalink=false;
  if(typeCostomPermalink){
    statusCostomPermalink=true;
    typePermalink=typeCostomPermalink;
  };
  if(req.url.indexOf("?costom")>0){
    typePermalink=await getPermalinkCostom(req.url);
  };
  try{
    if("/ping"==req.url){
    //----- ping ------------
      res.status(200);
      res.send("ok");
    }else if("/ads.txt"==req.url){
      fs.readFile("ads.txt","utf-8",(err,data)=>{
        if(err){
          res.status(404);
          res.send("404");
        }else{
          res.writeHead(200,{
            'content-type':'text/plain;'
          });
          res.end(data);
        };
      });
    }else if(req.url.indexOf(dataSetting["name-folder-sitemap"])>0&&req.url.indexOf(".xml")>0&&typePermalink==null&&req.method === "GET"){
    //------- sitemap ----------
      let statusSitemap=false;
      let linkSubSitemap="";
      targetSitemap.forEach(function(a){
        if(req.url.indexOf(a)==1){
          statusSitemap=true;
          linkSubSitemap=a;
        };
      });
      if(statusSitemap){
        let getLinkSubSitemap = await getFile(linkSubSitemap);
        let data = getLinkSubSitemap;
        if(data=="err"){
          res.end("404");
        }else{
          let listUrlSitemap=data.split("\n");
          if(listUrlSitemap.length==0){
            res.end("404");
          }else{
            res.write(`<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="`+originUrl+`/assets/main-sitemap.xsl"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`)
            listUrlSitemap.forEach(function(a){
              let dataUrl = a.replace("https://","https-")
              .replace("http://","http-");
              res.write(` <url>\n`);
              res.write(`   <loc>`+originUrl+"/host"+"-"+dataUrl+`</loc>\n`);
              res.write(`   <lastmod>`+new Date().toISOString()+`</lastmod>\n`);
              res.write(` </url>\n`);
            });
            res.write(`</urlset>
<!-- XML Sitemap generated by NodeJs -->`);
            res.send();
          };
        };
      }else{
        res.writeHead(200, {
          "content-type": "text/xml; charset=UTF-8"
        });
        res.write(`<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="`+originUrl+`/assets/main-sitemap.xsl"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`);
        targetSitemap.forEach(function(a){
          res.write(` <sitemap>\n`);
          res.write(`   <loc>`+originUrl+`/`+a+`</loc>\n`);
          res.write(`   <lastmod>`+new Date().toISOString()+`</lastmod>\n`);
          res.write(` </sitemap>\n`);
        });
        res.write(`</sitemapindex>\n<!-- XML Sitemap generated by NodeJs -->`);
        res.end();
      };
    } else if (req.url=="/robots.txt" && req.method === "GET") {
    //------- robots.txt --------------
      let data = await getFile('robots.txt');
      res.writeHead(200, {
        "content-type": "text/plain; charset=UTF-8"
      });
      res.end(data);
    } else if (req.url.split("/assets/")[1] == undefined == false && req.method === "GET" && typePermalink==null) {
    //------- file assets -----------
      let dataFile = req.url.split("/assets/")[1];
      if(dataFile.length>0){
        let files = await getListFile("assets");
        let fixFile="";
        for(let aa of files){
          if(aa == "assets/"+dataFile){
            fixFile=aa;
          };
        };
        if(fixFile.length>0){
          let typeMime=mime.lookup(fixFile);
          if(typeMime){
            let data = await getFile(fixFile);
            res.writeHead(200, {
              "content-type":typeMime
            });
            res.end(data);
          }else{
            res.end("404");
          };
        }else{
          res.end("404");
        };
      }else{
        res.end("404");
      };
    } else if (req.url.length>1&&req.method === "GET"||req.url=="/") {
    // ----------- page --------
      try{
        let urlPost = await parseUrl(req.url).pathname.replace("/","")+parseUrl(req.url).query;
        let typeMime = await mime.lookup(urlPost);
        let linkPost = await dataSetting["target"]+"/"+urlPost;
        let statusOrigin=true;
        let dataOrigin="";
        if(urlPost.indexOf(typePermalink+"-")==0){
          let dataLink=await urlPost.split(typePermalink+"-")[1];
          linkPost=await dataLink.replace("https-","https://").replace("http-","http://");
          statusOrigin=false;
          dataOrigin=await typePermalink+"-"+parseUrl(linkPost).origin.replace("https://","https-").replace("http://","http-")
        };
        if(isUrl(linkPost)){
          let getInfo = await curlLink(linkPost);
          if(getInfo=="err"){
            res.end("404");
          }else{
            let typeContent=getInfo.headers['content-type'];
            if(req.url.indexOf("brainly.co.id/sitemap")>0){
              typeContent="application/xml";
            };
            let codeContent=getInfo.code;
            let resOriginHeader={};
            if(getInfo.headers["cache-control"]){
              resOriginHeader["cache-control"]=getInfo.headers["cache-control"];
            };
            if(getInfo.headers["etag"]){
              resOriginHeader["etag"]=getInfo.headers["etag"];
            };
            if(getInfo.headers["content-type"]){
              resOriginHeader["content-type"]=getInfo.headers["content-type"];
            };
            if(getInfo.headers["last-modified"]){
              resOriginHeader["last-modified"]=getInfo.headers["last-modified"];
            };
            // filter content type  
            // ---------- page html ----------
            if(typeContent){
              if(typeContent.indexOf("text/html")==0&&codeContent!=404){
                let hostname=parseUrl(linkPost).hostname;
                let origin=parseUrl(linkPost).origin;
                let dataContent = await curlContent(linkPost);
                let body=dataContent;
                if(body=="err"){
                  res.end("404");
                }else{
                  res.writeHead(200, {
                    "content-type": typeContent,
                    "content-encoding": "gzip"
                  });
                  if(typePermalink==null){
                    typePermalink=await randomPermalink(mapPermalink);
                  };
                  let dom = new JSDOM(body,{ virtualConsole }).window.document;
                  await removeElement(dataSetting["element-remove"],dom);
                  await remakeUrlElement(dom,{
                    "element":"link",
                    "target":"href",
                    "remake":"href",
                    "origin":originUrl,
                    "proto":proto,
                    "url":origin,
                    "hostname":parseUrl(dataSetting["target"]).hostname,
                    "permalink": typePermalink,
                    "scp":statusCostomPermalink
                  });
                  await remakeUrlElement(dom,{
                    "element":"a",
                    "target":"href",
                    "remake":"href",
                    "origin":originUrl,
                    "proto":proto,
                    "url":origin,
                    "hostname":parseUrl(dataSetting["target"]).hostname,
                    "permalink": typePermalink,
                    "scp":statusCostomPermalink
                  });
                  await remakeUrlElement(dom,{
                    "element":"img",
                    "target":"src",
                    "remake":"src",
                    "origin":originUrl,
                    "proto":proto,
                    "url":origin,
                    "hostname":parseUrl(dataSetting["target"]).hostname,
                    "permalink": typePermalink,
                    "scp":statusCostomPermalink
                  });
                  await remakeUrlElement(dom,{
                    "element":"img",
                    "target":"data-src",
                    "remake":"src",
                    "origin":originUrl,
                    "proto":proto,
                    "url":origin,
                    "hostname":parseUrl(dataSetting["target"]).hostname,
                    "permalink": typePermalink,
                    "scp":statusCostomPermalink
                  });
                  dataSetting["inject-element-head"].reverse().forEach(function(a){
                    let createEl=dom.createElement(a["name-element"]);
                    a["data-attribute"].forEach(function(b){
                      createEl.setAttribute(b["name-attribute"],b["value-attribute"]);
                    });
                    createEl.innerHTML=a["data-innerHTML"];
                    if(a["position"]=="start"){
                      dom.head.insertBefore(createEl, dom.head.firstChild);
                    }else{
                      dom.head.appendChild(createEl);
                    };
                  });
                  dataSetting["inject-element-body"].reverse().forEach(function(a){
                    let createEl=dom.createElement(a["name-element"]);
                    a["data-attribute"].forEach(function(b){
                      createEl.setAttribute(b["name-attribute"],b["value-attribute"]);
                    });
                    createEl.innerHTML=a["data-innerHTML"];
                    if(a["position"]=="start"){
                      dom.body.insertBefore(createEl, dom.body.firstChild);
                    }else{
                      dom.body.appendChild(createEl);
                    };
                  });
                  let dataTitle="";
                  dom.querySelectorAll("title").forEach(function(a){
                    dataTitle=a.innerHTML;
                    a.remove();
                  });
                  let createTitle=dom.createElement("title");
                  createTitle.innerHTML=dataTitle;
                  dom.head.insertBefore(createTitle, dom.head.firstChild);
                  let domBody=dom.body.outerHTML;
                  let dataReplace=[];
                  dataSetting["costom-element-remove"].forEach(function(a){
                    if(a.target==hostname){
                      a["element-remove-selector"].forEach(function(b){
                        dom.querySelectorAll(b).forEach(function(c){
                          c.remove();
                        });
                      });
                      dataReplace=a["replace-string"];
                    };
                  });
                  let textBody=dom.documentElement.querySelector("body")
                  if(textBody==null){
                    textBody="";
                  }else{
                    textBody=textBody.textContent;
                  };
                  let dataDescription=[];
                  for(var i=0;i<10;i++){
                    textBody=textBody.replace(/\n/g,"").replace(/[`~!@#$%^&*()_\-+=\[\]{};:'"\\|\/<>?\s]/g, ' ').replace(/  /g," ");
                  };
                  textBody=textBody.split(" ");
                  textBody.forEach(function(a,i){
                    if(a.length>=3){
                      if(i>10&&i<50){
                        dataDescription.push(a);
                      };
                    };
                  });
                  if(dataDescription.length>0){
                    dataDescription=dataDescription.join(" ");
                  }else{
                    dataDescription="";
                  };
                  dom=dom.documentElement.outerHTML;
                  if(dataSetting["remove-comment-html"]){
                    removeHtmlComments(domBody).comments.forEach(function(a){
                      dom=dom.replace(a,"");
                    });
                  };
                  dataReplace.forEach(function(a){
                    dom=dom.replace(a.target,a.replace);
                  });
                  dom=dom.replace(/\$\{titlePost\}/g,dataTitle);
                  dom=dom.replace(/\$\{urlPost\}/g,fullUrl);
                  dom=dom.replace(/\$\{nameWeb\}/g,dataSetting["name-web"]);
                  dom=dom.replace(/\$\{timePublish\}/g,new Date().toISOString());
                  dom=dom.replace(/\$\{authorPost\}/g,dataSetting["author"]);
                  dom=dom.replace(/\$\{descriptionPost\}/g,dataDescription+"...");
                  dom="<!DOCTYPE html>"+dom;
                  gzip(dom)
                  .then((compressed) => {
                    res.write(compressed);
                    res.end();
                  })
                  .catch(function(e){
                    res.end("404");
                  });
                };
              }else{
                if(codeContent==404){
                  res.end("404");
                }else{
                  // check content image        
                  //console.log("--------")
                  if(typeContent.indexOf("image/")==0||typeContent.indexOf("font/")==0){
                    let getContent=unirest.request({
                      uri:linkPost,
                      headers: headerDafult,
                      gzip: true
                    }).on('error', error => {
                      //console.log(error)
                      res.end("404");
                    }).pipe(res);
                  }else if(typeContent.indexOf("application/atom+xml")==0||typeContent.indexOf("application/xml")==0||typeContent.indexOf("text/xml")==0||typeContent.indexOf("application/xslt+xml")==0||req.url.indexOf(".xsl")>0){
                    // --  page xml host ----------
                    //console.log(linkPost)
                    let dataXML="";
                    let linkFix = linkPost;
                    let getContent=unirest.request({
                      uri:linkFix,
                      headers: headerDafult,
                      gzip: true
                    }).on('error', error => {
                      res.end("404");
                    });
                    getContent.on('data', function(data) {
                      dataXML=dataXML+data;
                    });
                    getContent.on('end', function() {
                      try{
                        let hostname="//"+parseUrl(linkPost).hostname;
                        let re = new RegExp(dataSetting["target"], 'g');
                        let re2 = new RegExp(hostname, 'g');
                        if(statusOrigin==false){
                          re = new RegExp(parseUrl(linkPost).origin, 'g');
                        };
                        dataXML=dataXML.replace(re,originUrl+"/"+dataOrigin);
                        dataXML=dataXML.replace(re2,originUrl+"/"+dataOrigin);
                        if(hostname.indexOf("www")==-1){
                          let re3=hostname.replace("//","//www.");
                          re3=new RegExp(re3, 'g');
                          //console.log(re3)
                        }else{
                          let re3=hostname.replace("//www.","//");
                          re3=new RegExp(re3, 'g');
                          dataXML=dataXML.replace(re3,originUrl+"/"+dataOrigin);
                        };
                        let re4 = new RegExp("https:http", 'g');
                        let re5 = new RegExp("https:https", 'g');
                        let re6 = new RegExp("http:https", 'g');
                        let re7 = new RegExp("http:http", 'g');
                        dataXML=dataXML.replace(re4,"http");
                        dataXML=dataXML.replace(re5,"https");
                        dataXML=dataXML.replace(re6,"https");
                        dataXML=dataXML.replace(re7,"http");
                        res.writeHead(200, {
                          "content-type": typeContent
                        });
                        res.end(dataXML);
                      }catch(e){
                        res.end("404");
                      };
                    });
                  }else if(typeContent.indexOf("text/css")==0){
                    //--------- assets css host ---------
                    let dataCSS="";
                    let getContent=unirest.request({
                      uri:linkPost,
                      headers: headerDafult,
                      gzip: true
                    }).on('error', error => {
                      res.end("404");
                    });
                    getContent.on('data', function(data) {
                      dataCSS=dataCSS+data;
                    });
                    getContent.on('end', function() {
                      res.writeHead(200,resOriginHeader);
                      //console.log(dataCSS);
                      res.end(dataCSS);
                    });
                  }else{
                    // console.log(resOriginHeader);
                    // console.log(codeContent);
                    // console.log(typeContent);
                    //console.log("1")
                    res.end("404");
                  };
                };
              };
            }else{
              res.end("404");
            };
          };
        }else{
          //console.log("3")
          res.end("404");
        };
      }catch(e){
        console.log(e)
        //console.log("4")
        res.end("404");
      };
    }else {
      //console.log("5")
      res.end("404");
    };
  }catch(e){
    res.send(e.toString());
  };
};