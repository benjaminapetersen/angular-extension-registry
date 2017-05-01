angular.module('extension-registry', [
  'extension-registry-utils'
]);

(function() {
  'use strict';

  angular
    .module('extension-registry-utils', [

    ])
    // ONLY constants are available to a provider,
    // thus, this collection of functions is a constant.
    .constant('extensionRegistryUtils', (function(undefined) {

      var // to string vals
          numToString = '[object Number]',
          arrToString = '[object Array]',
          objToString = '[object Object]',
          funcToString = '[object Function]',
          strToString = '[object String]',
          // utils
          unbind = Function.prototype.bind.bind(Function.prototype.call),
          // strings
          split = unbind(String.prototype.split),
          // is of type
          toString = unbind(Object.prototype.toString),
          isString = function(obj) {
            return toString(obj) === strToString;
          },
          isArray = function(obj) {
            return toString(obj) === arrToString;
          },
          isObject = function(obj) {
            return toString(obj) === objToString;
          },
          isNumber = function(obj) {
            return toString(obj) === numToString;
          },
          isFunction = function(obj) {
            return toString(obj) === funcToString;
          },
          // isNaN hels with the quirks of NaN
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
          //  return Number.isNaN(Number(value));
          // https://github.com/lodash/lodash/blob/4.17.4/lodash.js#L11906
          isNaN = function(val) {
            // coercion is intentional here
            return isNumber(val) && val != +val; // jshint ignore:line
          },
          isUndefined = function(val) {
            return val === undefined;
          },
          isNull = function(val) {
            return val === null;
          },
          isNil = function(val) {
            // coercion is intentional here
            return val == null;  // jshint ignore:line
          },
          // arrays
          push = unbind(Array.prototype.push),
          slice = unbind(Array.prototype.slice),
          sort = unbind(Array.prototype.sort),
          each = function(arr, fn) {
            for(var i = 0; i < arr.length; i++) {
              fn(arr[i], i, arr);
            }
          },
          map = function(arr, fn) {
            var list = [];
            for(var i = 0; i < arr.length; i++) {
              list.push(fn(arr[i], i, arr));
            }
            return list;
          },
          filter = function(arr, fn) {
            var list = [];
            for(var i=0;i<arr.length;i++) {
              if(fn(arr[i],i, arr)) {
                list.push(arr[i]);
              }
            }
            return list;
          },
          reduce = function(arr, fn, memo) {
            for(var i = 0; i < arr.length; i++) {
              memo = fn(memo, arr[i], i, arr);
            }
            return memo;
          },
          contains = function() {
            var list = arguments[0],
                rest = slice(arguments, 1),
                successes = [];
            each(rest, function(toMatch) {
              each(list, function(item) {
                if(item === toMatch) {
                    successes.push(true);
                }
              });
            });
            if(successes.length === rest.length) {
              return true;
            }
            return false;
          },
          flatten = function(arr) {
            var flattened = [];
            each(arr, function(item) {
              if(isArray(item)) {
                flattened = flattened.concat(flatten(item));
              } else {
                flattened = flattened.concat(item);
              }
            });
            return flattened;
          },
          // objects
          ownKeys = function(obj) {
            var list = [];
            for(var prop in obj) {
              if(obj.hasOwnProperty(prop)) {
                list.push(prop);
              }
            }
            return list;
          },
          toArray = function(obj) {
            var list = [];
            for(var prop in obj) {
              if(obj.hasOwnProperty(prop)) {
                list.push(obj[prop]);
              }
            }
            return list;
          };

      return {
              // utils
              unbind: unbind,
              // strings
              split: split,
              // arrays/lists
              push: push,
              slice: slice,
              sort: sort,
              contains: contains,
              each: each,
              map: map,
              reduce: reduce,
              filter: filter,
              flatten: flatten,
              ownKeys: ownKeys,
              toArray: toArray,
              isString: isString,
              isFunction: isFunction,
              isObject: isObject,
              isNumber: isNumber,
              isNaN: isNaN,
              isNull: isNull,
              isUndefined: isUndefined,
              isNil: isNil
            };
    })());

})();

