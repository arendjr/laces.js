/*global describe, it */
'use strict';
(function () {
    describe('laces models', function () {
        describe('when bound to an array', function () {
            var array,
                event,
                storeEvent = function(e) {
                    event = e;
                };
            beforeEach(function() {
                array = new LacesArray([1, 2, 3]);
                array.bind('add', storeEvent);
                array.bind('delete', storeEvent);
                array.bind('update', storeEvent);
                array.bind('change', storeEvent);
            });
            it('supports add', function () {
                array.push(4);
                assert.deepEqual(event, {
                    elements: [4],
                    name: 'change'
                });
            });
            it('supports delete', function () {
                array.remove(2);
                assert.deepEqual(event, {
                    elements: [3],
                    name: 'delete'
                });
            });
        });
    });
})();
