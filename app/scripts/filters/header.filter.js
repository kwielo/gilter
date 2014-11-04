'use strict';

angular.module('gilterFilters')
  .filter('header', function () {
    return function (arr) {
      if (typeof arr !== "Array" && typeof arr !== "object") {
        throw new Error("Input data for fHeader filter must be an array or object, not an %1".replace('%1', typeof arr));
      }
      var filtered = [];
      angular.forEach(arr, function (el) {
        if (el._name === 'from' || el._name === 'to') {
          filtered.push(el);
        }
      });
      return filtered;
    }
  });

