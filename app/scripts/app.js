'use strict';

/**
 * @ngdoc overview
 * @name parkingpriceApp
 * @description
 * # parkingpriceApp
 *
 * Main module of the application.
 */
angular
  .module('parkingpriceApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
  }).config(['$locationProvider', function ($locationProvider) {
    $locationProvider.hashPrefix('');
  }]);