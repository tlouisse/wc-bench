# wc-bench

`wc-bench` is a macro benchmarking tool for (web) components. It spawns a browser that runs `polyperf`[https://github.com/PolymerLabs/polyperf/] on the client. It loads a baseline test, accompanied by one or more component tests (each in their own iframe) a configurable number of times, and presents the result for the selected strategy(minimum, onedev or median). After polyperf has run, results are sent to the wc-bench process, which gives an overview of relative and absolute performance compared to the baseline component and the selected comparison baseline test result(which is the previously tagged version of the git repository by default)


## Macro benchmarking vs micro benchmarking



## Reliability of test result comparisons




## Installation
Since polyperf is written in web components,  the webcomponentsjs polyfill needs to be installed via bower

```
npm install wc-bench
bower install webcomponentsjs
```

## Run
By default, wc-bench will run a comparison against the performance result of the latest tagged version of the repository
```
wc-bench
```



Then navigate to  [http://localhost:8080/components/polyperf/sample/runner.html](http://localhost:8080/components/polyperf/sample/runner.html). The results will look something like this:

<img width="469" alt="screen shot 2016-11-03 at 12 54 32" src="https://cloud.githubusercontent.com/assets/1369170/19982787/b20dee9e-a1c4-11e6-8d2b-d7f607eaeff9.png">

The tests are run by `runner.html`, which defines the list of tests to run. Edit `runner.html` to choose test pages to run, and how many times each test should be run. By default, each test runs 25 times, but you can configure it by changing the `frame-tester`'s `runs` attribute:

```
<frame-tester runs="25"></frame-tester>
```

There are two different ways to configure your tests:


### Using specific tests
Use this approach if you want to repeat a custom test that does something
more than just repeating an element in a page.

In `runner.html`, modify the array of tests in `document.querySelector('frame-tester').tests` as follows:

```
document.querySelector('frame-tester').tests = [
  'test1.html',
  'test2.html'
];
```

Where `test.1.html` is the specific webpage to test. Each test page should include

```
<script src="perf-lib/perf.js"></script>
```

and call

```html
<script>
  console.perf();
</script>
```

before the snippet of code to test, followed by

```html
<script>
   console.perfEnd();
</script>
```

after the snippet of code to test.
