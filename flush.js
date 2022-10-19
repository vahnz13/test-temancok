const cmd=require('node-cmd');
const timeClearLog = 60000;

const waitting = async(time)=>{
	return new Promise((resolve)=>{
		setTimeout(()=>{
			resolve();
		},time);
	});
};

(async ()=>{
	await waitting(timeClearLog);
	console.log("clear log...");
	await cmd.runSync('pm2 flush');
})();