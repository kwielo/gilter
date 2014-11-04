'use strict';

angular.module('gilterFilters')
  .filter('label', function () {
    return function (input, search) {
      var replacement = '<span class="or-and label label-default">%s</span>'.replace('%s', search);
      input = input.replace(search, replacement);
      return input;
    }
  });

