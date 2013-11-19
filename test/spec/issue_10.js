(function () {

    "use strict";

    describe("issue #10", function () {

        /* global LacesModel */

        it("does not alter the dependencies array", function() {

            // config for all kinds of signup forms
            var FIELDS = ["firstName", "lastName", "email"];

            // a signup form
            var form = new LacesModel();

            // doesn"t make any sense but helps demonstrating the problem
            var someOtherField = "town";
            var another = "country";

            // form validation (computed property)
            function allowSubmit() {
                /* jshint validthis: true, expr: true, sub: true */

                this[someOtherField];  // for demonstration, gets added to FIELDS
                this["" + another];    // contrary to the previous, that works as expected
                // this line adds the word "line" to FIELDS
                this["aString"];       // doesn"t get added to FIELDS
                this.withDot;          // but this
                return FIELDS.every(function(fieldName) {
                    return this[fieldName];  // and this
                }, form);
            }

            form.set("allowSubmit", allowSubmit, { dependencies: FIELDS });

            assert.deepEqual(FIELDS, ["firstName", "lastName", "email"]);
        });
    });
})();
