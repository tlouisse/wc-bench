<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- <script src="../../bower_components/webcomponentsjs/webcomponents-lite.js"></script> -->
  <link rel="import" href="../../node_modules/wc-bench/client-lib/frame-tester.html"> 
</head>
<body>
  <summary>${componentName} Performance</summary>
  <frame-tester runs="25" strategy="onedev"></frame-tester>
  <script>
    var wcReady = false;
    addEventListener('WebComponentsReady', function() {
      if(wcReady) return; //since event fires twice
      wcReady = true;
      document.querySelector('frame-tester').tests = [
        'harness.html?wc-element=${componentName}&wc-path=../../../${componentName}.html'
      ];
    });
  </script>
</body>
</html>
