const istanbul = require('istanbul');
const istanbulHelpers = require('./lib/instanbul-helpers.js')();
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const clr = require('cli-color');
var path = require('path');

const ThresholdReporter = function (baseReporterDecorator, config, logger) {
  const log = logger.create('Threshold');
  const thresholds = path.join(process.env.PWD, '/karma_thresholds.json');
  const collector = new istanbul.Collector();
  var failedExpectation = false;

  baseReporterDecorator(this);

  this.onBrowserComplete = function (browser, result) {
    if (result && result.coverage) {
      collector.add(result.coverage);
    }
  };

  this.onSpecComplete = function (browser, result) {
    if (result && result.coverage) {
      collector.add(result.coverage);
    }
  };

  this.writeNewThresholds = function (string) {
    fs.writeFileAsync(thresholds, string);
  };

  this.getPastThreshold = function () {
    var fexists;
    try {
      fs.accessSync(thresholds, fs.F_OK);
      fexists = true;
    } catch (e) { fexists = false; }
    if (fexists) return fs.readFileAsync(thresholds, 'utf8');
    return Promise.resolve(null);
  };

  this.space = function (len) {
    const col = 20 - len;
    var spaces = '';
    for (var i = 0; col > i; i++) spaces += ' ';
    return spaces;
  };

  this.getConsoleLine = function (key, newThreshold, oldThreshold) {
    var name = `${key}${this.space(key.length + 2)}`;
    var ol = `${oldThreshold.percent}%`;
    var olSkipped = '';
    var nw = `${newThreshold.percent}%`;
    var nwSkipped = '';

    if (newThreshold.skipped || oldThreshold.skipped) {
      nwSkipped = ` skipped: ${newThreshold.skipped}`;
      olSkipped = ` skipped: ${oldThreshold.skipped}`;
    }

    nw += clr.yellow(nwSkipped) + this.space(nw.length + nwSkipped.length + 1);
    ol += clr.yellow(olSkipped) + this.space(ol.length + olSkipped.length + 1);

    return `${name}${clr.green('|')} ${ol} ${clr.green('|')} ${nw}`;
  };

  this.meetsThresholds = function (newThresholds, oldThresholds) {
    var failure = false;

    if (!oldThresholds) return failure;
    try { oldThresholds = JSON.parse(oldThresholds); } catch (e) { oldThresholds = {}; }

    console.log('\n============= Threshold Comparison summary =====================');
    console.log('----------------------------------------------------------------');
    console.log('Key                 | Old                 | New                 ');
    console.log('----------------------------------------------------------------');

    Object.keys(oldThresholds).forEach((key) => {
      var color = clr.green;
      var notification = '\u2713';
      var line = this.getConsoleLine(key, newThresholds[key], oldThresholds[key]);
      if (newThresholds[key].percent < oldThresholds[key].percent) {
        failure = true;
        notification = '\u2717';
        color = clr.red;
      }
      console.log(color(`${notification} ${line}`));
    });
    console.log('----------------------------------------------------------------');
    console.log('================================================================\n');

    return failure;
  };

  this.runThresholdTests = function (done, oldThresholds) {
    const summaries = {};
    var newThresholds = {};

    collector.files().forEach(function (file) {
      var fileCoverage = collector.fileCoverageFor(file);
      summaries[file] = istanbulHelpers.summarize(fileCoverage);
    });

    newThresholds = istanbulHelpers.getThresholds(summaries);
    failedExpectation = this.meetsThresholds(newThresholds, oldThresholds);

    if (failedExpectation) {
      log.error('Coverage dropped below last run.');
      process.on('exit', function () {
        process.exit(1);
      });
    } else {
      this.writeNewThresholds(JSON.stringify(newThresholds));
    }

    done();
  };

  // process the coverage thresholds before exiting
  this.onExit = function (done) {
    this.getPastThreshold().then(this.runThresholdTests.bind(this, done));
  };
};

module.exports = {
  'reporter:coveragedrop': ['type', ThresholdReporter]
};
