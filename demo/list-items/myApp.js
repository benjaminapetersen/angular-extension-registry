(function() {
  'use strict';

  angular.module('myapp', [
    'extension-registry'
  ])

  .config([
    'extensionRegistryUtils',
    'extensionRegistryProvider',
    function(utils, extensionRegistryProvider) {
      // example custom comparator, which was the current comparator prototype
      // similar to the built in, but more granular control sets invalid values to -9999.
      var isString = utils.isString,
          isNaN = utils.isNaN,
          isNumber = utils.isNumber,
          isUndefined = utils.isUndefined,
          invalidVal = -9999,
          strToUsableNum = function(val) {
            var test = Number(val);
            return isNaN(test) ?
                    invalidVal :
                    test;
          },
          toWeight = function(value) {
            return isNaN(value) ?
                    invalidVal :
                    isNumber(value) ?
                      value :
                      isString(value) ?
                        strToUsableNum(value) :
                        isUndefined(value) ?
                          -1 :
                          invalidVal;
          };
      // can optionally override the comparator with a custom
      // comparator function
      extensionRegistryProvider.setComparator(function(a, b) {
        console.log('Using custom comparator');
        return toWeight(a.weight) - toWeight(b.weight);
      });
      // show that `add()` works up-front
      extensionRegistryProvider.add('list', function() {
        return [{type:"li", text: 'Lalala',    weight: 1  }];
      });
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
