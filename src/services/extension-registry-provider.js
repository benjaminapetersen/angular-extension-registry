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
            isNaN = utils.isNaN;


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
            },
            // default weight assignment comparator,
            // can override in config with setComparator
            toWeight = function(value) {
              value = parseInt(value, 10);
              return isNaN(value) ? 0 : value;
            },
            comparator = function(a, b) {
              return toWeight(a.weight) - toWeight(b.weight);
            },
            setComparator = function(customComparator) {
              comparator = customComparator;
            };

        this.add = add;
        this.dump = dump;
        this.clean = clean;
        this.setComparator = setComparator;

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
                                          sort(memo, comparator);
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
