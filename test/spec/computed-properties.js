(function () {

    "use strict";

    describe("laces model", function () {

        /* global LacesModel */

        var model;

        beforeEach(function() {
            model = new LacesModel({ firstName: "Arend", lastName: "van Beelen" });
        });

        it("supports computed properties", function() {
            assert.equal(model.firstName, "Arend");

            model.set("fullName", function() {
                return this.firstName + " " + this.lastName;
            });

            assert.equal(model.fullName, "Arend van Beelen");

            model.firstName = "Arie";

            assert.equal(model.fullName, "Arie van Beelen");
        });
    });
})();
