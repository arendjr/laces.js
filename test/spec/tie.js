/*global describe, it */
'use strict';
(function () {
    describe('tie checked binding', function () {
        var node,
            $node,
            model,
            markup = '<input type="checkbox" data-laces-checked="checked">';
        beforeEach(function() {
            model = new LacesModel({
                checked: true
            });
            var tie = new LacesTie(model, markup);
            node = tie.render();
            $node = $(node);
        });

        it('initialises the element correctly', function () {
            expect(node.checked).to.be(true);
            expect($node.prop('checked')).to.be(true);
        });
        it('updates the element on model change', function() {
            model.set('checked', false);
            expect(node.checked).to.be(false);
            expect($node.prop('checked')).to.be(true);
            model.set('checked', true);
            expect(node.checked).to.be(true);
            expect($node.prop('checked')).to.be(false);
        });
        it('updates the model on element change', function() {
            $node.prop('checked', false);
            expect(model.checked).to.be(false);
            $node.prop('checked', true);
            expect(model.checked).to.be(true);
        });
    });
})();
