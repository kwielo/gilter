'use strict';

angular.module('gilterApp')
  .controller('mainCtrl', function ($scope, $http, x2js, filterConfig) {

    $scope.file = '../../data/mailFilters.xml';

    $http.get($scope.file)
      .then(function (response) {
        var xmlDoc = x2js.parseXmlString(response.data);
        $scope.filters = x2js.xml2json(xmlDoc);
        console.log($scope.filters);

      },
      function () {
      });

    $scope.criteria = filterConfig.getCriteria;

  });
