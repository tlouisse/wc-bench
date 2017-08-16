///  Load libs and files
const express = require('express');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');


function run({redirectServer = null, port = 3000} = {}) {
  return new Promise((resolve, reject) => {
    try {

      ///  Create express app  
      const app = express();
      app.listen(port);

      ///  Create proxy  
      const proxy = httpProxy.createProxyServer();

      ///  Intercept posts to store performance data
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));

      app.post('/result', async(req, res, next) => {
        resolve({req, res, next});
        next();
      });

      ///  Proxy all other traffic to polyserve
      app.all("*", (req, res) => {
        proxy.web(req, res, {
          target: redirectServer
        });
      });


    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  run : run
};