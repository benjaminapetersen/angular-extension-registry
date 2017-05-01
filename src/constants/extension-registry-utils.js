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
