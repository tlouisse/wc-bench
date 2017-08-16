const fs = require('fs');
const { spawn } = require('child_process');

const lock = require('../node_modules/bower-locker/bower-locker-lock.js');
const unlock = require('../node_modules/bower-locker/bower-locker-unlock.js');
// const validate = require('../node_modules/bower-locker/bower-locker-validate.js');
const validate = require('./bower-locker-validate.js');

const program = require('commander');
const snapFile = '.bower-snap.json';

function spawnAndLog(cmd, cfg) {
    return new Promise((resolve, reject) => {
        try {
            let _cfg = { output:true, onStdout: null }; 
            cfg = Object.assign(_cfg, cfg);
            let output = '';
            const cmds = cmd.split(' ');
            const child = spawn(cmds.slice(0)[0], cmds.slice(1, cmds.length));
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
                code === 0 ? resolve(output) : reject(`"${cmd}" process exited with code ${code}`)
            });
            process.on('exit', () => child.kill());
        } catch (e) {
            reject(e)
        }
    });
}

async function snap() {
    // lock the file: main bower entry will be the 'sapshot'
    lock();
    // copy the new bower.json, put it in a snap file
    await spawnAndLog(`cp ${process.cwd()}/bower.json ${process.cwd()}/${snapFile}`);
    // revert bower.json and delete the copy "bower-locker.bower.json"
    unlock();
    await spawnAndLog(`rm ${process.cwd()}/bower-locker.bower.json`);
}

async function compare() {
    try {
        let comparisonFileStr;
        if (program.compare !== 'current') {
            comparisonFileStr = await spawnAndLog(`git show ${program.compare}:${snapFile}`, {output:false});
        } else {
            comparisonFileStr = fs.readFileSync(`${process.cwd()}/${snapFile}`, `utf-8`, {output:false});
        }
        validate(program.verbose, comparisonFileStr);
    } catch (e) {
        console.error(e);
    }
}

const bowerSnap = {
    snap: snap,
    compare: compare,
    lock: lock,
    unlock: unlock
};

program
    .description(`Simple wrapper of bower-locker that creates a snapshot for future comparison(instead of locking the dependencies. The snapshot will be useful to compute the delta in (transitive) dependencies, which can be useful for denugging/explaining differences`)
    .option('--lock', 'lock the current bower usage in a new bower.json')
    .option('--unlock', 'unlock the current bower usage back to the original bower.json')
    .option('--compare <value>', 'validate that the currently locked bower.json matches the bower_components', c => c, 'current')
    .option('--snap', 'create a bower-snap file')
    .option('-v, --verbose', 'turn on verbose output')
    // .action(function (cmd) {
    //     if(cmd in bowerSnap) {
    //         return bowerSnap[cmd](program.verbose);
    //     } else {
    //         console.error("Unknown bower-snap command.  Run 'bower-snap -h' to see options.");
    //         process.exit(1);
    //     }
    // })
    .parse(process.argv);


['snap', 'compare', 'lock', 'unlock'].forEach(c => program[c] && bowerSnap[c](program.verbose));

module.exports = bowerSnap;