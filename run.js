const cmd=require('node-cmd');

const waitting = async(time)=>{
	return new Promise((resolve)=>{
		setTimeout(()=>{
			resolve();
		},time);
	});
};

function restart(){
	(async ()=>{

		console.log("restart server agc....");

		console.log("stop agc aplication...");
		cmd.runSync('pm2 stop agc -f');
		await waitting(2000);

		console.log("cleardump pm2...");
		cmd.runSync('pm2 cleardump');

		console.log("run auto clear log....");
		cmd.runSync('pm2 start flush.js');

		console.log("run file agc.js");
		cmd.runSync('pm2 start agc.js --exp-backoff-restart-delay=1000 --max-memory-restart 512M -i max');

		console.log("save session pm2...");
		cmd.runSync('pm2 save');

		console.log("run auto startup pm2 after reboot");
		cmd.runSync('pm2 save');
		cmd.runSync('pm2 startup');
		cmd.runSync('pm2 save');

		console.log("restart success...");
	})();
};

restart();