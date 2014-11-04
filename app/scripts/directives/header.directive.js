'use strict';

angular.module('gilterDirectives')
  .directive('glHeader', function ($compile) {
    return {
      restrict: 'AE',
      replace: false,
      transclude: true,
      scope: { filter: '=glHeader' },
      templateUrl: 'views/partials/glHeader.html',
      controller: function ($scope) {
        $scope.props = $scope.filter.property;
      }
    };
  });
