'use strict';

angular.module('gilterFactories')
  .factory('filterConfig', function () {
    var criteria = [
      {name: 'from', type: 'string'},
      {name: 'to', type: 'string'},
      {name: 'subject', type: 'string'},
      {name: 'hasTheWord', type: 'string'},
      {name: 'doesNotHaveTheWord', type: 'string'},
      {name: 'hasAttachment', type: 'boolean'}
    ];

    return {
      getCriteria: criteria
    };
  });