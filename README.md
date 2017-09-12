# wc-bench

`wc-bench` is a macro benchmarking tool for (web) components. It spawns a browser that runs `polyperf`[https://github.com/PolymerLabs/polyperf/] on the client. It loads a baseline test, accompanied by one or more component tests (each in their own iframe) a configurable number of times, and presents the result for the selected strategy(minimum, onedev or median). After polyperf has run, results are sent to the wc-bench process, which gives an overview of relative and absolute performance compared to the baseline component and the selected comparison baseline test result(which is the previously released(tagged) version of the git repository by default)


## Installation
Please install via:
```
npm install wc-bench
```
In order to run wc-bench, chrome, polymer-cli and git need to be installed


## Initialization
To setup your repo, run:
```
wc-bench init
```
This will setup your repo with a test runner for your main entry in bower.json.


## Baseline
In order to be able to do regression test against earlier versions of your component, you must set a baseline (a json file with a stored test run).
```
wc-bench run --baseline
```
By default, a bseline will be tied to the latest commit (preferably a tag). Make sure there are no uncommitted changes when you run the baseline, because they could affect the performance results. It's also possible to give a baseline a name (as a temporary reference point.) Named baselines can be created at any time and are not tied to a commit.

```
wc-bench run --baseline 'myBaseline'
```


## Compare
By default, wc-bench will run a comparison against the performance result of the latest tagged version of the repository. Coparing will give you a small report with the differemce between your current code and your stored baseline. Run:
```
wc-bench run --compare
```
It's possible to run a comparison against a certain commit or named baseline. Run:
```
wc-bench run --compare <commit-hash>
```
or
```
wc-bench run --compare 'myBaseline'
```


## Scoring factor
All runs have a scoring result stored. This is the performance relative to the baseline element(native input element).
The score is the average bootstrap time of your component divided by the average bootstrap time of the input.
So the lower your score, the better. 
Please note that scores should only be compared when their tests ran on the same machine, under the same conditions.


## Reliability of test result comparisons
Make sure to run your tests on a stable machine, with the same setup (browser, OS, available memory / cpu, power supply, etc) between runs.

Since the client tooling(polyperf) is written for the webcomponentsjs v0 spec and to prevent eventual collisions with the v1 polyfill, only the Chrome browser will be supported currently(which supports the v0 spec by default.)


## Browser support
Since polyperf is written with web components in V0 spec, only Chrome (which handles V0 by default) is supported by Polyperf. (In theory, all browsers can be supported by loading the webcomponents v0 polyfill, but this complicates installation by introducing a bower dependency (that can be conflicting in a Polymer 2/webcomponents v1 component), plus it appears that loading the polyfill interferes with running the tests in some cases ).   
