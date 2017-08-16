const child_process = require('child_process');


let globalCfg = {
    output: false,
    stripLastReturn: true
}

function spawn(cmd, cfg, xcfg) { 
    return chilp('spawn', cmd, cfg, xcfg);
}

function exec(cmd, cfg, xcfg) { 
    return chilp('exec', cmd, cfg, xcfg);
}

/**
 * Spawns/exec a child process. Returns a promise that will be resolved with concatenated stdout data on process exit. 
 * @param {*} type spawn/exec
 * @param {*} cmd the string one would normally type in terminal
 * @param {*} cfg configuration for output logging and custom handlers for stdout
 * @param {*} xcfg configuration object for the original child_process function
 */
function chilp(type, cmd, cfg, xcfg) {
    return new Promise((resolve, reject) => {
        try {
            let _cfg = { onStdout: null }; 
            cfg = Object.assign(globalCfg, _cfg, cfg);
            let output = '';
            const cmds = cmd.split(' ');
            const child = child_process[type](cmds.slice(0)[0], cmds.slice(1, cmds.length), xcfg);
            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');

            child.stdout.on('data', data => {
                output += data;
                if (cfg.onStdout) {
                    cfg.onStdout(data);
                } else {
                    cfg.output && console.log(data);
                }
            });
            child.stderr.on('data', data => console.error(data));
            child.on('close', code => {
                if(code === 0) {
                    if(cfg.stripLastReturn) {
                        output = output.replace(/\n([^\n]*)$/,'$1');
                    }
                    resolve(output); // delete last return
                 } else {
                    reject(`"${cmd}" process exited with code ${code}`);
                 } 
            });
            process.on('exit', () => child.kill());
        } catch (e) {
            reject(e)
        }
    });
}

function config(c) { 
    globalCfg = Object.assign(globalCfg, c)
}

module.exports = {
    spawn : spawn,
    exec : exec,
    config: config
}