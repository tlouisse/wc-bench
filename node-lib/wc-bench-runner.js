///  Load libs and files
const fs = require('fs');
const path = require('path');
const opn = require('opn');
const chilp = require('./chilp');

function getRunnerParams(params) {
  const paramKeys = Object.keys(params);
  let str = paramKeys.length ? '?' : '';
  paramKeys.forEach((k,i) =>  str += `wc-${k}=${params[k]}${(i !==paramKeys.length-1) ? '&' : ''}`);
  return str;
}

/**
 * 
 * @param {object} config : configuration object
 * @param {number} config.polymer : Polymer version
 * @param {string} config.name : Name of Polymer element (repo name)
 */
function start({polymer = 2, host = "127.0.1", port = 3000, name = null, testsFolder = null, browser = ['google chrome', '--incognito'], strategy = null, runs = null, count = null } = {}) {
  
  return new Promise((resolve, reject) => {
    try {

      chilp.spawn('polymer serve', {
        onStdout: startBrowser // when process logs, child server is spawned
      });

      const polyServer = {
        "2": `http://${host}:8081`, // This is the port where 'mainline' (aka Polymer 2 for hybrid elements) is run 
        "1": `http://${host}:8000` // This is the port where Polymer 1.x is run 
      }

      const redirectServer = polyServer[polymer];

      function startBrowser(data) {
        console.log(data);
        // Polymer serve outputs data, meaning it has spawned. Now automatically open browser
        const url = `http://${host}:${port}` + `/components/${name}/${testsFolder}/wc-bench/${getRunnerParams({strategy, runs, count})}`;
        opn(url, { wait: false, app: browser })
          .then(browserProcess => {
            resolve({browserProcess, redirectServer})
            console.log(`started test in Polymer ${polymer} context for ${browser[0]} on ${url}`);            
          })
          .catch(e => reject(e));        
      }

    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  start: start
};