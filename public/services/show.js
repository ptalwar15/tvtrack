angular.module('MyApp')
  // to query all shows and an individual show by id.
  .factory('Show', ['$resource', function($resource) {
    return $resource('/api/shows/:_id');
  }]);

  // Show service has following methods.
  // { 'get':    {method:'GET'},
  //   'save':   {method:'POST'},
  //   'query':  {method:'GET', isArray:true},
  //   'remove': {method:'DELETE'},
  //   'delete': {method:'DELETE'} };