(function() {
  'use strict';

  angular
    .module('extension-registry')
    .provider('extensionRegistry', [
      'extensionRegistryUtils',
      function(utils) {
        var registry = {},
            subscribers = {},
            keyStart = 1000,
            push = utils.push,
            split = utils.split,
            slice = utils.slice,
            sort = utils.sort,
            each = utils.each,
            map = utils.map,
            contains = utils.contains,
            filter = utils.filter,
            flatten = utils.flatten,
            reduce = utils.reduce,
            ownKeys = utils.ownKeys,
            toArray = utils.toArray,
            isFunction = utils.isFunction,
            isNaN = utils.isNaN,
            isString = utils.isString,
            isNumber = utils.isNumber,
            isUndefined = utils.isUndefined,
            // TODO: externalize this validator
            // so that a custom sorter could be provided
            invalidVal = -9999,
            strToUsableNum = function(val) {
              var test = Number(val);
              return isNaN(test) ?
                      invalidVal :
                      test;
            },
            // ensures any provided weight is usable.
            // see the unit test for weight
            // - numbers returned as numbers
            // - undefined returned as -1 (explicit 0 has greater weight)
            // - strings returned as numbers || -9999 (invalid)
            // - all other objects returned as -9999 (invalid)
            // this function is intentionally resilient as it is assumed
            // extensions could be registered by various parties.  Those
            // who use sensible weights should be able to trust sorting
            // placement
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

        // methods available in provider && service context
        var
            notify = function() {
              each(toArray(subscribers), function(fn) {
                fn && fn();
              });
            },
            add = function(name, builderFn) {
              var key = keyStart++;
              if(!registry[name]) {
                registry[name] = {};
              }
              if(builderFn && isFunction(builderFn)) {
                registry[name][key] = builderFn;
                notify();
              }
              // handle.remove() will deregister, otherwise pass to:
              // extensionRegistry.remove(handle)
              return {
                _name: name,
                _key: key,
                remove: function() {
                  delete registry[name][key];
                  notify();
                }
              };
            },
            // alt to handle.remove(), see above
            remove = function(handle) {
              delete registry[handle._name][handle._key];
              notify();
            },
            dump = function() {
              return registry;
            },
            clean = function() {
              registry = {};
            };

        // provider context export
        this.add = add;
        this.dump = dump;
        this.clean = clean;

        // service context export
        this.$get = [
            '$log',
            '$q',
            '$templateCache',
            function($log, $q, $templateCache) {
              return {
                // helper for registering new type templates with $templateCache
                // using a fn to generate rather than inline in view avoids
                // $sce issues due to string interpolation.
                addType: function(type, tpl) {
                  $templateCache.put('__extension-'+type+'.html', tpl);
                },
                add: add,
                remove: remove,
                get: function(names, filters, args, limit) {
                    return $q.all(
                              flatten(
                                reduce(
                                  map(
                                    split(names, ' '),
                                    function(n) {
                                      return registry[n];
                                    }),
                                  function(memo, next) {
                                    return memo.concat(
                                      flatten(
                                        map(
                                          ownKeys(next),
                                          function(key) {
                                            return next[key] && next[key](args);
                                          })));
                                  }, [])))
                              .then(function() {
                                return reduce(
                                        filter(
                                          flatten(
                                            slice(arguments)),
                                            function(item) {
                                              if(contains(filters, item && item.type)) {
                                                return item;
                                              }
                                            }),
                                        function(memo, next) {
                                          if(memo.length >= limit) {
                                            return memo;
                                          }
                                          push(memo, next);
                                          // - heaviest falls.
                                          // - no weight: -1
                                          // - invalid weight: -9999
                                          sort(memo, function(a, b) {
                                            return toWeight(a.weight) - toWeight(b.weight);
                                          });
                                          return memo;
                                        }, []);
                                      });
                },
                subscribe: function(fn) {
                  var key = keyStart++;
                  subscribers[key] = fn;
                  return {
                    unsubscribe: function() {
                      delete subscribers[key];
                    }
                  };
                },
                dump: dump,
                clean: clean
              };
            }];
      }
    ]);

})();

(function() {
  'use strict';

  angular
    .module('extension-registry')
    .directive('extensionPoint', [
      '$compile',
      '$templateCache',
      'extensionRegistryUtils',
      function($compile, $templateCache, utils) {
        var each = utils.each,
            tplPath =  function(type) {
              return '__extension-'+type+'.html';
            };
        return {
          restrict: 'EA',
          scope: {
            extensionName: '=',
            extensionFilters: '=',
            extensionArgs: '=',
            extensionLimit: '='
          },
          transclude: true,
          controller: [
            '$scope',
            '$q',
            'extensionRegistry',
            function($scope, $q, extensionRegistry) {
              this.initialize = function($elem, name, filters) {
                var resolve = function() {
                                $q
                                  .when(extensionRegistry
                                          .get(name, filters, $scope.extensionArgs, Number($scope.extensionLimit)))
                                  .then(function(items) {
                                    $elem.html('');
                                    each(items, function(item) {
                                      $elem
                                        .append(
                                          $compile(
                                            (item.type === 'dom') ?
                                                       item.node :
                                                       $templateCache.get(tplPath(item.type))
                                          )(angular
                                            .extend(
                                              $scope.$new(true),
                                              {item: item})));

                                    });
                                  });
                              };
                resolve();

                var registry = extensionRegistry.subscribe(resolve);
                $scope.$on('$destroy', function() {
                  registry.unsubscribe();
                });
              };
            }
          ],
          link: function($scope, $elem, $attrs, ctrl) {
            var name = $attrs.extensionName,
                filters = $attrs.extensionTypes && $attrs.extensionTypes.split(' ') || [],
                args = $attrs.extensionArgs || {};

            angular.extend($scope, {
              extTpl: tplPath
            });

            ctrl.initialize($elem, name, filters, args);
          }
        };
      }
    ]);
})();

(function() {
  'use strict';

  angular.module('extension-registry')
    .directive('extensionRenderer', [
      '$compile',
      function($compile) {
        return {
          restrict: 'AE',
          //replace: true,
          scope: {
            item: '=',
            index: '=',
            context: '='
          },
          templateUrl: '__extension-renderer.html',
          link: function($scope, $elem) {
            $scope.extTpl = function(type) {
              return '__extension-'+type+'.html';
            };
            if($scope.item.type === 'dom') {
              $elem.html($scope.item.node);
              $compile($elem.contents())($scope);
            }
          }
        };
      }]);
})();
