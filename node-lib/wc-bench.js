#!/usr/bin/env node

///  Load libs and files

const systemStats = require('./wc-bench-system-stats');
const runner = require('./wc-bench-runner');
const proxyServer = require('./wc-bench-proxy-server');

const fs = require('fs');
const path = require('path');

const program = require('commander');
const mkdirp = require('mkdirp');
const chilp = require('./chilp');

const bowerJson = require(process.cwd() + '/bower.json');
const packageJson = require(process.cwd() + '/package.json');

// TODO: read this from package.json entry and wc-bench.conf.js
let config = {
  'resultsFolder' : 'results',
  'testsFolder': 'test'
}

let mode;

///  Handle args
program
  .version('0.1.0')
  .description('Measures macro performance (initialization time) of a web component')

  .option('--strategy <value>', 'Can be either "onedev", "median" or "min"', s=>s, 'onedev')
  .option('--runs <number>', 'The amount of runs for each test (note this does not concern the number of runs within the harness)', r=>r, 25)
  .option('--count <number>', 'The amount of runs for each test within the harness.html', h=>h, 250)

  .option('-c, --compare [value]', 'Baseline to compare against (default is latest tag)') 
  .option('-b, --baseline [value]', 'Create baseline for latest commit or create temp (not tied to commit, but current workspace) baseline with provided name. These can be used as reference points while developing')  


  .option('-p, --port <n>', 'Port to use')
  .option('-s, --server <value>', 'Server where test runs. When specified, user must spawn server themselves. Else, "polymer serve" will be used', s=>s, '')
  .option('-P, --polymer <n>', 'Polymer version to test', p => Number(p), 2)
  .option('--browser <value>', 'Browser name', b => b.split(','), ['google chrome', '--incognito', '--new-window'])
  .option('-H, --host <value>', 'host, for instance 0.0.0.0', h=>h, '127.0.0.1');

program
  .command('init')    
  .description('Sets up test folder and index.html, including test for default component. After running this command, you are ready to run your benchmark')
  .action(() => mode = 'init');  

program  
  .command('run')
  .description('Run a comparison against latest tag or temp named baseline. To create a new baseline, supply --baseline option')
  .action(() => mode = 'run');  

program  
  .parse(process.argv);  

///  Create globals  
const resultsFolder = `${process.cwd()}/${config.resultsFolder}/wc-bench`;
const testsFolder = `${process.cwd()}/${config.testsFolder}/wc-bench`;
const componentVersion = bowerJson.version || packageJson.version;
const componentName = bowerJson.name || packageJson.name;


function init() {
  // Read template files
  let indexHTML = fs.readFileSync(path.resolve(__dirname, '../client-lib/templates/index.tpl'), 'utf-8');
  mkdirp(testsFolder);
  fs.writeFileSync(`${testsFolder}/index.html`, indexHTML.replace(/\$\{componentName\}/g, componentName), 'utf-8');
  console.log(`Successfully created a test runner(index.html) inside ${testsFolder}`);

  let gitignore = fs.readFileSync(`${process.cwd()}/.gitignore`, 'utf-8');
  if(gitignore.indexOf(`${config.resultsFolder}/wc-bench}`) > -1) {
    fs.writeFileSync(`${process.cwd()}/.gitignore`, gitignore + `\n${config.resultsFolder}/wc-bench`, 'utf-8');    
    console.log(`Successfully added "${config.resultsFolder}/wc-bench" to .gitignore`);    
  }
}


/**
 * Computes baseline suffix. By default this is the latest tag or latest commit. 
 * If 
 */
async function handleBaseline() {
  let baselineSuffix;
  
  if (program.baseline === true) { // regular --baseline that creates a baseline against latest tag, if commit is same  
    try {
      chilp.config({
        output: false,
        stripLastReturn: true
      });
      const cleanWorkDir = (await chilp.spawn(`git status`)).includes('nothing to commit, working directory clean');
      if (!cleanWorkDir) {
        throw new Error('Please make sure you have no unstaged changes, so the baseline can be connected to a tag or commit (or provide --baseline <name> to create a named temp baseline for WIP code)');
      }
      const latestTag = (await chilp.spawn(`git describe`)).split('-')[0];
      const tagCommit = await chilp.spawn(`git rev-list -1 ${latestTag}`);
      const latestCommit = await chilp.spawn(`git rev-parse HEAD`);
      const isTagged = (latestCommit === tagCommit);
      baselineSuffix = isTagged ? latestTag : latestCommit; 

      if(!isTagged) {
        console.warn(`No tag found for latest commit; commit hash will be used as a reference`);
      }

    } catch (e) {
      throw e;
    }
  } else if(typeof program.baseline === 'string') { 
    baselineSuffix = program.baseline;
  }
  return baselineSuffix;
}

