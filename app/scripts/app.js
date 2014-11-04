'use strict';

/**
 * @ngdoc overview
 * @name gilterApp
 * @description
 * # gilterApp
 *
 * Main module of the application.
 */
angular
  .module('gilterApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'cb.x2js',
    'gilterFactories',
    'gilterFilters',
    'gilterDirectives'
  ])
  .config(function($stateProvider, $urlRouterProvider) {
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('main', {
        url: '/',
        controller: 'mainCtrl',
        templateUrl: 'views/main.html'
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/about.html'
      })
      .state('contact', {
        url: '/contact',
        templateUrl: 'views/contact.html'
      });
  });


angular.module('gilterFactories', []);

angular.module('gilterFilters', []);

angular.module('gilterDirectives', []);
