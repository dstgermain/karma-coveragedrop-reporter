module.exports = function istanbulHelpers() {
  function _percent(covered, total) {
    if (total > 0) {
      return Math.floor((1000 * 100 * covered / total + 5) / 10) / 100;
    } else {
      return 100.00;
    }
  }

  function _addOne(boolean) {
    return boolean ? 1 : 0;
  }

  function _compute(file, prop, mprop) {
    const stats = file[prop];
    const map = mprop ? file[mprop] : null;
    const summary = { total: 0, covered: 0, skipped: 0 };

    Object.keys(stats).forEach(function (key) {
      const covered = !!stats[key];
      const skipped = map && map[key].skip;
      summary.total += 1;
      summary.covered += _addOne(covered || skipped);
      summary.skipped += _addOne(!covered && skipped);
    });

    summary.percent = _percent(summary.covered, summary.total);
    return summary;
  }

  function _branchesLoop(branches, map, summary) {
    for (var i = 0, length = branches.length; i < length; i++) {
      var covered = branches[i] > 0;
      var skipped = map.locations && map.locations[i] && map.locations[i].skip;
      summary.covered += _addOne(covered || skipped);
      summary.skipped += _addOne(!covered && skipped);
    }

    return summary;
  }

  function _computeBranches(file) {
    var summary = { total: 0, covered: 0, skipped: 0 };

    Object.keys(file.b).forEach(function (key) {
      summary = _branchesLoop(file.b[key], file.branchMap[key], summary);
      summary.total += file.b[key].length;
    });

    summary.percent = _percent(summary.covered, summary.total);
    return summary;
  }

  function _updateTotals(summaries, key) {
    var summary = { total: 0, covered: 0, skipped: 0 };

    Object.keys(summaries).forEach(function (map) {
      if (summaries[map] && typeof summaries[map] === 'object' &&
        summaries[map][key] && typeof summaries[map][key] === 'object') {
        summary.total += summaries[map][key].total;
        summary.covered += summaries[map][key].covered;
        summary.skipped += summaries[map][key].skipped;
      }
    });

    return summary;
  }

  function summarize(file) {
    var summary = {};
    summary.lines = _compute(file, 'l');
    summary.functions = _compute(file, 'f', 'fnMap');
    summary.statements = _compute(file, 's', 'statementMap');
    summary.branches = _computeBranches(file);

    return summary;
  }

  function getThresholds(summaries) {
    const summary = {};
    const keys = ['lines', 'statements', 'branches', 'functions'];

    keys.forEach(function (key) {
      summary[key] = _updateTotals(summaries, key);
      summary[key].percent = _percent(summary[key].covered, summary[key].total);
    });

    return summary;
  }

  return {
    summarize,
    getThresholds
  };
};