async function getComparePath() {
  const latestTag = (await chilp.spawn(`git describe`)).split('-')[0];
  const compareTo = typeof program.compare === 'string' ? program.compare : null;
  return `${resultsFolder}/${componentName}-${compareTo || latestTag}.json`;
}

async function checkCompare() {
  const filePath = await getComparePath();
  if (!fs.existsSync(filePath)) {
    if(!program.baseline) { // else don't compare, only do baseline
      throw new Error(`${filePath} not found`);      
    }
    console.log('No previous benchmark results found for latest tag. No comparison possible, only a new baseline benchmark will be created')
    return false;
  }
  return true;
}

async function handleResult({req, res, next}, baselineSuffix, canCompare) {

  mkdirp(resultsFolder, e => e && console.error(e));
  let results = req.body;

  if (program.host !== '127.0.0.1') { // Meaning it's hosted for the outside world, so server isn't the machine this node code is running on
    console.log('server_system_stats', program.host);
    results.server_system_stats = "since client and server are not the same, server stats are irrelevant";
  } else {
    results.server_system_stats = await systemStats.get();
  }

  results.score = score(results);
  console.log(`New score: ${results.score}`);
  
  if (canCompare) { 
    compare(results, require(await getComparePath()));
  }  
  if (program.baseline) {
    const filePath = `${resultsFolder}/${componentName}-${baselineSuffix}.json`;
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8', err => {
      res.send(err ? 'error' : 'saved');
      console.log(`\nSaved new baseline to ${filePath}`);
    });
  }
}

/**
 * Computes the 'score': test time for component divided by baseline(input)
 * @param {object} resObj 
 */
function score(resObj) {
  return resObj.results.tests[1].time / resObj.results.tests[0].time;
}


function compare(newR, oldR) {
  const margin = 0.2; // "significant" if difference is bigger than margin. TODO: find best value for this

  function logResult(newT, oldT) {
    const result = newT / oldT;
    console.log(`current: ${newT.toFixed(2)}ms, previous:${oldT.toFixed(2)}ms`);
    if (result > (1 + margin)) {
      console.log(`new version is ${result.toFixed(2)} times slower`);
    } else if (result < (1 - margin)) {
      console.log(`new version is ${(1/result).toFixed(2)} times quicker`);
    } else {
      console.log(`new version performs similar`);
    }
  }

  console.log(`\n\n********  performance results for ${bowerJson.name}  ********`);

  // Check if old and new results came from similar browsers (versions) and OSes
  const [newSys, oldSys] = [newR.client_system_stats, oldR.client_system_stats];
  if (newSys.browser !== oldSys.browser || newSys.os !== oldSys.os) {
    console.log(`\nWarning: please make sure you are testing against the same browser and operating system as the baseline ([${oldSys.browser}, ${oldSys.os}] vs [${newSys.browser}, ${newSys.os}])`);
  }

  // Get old an new times based on results
  // Note the assumption is made here a test runnerfile always contains two single test files: 
  // 1) a generic baseline to measure relative performance against, not related to the component that needs to be tested (this file should be included by the poly-perf lib (in frametester component))
  // 2) the actual test specific for this component, measuring bootstrap time of the component

  const [newTime, oldTime] = [newR.results.tests[1].time, oldR.results.tests[1].time];

  console.log('\n[ ABSOLUTE RESULT ]');
  logResult(newTime, oldTime);

  console.log('\n[ RELATIVE RESULT ] (measured against generic baseline component)');
  logResult(score(newR), score(oldR));


  // TODO: use dep-snap to do a comparison for dependencies and measure their relative effect

  // TODO optional: show a git diff in the code
}


/// Main
(async function() {
  try {
    if (mode === 'init') {
      init();
    } else {
      let baselineSuffix;
      if (program.baseline) {
        baselineSuffix = await handleBaseline();
      } 
      const canCompare = await checkCompare(); // always do a comparison when possible
      const {browserProcess, redirectServer} = await runner.start(Object.assign(program, config, {name: componentName}));      
      const result = await proxyServer.run({redirectServer: redirectServer, port: program.port });
      await handleResult(result, baselineSuffix, canCompare);
      process.exit(0)
    }
  } catch (e) {
    console.warn(e.message);
    process.exit(1);
  }
}());

