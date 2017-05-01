/* jshint unused: false */
(function() {
  'use strict';


  angular
    .module('myapp')
    .factory('aFactory', function() {

    })
    // arbitrary run block, most likely wrapper for tapping into the system
    // from the outside.
    .run([
      '$q',
      '$timeout',
      'extensionRegistry',
      function($q, $timeout, extensionRegistry) {

        // random mess of valid & invalid weights
        extensionRegistry.add('list', function() {
          return [
            {type:"li", text: '1',                        weight: 1             },
            {type:"li", text: '0',                        weight: 0             },
            {type:"li", text: 'n/a              -1',                            },
            {type:"li", text: 'NaN              -9999',   weight: NaN           },
            {type:"li", text: 'null             -9999',   weight: null          },
            {type:"li", text: 'undefined        -1',      weight: undefined     },
            {type:"li", text: 'false            -9999',   weight: false         },
            {type:"li", text: 'true             -9999',   weight: true          },
            {type:"li", text: 'function() {}    -9999',   weight: function() { }},
            {type:"li", text: '20',                       weight: 20            },
            {type:"li", text: 'n/a              -1',                            },
            {type:"li", text: '10',                       weight: 10            },
            {type:"li", text: '"invalid"        -9999',   weight: 'invalid'     },
            {type:"li", text: '"5"',                      weight: '5'           },
            {type:"li", text: 'n/a              -1',                            },
            {type:"li", text: '2',                        weight: '2'           },
            {type:"li", text: '[]               -9999',   weight: []            },
            {type:"li", text: '{}               -9999',   weight: {}            }
          ];
        });

        // delay 4 seconds & ensure sorted in properly
        $timeout(function() {
          extensionRegistry.add('list', function() {
            return [
              {type:"li", text: '30',                         weight: 30              },
              {type:"li", text: '20',                         weight: 20              },
              {type:"li", text: '-30',                        weight: -30             },
              {type:"li", text: '-20',                        weight: -20             },
              {type:"li", text: '-5',                         weight: -5              },
              {type:"li", text: '40',                         weight: 40              },
              {type:"li", text: '50',                         weight: 50              },
              {type:"li", text: '10',                         weight: 10              },
              {type:"li", text: 'null               -9999',   weight: null            },
              {type:"li", text: '"late registry"    -9999',   weight: 'late registry' },
            ];
          });
        }, 4000);

      }
    ]);

})();
