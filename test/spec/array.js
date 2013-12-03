(function () {

    "use strict";

    describe("laces array", function () {

        /* global LacesArray */

        var array,
            event,
            storeEvent = function(e) { event = e; };

        beforeEach(function() {
            array = new LacesArray([1, 2, 3]);
        });

        it("supports add", function() {
            array.bind("add", storeEvent);
            array.push(4);

            assert.deepEqual(array, [1, 2, 3, 4]);

            assert.deepEqual(event, {
                elements: [4],
                index: 3,
                name: "add"
            });
        });

        it("supports remove", function() {
            array.bind("remove", storeEvent);
            array.remove(2);

            assert.deepEqual(array, [1, 2]);

            assert.deepEqual(event, {
                elements: [3],
                index: 2,
                name: "remove"
            });
        });

        it("supports map elements", function() {
            array.bind("add", storeEvent);
            array.push(new LacesMap({ a: 1, b: 2 }));

            assert.deepEqual(array, [1, 2, 3, { a: 1, b: 2 }]);

            assert.deepEqual(event, {
                elements: [{ a: 1, b: 2 }],
                index: 3,
                name: "add"
            });
        });
    });
})();
