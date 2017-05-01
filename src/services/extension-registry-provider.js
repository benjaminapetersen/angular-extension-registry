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
