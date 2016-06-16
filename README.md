# karma-coveragedrop-reporter

Fail the build if the coverage falls below a past run.

Plugin creates a file called karma_thresholds.json, this file saves the past run info and needs to be included in the repo (or it will always pass).

## Installation
```
npm install --save-dev karma-coveragedrop-reporter karma
```

## Configuration

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    plugins: ['karma-coverage-drop-reporter'], // this should be auto loaded so this line is optional
    reporters: ['coveragedrop'],

  });
};
```
