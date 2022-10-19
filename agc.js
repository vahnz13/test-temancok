const http = require("http");
const fs = require("fs");
const dir = process.cwd();
const server = require("./api/server");
const dbAllowHost = require("./allow-host.json");
const dbAllowBot = require("./allow-bot.json");
const dbAllowIp = require("./allow-ip.json");
const dbBlockBot = require("./block-ua.json");
const dbIpGoogleBot =require("./ip-range-googlebot.json");
const dbIpBingBot =require("./ip-range-bingboot.json");
const dbIpBlockPermanent = require("./block-ip-permanent.json");

//--- Settings limit request/minutes Anti DDOS -----
const resetBlockIp = 12*60*60000;
const limitRequest = 100;

let ipReq={};

//-- checks block ip permanent 

const isBlockIpPermanen = async (ip)=>{
	let statusBlockIpPermanent = false;
	if(ip && typeof ip == "string"){
		for(let dataIp of dbIpBlockPermanent){
			if(ip==dataIp){
				statusBlockIpPermanent = true;
				break;
			};
		};
	};
	return statusBlockIpPermanent;
};

//-- checks allow host ---
const isAllowHost = async (host)=>{
	let statusAllowHost = false;
	if(host && typeof host == "string"){
		for(let dataHost of dbAllowHost){
			if(dataHost==host){
				statusAllowHost = true;
				break;
			};
		};
	};
	return statusAllowHost;
};

//-- checks allow user agent ---
const isAllowBoot = async (ua) =>{
	let statusAllow = false;
	if(ua && typeof ua == "string"){
		const valueUa = await ua.toLocaleLowerCase();
		for(let dataUa of dbAllowBot){
			const lowerUa = await dataUa.toLocaleLowerCase();
			if(valueUa.indexOf(lowerUa)>=0){
				statusAllow = true;
				break;
			};
		};
	};
	return statusAllow;
};

//-- checks allow IP ---
const isAllowIP = async (ip) =>{
	let statusAllowIP = false;
	if(ip && typeof ip == "string"){
		for(let dataIp of dbAllowIp){
			if(dataIp==ip){
				statusAllowIP = true;
				break;
			};
		};
	};
	return statusAllowIP;
};

//-- checks ip google bot ----
const isIpGoogleBot = async (ip)=>{
	let statusAllowIp = {
		"status":false,
		"sub":"google bot"
	};
	for(let dataIp of dbIpGoogleBot){
		if(ip.indexOf(dataIp)==0){
			statusAllowIp.status = true;
			break;
		};
	};
	return statusAllowIp;
};

//-- checks ip bing bot ----
const isIpBingBot = async (ip)=>{
	let statusAllowIp = {
		"status":false,
		"sub":"bing bot"
	};
	for(let dataIp of dbIpBingBot){
		if(ip.indexOf(dataIp)==0){
			statusAllowIp.status = true;
			break;
		};
	};
	return statusAllowIp;
};

//-- checks block ua ---
const isBlockUa = async (ua)=>{
	let statusBlock = false;
	if(ua && typeof ua == "string"){
		const valueUa = await ua.toLocaleLowerCase();
		for(let dataUa of dbBlockBot){
			const lowerUa = await dataUa.toLocaleLowerCase();
			if(valueUa.indexOf(lowerUa)>=0){
				statusBlock = true;
				break;
			};
		};
	};
	return statusBlock;
};

//--- checks ddos visitor ---
const isBlockDDOS = async (ip)=>{
	let statusDDOS = {
		"status":false,
		"hit":0
	};
	if(ip && typeof ip == "string"){
		if(ipReq[ip]){
			const dataHits = ipReq[ip].hit;
			if(dataHits && typeof dataHits == "number"){
				if(dataHits >= limitRequest){
					statusDDOS.status = true;
					statusDDOS.hit = ipReq[ip].hit;
					try{
						ipReq[ip].hit +=1;
					}catch(e){
						return statusDDOS;
					};
				}else{
					try{
						ipReq[ip].hit +=1;
						statusDDOS.hit = ipReq[ip].hit;
					}catch(e){
						return statusDDOS;
					};
				};
			};
		}else{
			try{
				ipReq[ip] = {
					"hit":1
				};
			}catch(e){
				return statusDDOS;
			};
		};
	};
	return statusDDOS;
};

http.createServer(async (req,res)=>{
	const headers = req.headers;
	const ua = headers["user-agent"];
	const ip = headers["cf-connecting-ip"];
	const host = headers.host;
	const blockIp = await isBlockIpPermanen(ip);
	const allowIP = await isAllowIP(ip);
	if(allowIP){
		server(req,res);
	}else if(blockIp){
		res.writeHead(200,{
			'content-type': 'text/html; charset=UTF-8'
		});
		res.end(host.toString());
	}else{
		const allowHost = await isAllowHost(host);
		if(allowHost){
			const allowBot = await isAllowBoot(ua);
			if(allowBot){
				const ipGoogleBot = await isIpGoogleBot(ip);
				const ipBingBot = await isIpBingBot(ip);
				if(ipGoogleBot.status || ipBingBot.status){
					let sub = null;
					if(ipGoogleBot.status){
						sub = ipGoogleBot.sub;
					}else if(ipBingBot.status){
						sub = ipBingBot.sub;
					};
					console.log("[",host,"-",sub,"] -",req.url);
					server(req,res);
				}else{
					res.writeHead(200,{
						'content-type': 'text/html; charset=UTF-8'
					});
					res.end(host.toString() + " - Sorry your access was denied!. you are masquerading as a 'bot crawler'. But your ip is not 'bot crawler' ip. byee. :)");
				};
			}else{
				const blockUa = await isBlockUa(ua);
				if(blockUa){
					res.writeHead(200,{
						'content-type': 'text/html; charset=UTF-8'
					});
					res.end(host.toString() + " - Sorry your access was denied!. 'bot crawler' is not allowed.");
				}else{
					const blockDDOS = await isBlockDDOS(ip);
					if(blockDDOS.status){
						console.log("Block Ip :",ip);
						res.writeHead(200,{
							'content-type': 'text/html; charset=UTF-8'
						});
						res.end(host.toString() + " - Sorry your access was denied!. You are making too many requests. Your IP has been blocked within the next 12 hours. goodbye.. :)");
					}else{
						console.log("[",host,"-","visitor","] -",req.url);
						server(req,res);
					};
				};
			};
		}else{
			res.writeHead(200,{
				'content-type': 'text/html; charset=UTF-8'
			});
			res.end("Access prohibited!");
		};
	};
}).listen(80,()=>{
	console.log("server running...");
});


///--- reset all ip block
setInterval(()=>{
	ipReq={};
	console.log("Reset List Ip Block :",ipReq);
},resetBlockIp);
