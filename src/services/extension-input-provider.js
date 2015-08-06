angular.module('extension-registry')

.provider('extensionInput', [
  'extensionRegistryUtils',
  function(utils) {
    var registry = {},
        subscribers = {},
        keyStart = 1000,
        split = utils.split,
        slice = utils.slice,
        each = utils.each,
        map = utils.map,
        contains = utils.contains,
        filter = utils.filter,
        flatten = utils.flatten,
        reduce = utils.reduce,
        ownKeys = utils.ownKeys,
        toArray = utils.toArray,
        isFunction = utils.isFunction;

    // methods available in provider && service context
    var
        notify = function() {
          each(toArray(subscribers), function(fn) {
            fn && fn();
          });
        },
        register = function(name, builderFn) {
          var key = keyStart++;
          if(!registry[name]) {
            registry[name] = {};
          }
          if(builderFn && isFunction(builderFn)) {
            registry[name][key] = builderFn;
            notify();
          }
          return {
            deregister: function() {
              delete registry[name][key];
              notify();
            }
          };
        },
        dump = function() {
          return registry;
        },
        clean = function() {
          registry = {};
        }

    // provider context export
    this.register = register;
    this.dump = dump;
    this.clean = clean;

    // service context export
    this.$get = [
        '$log',
        '$q',
        function($log, $q) {
          return {
            register: register,
            get: function(names, filters, args, limit) {
                return $q.all(
                          flatten(
                            reduce(
                              map(
                                split(names, ' '),
                                function(n) {
                                  return registry[n];
                                }),
                              function(memo, next, i, list) {
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
                                        function(item, index, list) {
                                          if(contains(filters, item && item.type)) {
                                            return item;
                                          }
                                        }),
                                    function(memo, next, i, list) {
                                      if(memo.length >= limit) {
                                        return memo;
                                      }
                                      memo.push(next);
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
