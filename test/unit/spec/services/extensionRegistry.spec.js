'use strict';

describe('angularExtensionRegistry', () => {
  var extensionRegistry;
  var rootScope;
  // fillers for the .get() request if nothing explicit needed
  // var noFilter = [];
  var noLimit = 9999;
  var randomArgs = ['foo', 'bar'];

  beforeEach(angular.mock.module('extension-registry'));
  beforeEach(angular.mock.inject(($rootScope, _extensionRegistry_) => {
      extensionRegistry = _extensionRegistry_;
      rootScope = $rootScope;
  }));

  // TODO: test
  // run `gulp serve` & view /demo/list-items for now to
  // manually see/test this functionality until unit tests put in place
  describe('.setComparator()', () => {
    describe('when given a custom comparator function', () => {
      xit('should...');
    });
  });

  describe('.add()', () => {
      describe('when a data object is registered to an endpoint', () => {
        it('should be able to get the object from the endpoint', () => {
          var endpointName = 'get-from-endpoint';
          var textFilter = ['text'];
          var data = [{
            type: 'text',
            text: 'This is some text'
          }];

          extensionRegistry.add(endpointName, () => {
            return data;
          });

          extensionRegistry
            .get(endpointName, textFilter, randomArgs, noLimit)
            .then((items) => {
              expect(items.length).toEqual(1);
            });

          rootScope.$digest();
        });
      });

      describe('when multiple data objects with different types are registered to an endpoint', () => {
        var allFilters = ['text', 'link', 'dom', 'other'];
        var randomArgs = ['foo', 'bar'];
        var data = [
          {type: 'text'},
          {type: 'text'},
          {type: 'link'},
          {type: 'link'},
          {type: 'dom'},
          {type: 'other'}
        ];
        // helper so we can grow the text cases
        var typeCounter = (items, types) => {
          types = _.isArray(types) ? types : [types];
          return _.reduce(
                  items,
                  (result, next) => {
                    if(_.includes(types, next.type)) {
                      result++;
                    }
                    return result;
                  }, 0);
        };

        it('should be able to limit the number of objects retrieved', () => {
          var endpointName = 'limited';
          extensionRegistry.add(endpointName, () => {
            return data;
          });
          // test a few arbitrary limits
          extensionRegistry
            .get(endpointName, allFilters, randomArgs, 1)
            .then((items) => {
              expect(items.length).toEqual(1);
            });
          extensionRegistry
            .get(endpointName, allFilters, randomArgs, 2)
            .then((items) => {
              expect(items.length).toEqual(2);
            });
          extensionRegistry
            .get(endpointName, allFilters, randomArgs, 5)
            .then((items) => {
              expect(items.length).toEqual(5);
            });

          rootScope.$digest();
        });

        it('should be able to filter the retrieved items by type', () => {
          var endpointName = 'filter-retrieved';
          var toTest = [
            // single
            ['text', typeCounter(data, 'text')],
            ['link', typeCounter(data, 'link')],
            ['dom', typeCounter(data, 'dom')],
            ['other', typeCounter(data, 'other')]
          ];

          extensionRegistry.add(endpointName, () => {
            return data;
          });

          // toTest = an array of arrays of 1. a filter type and 2. an expected count
          _.each(toTest, (filterToTest) => {
            var filter = [_.first(filterToTest)];
            var count = _.last(filterToTest);
            extensionRegistry
              .get(endpointName, filter, randomArgs, noLimit)
              .then((items) => {
                expect(items.length).toEqual(count);
              });
          });

          rootScope.$digest();
        });

        it('should be able to filter items by multiple types', () => {
          var endpointName = 'filtered-multiple-types';
          var toTest = [
            [['text', 'link'], typeCounter(data, ['text', 'link'])],
            [['dom', 'other'], typeCounter(data, ['dom', 'other'])],
          ];

          extensionRegistry.add(endpointName, () => {
            return data;
          });

          // toTest = an array of arrays of 1. a filter type and 2. an expected count
          _.each(toTest, (filterToTest) => {
            var filter = _.first(filterToTest);
            var count = _.last(filterToTest);
            extensionRegistry
              .get(endpointName, filter, randomArgs, noLimit)
              .then((items) => {
                expect(items.length).toEqual(count);
                expect(_.includes(items, {type: 'foo'})).toEqual(false);
                expect(_.includes(items, {type: 'bar'})).toEqual(false);
              });
          });

          rootScope.$digest();
        });
      });

      describe('when a promise for data objects is registered', () => {
        // TODO: verify data from a resolved promise is included w/other data
        xit('should do....');
      });

      describe('when multiple endpoints are registered', () => {
        // TODO: verify registered data does not leak into other endpoints
        xit('should do...');
      });

      describe('when there is a delay before data is registered', () => {
        // TODO:
        // - validate an initial set via .notify()
        // - validate an updated set via a later call to .notify()
        // - note that notify is an internal function and prob does not need
        //   a separate describe() entry
      });
  });

  describe('.get()', () => {
    // NOTE: .add() and .get() are tested in unison above
    // it probably makes sense to sort them, though .get() is
    // not intended to be a public api.  it is used behind the
    // scenes by the directive.  Even so, it may be more productive
    // to test it & skip the setup
    describe('when data items with a weight property are displayed', () => {

      it('should list unweighted items following first in, first out', () => {
        var endpointName = 'first-in-first-out';
        // TODO: when PR #66 lands, factor out these wrapper functions
        extensionRegistry.add(endpointName, function() {
          return _.times(2, () => {
            return {
              type: 'text', text: _.uniqueId()
            };
          });
        });

        extensionRegistry.add(endpointName, function() {
          return _.times(2, () => {
            return {
              type: 'text', text: 'hello world'
            };
          });
        });
        extensionRegistry.add(endpointName, function() {
          return _.times(2, () => {
            return {
              type: 'text', text: _.uniqueId()
            };
          });
        });
        extensionRegistry
          .get(endpointName, ['text'], [], noLimit)
          .then((items) => {

            expect(items).toEqual([
              {type:"text",text:"1"},
              {type:"text",text:"2"},
              {type:"text",text:"hello world"},
              {type:"text",text:"hello world"},
              {type:"text",text:"3"},
              {type:"text",text:"4"}
            ]);
          });
        rootScope.$digest();
      });

      it('should order items by weight', () => {
        var endpointName = 'order-by-weight';
        var items = [
          {type:"text",weight: 1},
          {type:"text",weight: 0},
          {type:"text",weight: 6},
          {type:"text",weight: 5},
          {type:"text",weight: 49},
          {type:"text",weight: 2},
        ];
        extensionRegistry.add(endpointName, function() {
          return items;
        });
        extensionRegistry
          .get(endpointName, ['text'], randomArgs, noLimit)
          .then(function(items) {
            expect(items).toEqual([
               { type:"text", weight:0 },
               { type:"text", weight:1 },
               { type:"text", weight:2 },
               { type:"text", weight:5 },
               { type:"text", weight:6 },
               { type:"text", weight:49}
            ]);
          });
        rootScope.$digest();
      });

      // this test covers weighted & unweighted items
      // - Shows that lack of item.weight is a valid use case
      // NOTE: Unclear about stability of weight:0 vs/lack of weight property.
      it('should treat items without a weight as weight: 0', () => {
        var endpointName = 'without-a-weight-0';
        var items = [
          {type:"text",weight: 1},
          {type:"text",weight: 0},
          {type:"text",weight: 6},
          {type:"text",weight: 5},
          {type:"text" },
          {type:"text" },
          {type:"text",weight: -5},
          {type:"text",weight: -10}
        ];
        extensionRegistry.add(endpointName, function() {
          return items;
        });
        extensionRegistry
          .get(endpointName, ['text'], randomArgs, noLimit)
          .then(function(items) {
            expect(items).toEqual([
              {type:"text",weight: -10},
              {type:"text",weight: -5},
              {type:"text", weight:0},
              {type:"text"},
              {type:"text"},
              {type:"text",weight:1},
              {type:"text", weight:5},
              {type:"text", weight:6}
            ]);
          });
        rootScope.$digest();
      });

      // cover strings, objects, arrays, etc
      it('should treat items with invalid weight as weight: 0', () => {
        var endpointName = 'invalid-weight-0';
        var typeToTest = 'text';
        var firstSet = [
          {type:typeToTest, weight: 1},
          {type:typeToTest, weight: 0},
          {type:typeToTest  },
          // quirky values
          // {type:typeToTest, weight: '' }, empty string cast to number: 0, skipping test case
          {type:typeToTest, weight: NaN},
          {type:typeToTest, weight: null},
          {type:typeToTest, weight: undefined},
          {type:typeToTest, weight: false},
          {type:typeToTest, weight: true},
          {type:typeToTest, weight: function() {}},
          {type:typeToTest, weight: 'invalid'},
          {type:typeToTest, weight: []},
          {type:typeToTest, weight: {}},
          // end quirky
          {type:typeToTest, weight: 20},
          {type:typeToTest  },
          {type:typeToTest, weight: 10},
          {type:typeToTest, weight: '5'},
          {type:typeToTest  },
          {type:typeToTest, weight: '2'}
        ];
        // to test a two set sort
        // see the manual test file /demo/list-items/index.html
        // for this + delayed promise resolution to validate that
        // the sort functionality still works async
        var secondSet = [
          {type:typeToTest, weight: 30  },
          {type:typeToTest, weight: 20  },
          {type:typeToTest, weight: -30 },
          {type:typeToTest, weight: -20 },
          {type:typeToTest, weight: -5  },
          {type:typeToTest, weight: 40  },
          {type:typeToTest, weight: 50  },
          {type:typeToTest, weight: 10  },
          {type:typeToTest, weight: null},
          {type:typeToTest, weight: 'late registry' }
        ];
        extensionRegistry.add(endpointName, function() {
          return firstSet;
        });

        extensionRegistry.add(endpointName, function() {
          return secondSet;
        });


        extensionRegistry
          .get(endpointName, ['text'], randomArgs, noLimit)
          .then(function(results) {
            var originalCount = firstSet.length + secondSet.length;
            var resultCount = results.length;
            // the invalid set will "hover" between weight:0 & weight:1
            var invalidSet = results.slice(4,18);

            // TODO: can we update this to look something like:
            // it would make debugging easier. right now reporting is cryptic
            // it('should sort so that sorted[i] matches expectedSorted[i] at index i', function() {
            //  item specific code here...
            // })
            expect(resultCount).toEqual(originalCount);
            // floaters (valid weights) are ordered as expected
            expect(_.nth(results, results.length - 1).weight).toEqual(50);
            expect(_.nth(results, results.length - 2).weight).toEqual(40);
            expect(_.nth(results, results.length - 3).weight).toEqual(30);
            expect(_.nth(results, results.length - 4).weight).toEqual(20);
            expect(_.nth(results, results.length - 5).weight).toEqual(20);
            expect(_.nth(results, results.length - 6).weight).toEqual(10);
            expect(_.nth(results, results.length - 7).weight).toEqual(10);
            expect(_.nth(results, results.length - 8).weight).toEqual("5");
            expect(_.nth(results, results.length - 9).weight).toEqual("2");
            expect(_.nth(results, results.length - 10).weight).toEqual(1);
              // handle negative numbers
            expect(_.nth(results, results.length - 25).weight).toEqual(0);
            expect(_.nth(results, results.length - 26).weight).toEqual(-5);
            expect(_.nth(results, results.length - 27).weight).toEqual(-20);
            expect(_.nth(results, results.length - 28).weight).toEqual(-30);
            // handle invalid cases & undefined
            // these cases are expected to hover between weight:0 & weight:1
            // but we are not explicitly assigning them a reliable order,
            // therefore the fact that they appear in the center slice of
            // our results array is a sufficient test.
            expect(_.some(invalidSet, ['weight', null])).toEqual(true);
            expect(_.some(invalidSet, ['weight', undefined])).toEqual(true);
            expect(_.some(invalidSet, ['weight', false])).toEqual(true);
            expect(_.some(invalidSet, ['weight', true])).toEqual(true);
            expect(_.some(invalidSet, ['weight', []])).toEqual(true);
            expect(_.some(invalidSet, ['weight', {}])).toEqual(true);
            expect(_.some(invalidSet, ['weight', "invalid"])).toEqual(true);
            expect(_.some(invalidSet, ['weight', "late registry"])).toEqual(true);
          });
        rootScope.$digest();
      });
    });
  });

  describe('.remove()', () => {
    describe('when data is deregistered', () => {
      // TODO: verify that .add() returns a handler w/a .remove() method
      // TODO: verify that extensionRegistry.remove(handler) does the same as above
      // TODO: verify other data is not removed if multiple registries
      });
  });

  // NOTE: this is an internal util
  describe('.clean()', () => {
    xit('should clear the registry');
  });

  // NOTE: this is an internal util
  describe('.dump()', () => {
    // TODO; it should probably return a copy of the registry
    // so that it cannot be manipulated
    xit('should return the registry');
  });

  describe('.addType()', () => {
    describe('when a new type is added', () => {
      // TODO:
      xit('should add the type to the template cache');
    });
  });

});
