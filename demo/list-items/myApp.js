(function() {
  'use strict';

  angular.module('myapp', [
    'extension-registry'
  ])

  .config([
    function() {
      // nothing to do here, ATM
    }
  ])

  .controller('list', [
    '$scope',
    'extensionRegistry',
    function($scope, extensionRegistry) {
      // arbitrary args to pass to the extension
      $scope.args = [1,2,3,4,5];

      // Adding a type will register the template string with the $templateCache
      // and allow the directive to know how to deal with the new option, if it
      // set in the extension-type attribute:
      //  <extension-point extension-type="text <new-type>"
      extensionRegistry.addType('li', '<li>{{item.text}}</li>');
    }
  ]);

})();
