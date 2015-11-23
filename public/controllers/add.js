angular.module('MyApp')
  .controller('AddCtrl', ['$scope', '$alert', 'Show', function($scope, $alert, Show) {
    $scope.addShow = function() {
      Show.save({ showName: $scope.showName },
        function() {
          // Clear the form by setting it to empty string
          // And changing its state from $dirty to $pristine.
          $scope.showName = '';
          $scope.addForm.$setPristine();
          // $alert is part of the AngularStrap library.
          $alert({
            content: 'TV show has been added.',
            placement: 'top-right',
            type: 'success',
            duration: 3
          });
        },
        // handling erros.
        function(response) {
          $scope.showName = '';
          $scope.addForm.$setPristine();
          $alert({
            content: response.data.message,
            placement: 'top-right',
            type: 'danger',
            duration: 3
          });
        });
    };
  }]);
