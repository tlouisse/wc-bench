<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="import" href="../../node_modules/wc-bench/client-lib/frame-tester.html"> 
  <link rel="import" href="../../node_modules/wc-bench/client-lib/frame-runner.html"> 
</head>
<body>
  <summary>${componentName} Performance</summary>
  <frame-tester runs="25" strategy="onedev"></frame-tester>
  <script>
      WcRunner.init(document.querySelector('frame-tester'), [
        'harness.html?wc-element=${componentName}&wc-path=../../../${componentName}.html'
      ]);
  </script>
</body>
</html>
