///  Load libs and files
const microstats = require('microstats');
const os = require('os');


///  Gather system stats (notice these are server stats, which means client and server should be same machine for them to be relevant)
function getSystemStats() {

  return new Promise((resolve, reject) => {
    try {
      
      let stats = {
        os: {
          platform: os.platform(),
          release: os.release(),
          type: os.type()
        }
      };

      const measurements = ['cpu', 'memory', 'disk'];

      function storeStats(ms, val) {
        stats[ms] = val;
        if (!measurements.find(m => !(m in stats))) { // all measurements done
          microstats.stop();
          resolve(stats);
        }
      }

      microstats.on('memory', value => storeStats('memory', value));
      microstats.on('cpu', value => storeStats('cpu', value));
      microstats.on('disk', value => storeStats('disk', value));
      microstats.start({
        frequency: 'once'
      }, err => err && reject(err));

    } catch (e) {
      reject(e);
    }

  });
}

module.exports = {
    get : getSystemStats
}