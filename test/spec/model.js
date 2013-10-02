(function () {

    "use strict";

    describe("laces model", function () {

        /* global LacesModel */

        it("supports computed properties", function() {
            var model = new LacesModel({ firstName: "Arend", lastName: "van Beelen" });

            assert.equal(model.firstName, "Arend");

            model.set("fullName", function() {
                return this.firstName + " " + this.lastName;
            });

            assert.equal(model.fullName, "Arend van Beelen");

            model.firstName = "Arie";

            assert.equal(model.fullName, "Arie van Beelen");
        });

        it("supports nested properties", function() {
            var model = new LacesModel();

            model.set("user", { name: "Arend" });
            model.set("displayName", function() {
                return this.user.name || "Anonymous";
            });

            assert.equal(model.displayName, "Arend");

            model.user.name = "Arie";

            assert.equal(model.displayName, "Arie");

            model.user = { name: "Arend" };

            assert.equal(model.displayName, "Arend");
        });

        it("supports binding to a nested property before it's defined", function() {
            var model = new LacesModel({
                user: null,
                displayName: function() {
                    return this.user && this.user.name || "Anonymous";
                }
            });

            assert.equal(model.displayName, "Anonymous");

            model.user = { name: "Arend" };

            assert.equal(model.displayName, "Arend");

            model.user.name = "Arie";

            assert.equal(model.displayName, "Arie");

            model.user = null;

            assert.equal(model.displayName, "Anonymous");
        });

        it("supports nested properties within nested objects", function() {
            var model = new LacesModel({
                user: null,
                displayAddress: function() {
                    return this.user && this.user.address &&
                           (this.user.address.street + " " + this.user.address.number + ", " +
                            this.user.address.city) ||
                           "No address given";
                }
            });

            assert.equal(model.displayAddress, "No address given");

            model.user = {
                name: "Arend",
                address: {
                    street: "Haarlemmrweg",
                    number: 195,
                    city: "Amsterdam"
                }
            };

            assert.equal(model.displayAddress, "Haarlemmrweg 195, Amsterdam");

            model.user.address.street = "Haarlemmerweg";

            assert.equal(model.displayAddress, "Haarlemmerweg 195, Amsterdam");
        });

        it("supports nested arrays", function() {
            var model = new LacesModel();
            model.set("rooms", [{ "id": 1 }, { "id": 3 }]);
            model.set("numRooms", function() { return this.rooms.length; });
            model.set("lastRoomId", function() {
                return this.rooms.length === 0 ? undefined : this.rooms[this.rooms.length - 1].id;
            });

            assert.equal(model.numRooms, 2);
            assert.equal(model.lastRoomId, 3);

            model.rooms.push({ "id": 7 });

            assert.equal(model.numRooms, 3);
            assert.equal(model.lastRoomId, 7);

            model.rooms[2].id = 4;

            assert.equal(model.numRooms, 3);
            assert.equal(model.lastRoomId, 4);
        });

        it("supports nested maps", function() {
            var model = new LacesModel();
            model.set("rooms", {
                "1": { "id": 1 },
                "3": { "id": 3 }
            });

            model.set("numRooms", function() {
                var count = 0;
                for (var id in this.rooms) {
                    if (this.rooms.hasOwnProperty(id)) {
                        count++;
                    }
                }
                return count;
            });

            assert.equal(model.numRooms, 2);

            model.rooms.set(7, { "id": 7 });

            assert.equal(model.numRooms, 3);
        });

        it("supports bindings", function() {
            var newValue = null;
            var oldValue = null;

            var model = new LacesModel({
                firstName: "Arend",
                lastName: "van Beelen",
                fullName: function() {
                    return this.firstName + " " + this.lastName;
                }
            });
            model.bind("change:fullName", function(event) {
                newValue = event.value;
                oldValue = event.oldValue;
            });

            assert.equal(model.fullName, "Arend van Beelen");

            model.firstName = "Arie";

            assert.equal(newValue, "Arie van Beelen");
            assert.equal(oldValue, "Arend van Beelen");
        });
    });
})();
