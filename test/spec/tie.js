(function () {

    "use strict";

    function fireEvent(eventName, element) {
        var event = new Event(eventName);
        element.dispatchEvent(event);
    }

    describe("tie checked binding", function() {

        /* global LacesModel, LacesTie */

        var checkbox,
            $checkbox,
            fieldset,
            $fieldset,
            div,
            $div,
            model,
            markup = '<input type="checkbox" data-tie="checked: checked">' +
                     '<fieldset data-tie="radio: pet">' +
                         '<legend>What is Your Favorite Pet?</legend>' +
                         '<input type="radio" name="animal" value="cat" />Cats<br />' +
                         '<input type="radio" name="animal" value="dog" />Dogs<br />' +
                         '<input type="radio" name="animal" value="bird" />Birds<br />' +
                         '<input type="submit" value="Submit now" />' +
                     '</fieldset>' +
                     '<div data-tie="attr[data-pet]: pet"></div>';

        beforeEach(function() {
            model = new LacesModel({ checked: true, pet: "dog" });
            var tie = new LacesTie(model, markup);

            checkbox = tie.render().firstChild;
            $checkbox = $(checkbox);

            fieldset = checkbox.nextSibling;
            $fieldset = $(fieldset);

            div = fieldset.nextSibling;
            $div = $(div);
        });

        it("initializes the elements correctly", function() {
            expect(checkbox.checked).to.be(true);
            expect($checkbox.prop("checked")).to.be(true);
            expect($fieldset.find("[value='cat']").prop("checked")).to.be(false);
            expect($fieldset.find("[value='dog']").prop("checked")).to.be(true);
            expect($fieldset.find("[value='bird']").prop("checked")).to.be(false);
            expect($div.data("pet")).to.be("dog");
        });

        it("updates the checkbox on model change", function() {
            model.set("checked", false);
            expect(checkbox.checked).to.be(false);
            expect($checkbox.prop("checked")).to.be(false);

            model.set("checked", true);
            expect(checkbox.checked).to.be(true);
            expect($checkbox.prop("checked")).to.be(true);
        });

        it("updates the model on checkbox change", function() {
            checkbox.checked = false;
            fireEvent("change", checkbox);
            expect(model.checked).to.be(false);

            checkbox.checked = true;
            fireEvent("change", checkbox);
            expect(model.checked).to.be(true);
        });

        it("updates the radio buttons and data attribute on model change", function() {
            model.pet = "bird";
            expect($fieldset.find("[value='cat']").prop("checked")).to.be(false);
            expect($fieldset.find("[value='dog']").prop("checked")).to.be(false);
            expect($fieldset.find("[value='bird']").prop("checked")).to.be(true);
            expect($div.attr("data-pet")).to.be("bird");

            model.pet = "cat";
            expect($fieldset.find("[value='cat']").prop("checked")).to.be(true);
            expect($fieldset.find("[value='dog']").prop("checked")).to.be(false);
            expect($fieldset.find("[value='bird']").prop("checked")).to.be(false);
            expect($div.attr("data-pet")).to.be("cat");
        });

        it("updates the model on radio button selection", function() {
            $fieldset.find("[value='bird']").prop("checked", true);
            fireEvent("change", fieldset.querySelector("input[value='bird']"));
            expect(model.pet).to.be("bird");

            $fieldset.find("[value='cat']").prop("checked", true);
            fireEvent("change", fieldset.querySelector("input[value='cat']"));
            expect(model.pet).to.be("cat");

            $fieldset.find("[value='dog']").prop("checked", true);
            fireEvent("change", fieldset.querySelector("input[value='dog']"));
            expect(model.pet).to.be("dog");
        });
    });
})();
