/*global describe, it */
'use strict';
(function () {
    describe('laces models', function () {
        describe('when bound to an array', function () {
            var array,
                events,
                storeEvent = function(e) {
                    events.push(e);
                };

            beforeEach(function() {
                array = new LacesArray([1, 2, 3]);
                array.bind('add', storeEvent);
                array.bind('update', storeEvent);
                array.bind('remove', storeEvent);
                array.bind('change', storeEvent);
                
                events = [];
            });

            it('supports add', function () {
                array.push(4);

                assert.deepEqual(array, [1, 2, 3, 4]);

                assert.equal(events.length, 2);
                assert.deepEqual(events[0], {
                    elements: [4],
                    name: 'add'
                });
            });

            it('supports delete', function () {
                array.remove(2);

                assert.deepEqual(array, [1, 2]);

                assert.equal(events.length, 2);
                assert.deepEqual(events[0], {
                    elements: [3],
                    name: 'remove'
                });
            });
        });
    });
})();
