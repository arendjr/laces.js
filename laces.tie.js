(function(window, document, undefined) {

"use strict";

// Laces Tie constructor.
//
// model - The Laces Model to which we want to tie the template. May be a Laces
//         Map too.
// template - The template object used for rendering. May be a compiled
//            Handlebars.js, Hogan.js or Underscore.js template, or a plain HTML
//            string.
// options - Optional options object.
function LacesTie(model, template, options) {

    options = options || {};
    var editEvent = options.editEvent || "dblclick";
    var saveEvent = options.saveEvent || "blur";

    var bindings = [];

    function clearBindings() {

        for (var i = 0, length = bindings.length; i < length; i++) {
            var binding = bindings[i];
            binding.parent.unbind(binding);
        }
        bindings = [];
    }

    function reference(lacesProperty) {
        var parts = lacesProperty.split(".");
        var part, value, parent;
        for (var i = 0, length = parts.length; i < length; i++) {
            parent = value || model;

            part = parts[i];
            var bracketOpen = part.indexOf("[");
            if (bracketOpen > -1 && part.indexOf("]") === part.length - 1) {
                var subscript = part.substring(bracketOpen + 1, part.length - 1);
                parent = parent[part.substr(0, bracketOpen)];
                part = subscript;
            }

            value = parent[part];
            if (value === undefined || value === null) {
                break;
            }
        }
        return { propertyName: part, value: value, parent: parent };
    }

    function update(element, lacesProperty) {
        var value = reference(lacesProperty).value || "";
        if (element.tagName.toLowerCase() === "input") {
            element.value = value;
        } else {
            element.textContent = value;
        }
    }

    function process(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        var lacesProperty = node.getAttribute("data-laces-property");
        if (lacesProperty) {
            var binding = function() {
                update(node, lacesProperty);
            }
            bindings.push(binding);

            var ref = reference(lacesProperty);
            binding.parent = ref.parent;
            if (ref.parent.constructor.name === "LacesModel") {
                ref.parent.bind("change:" + ref.propertyName, binding);
                model.log("Bound change:" + ref.propertyName);
            } else {
                model.log("Bound change " + ref.propertyName);
                ref.parent.bind("change", binding);
            }

            if (node.tagName.toLowerCase() === "input") {
                node.addEventListener(saveEvent, function() {
                    var newRef = reference(lacesProperty);
                    newRef.parent[newRef.propertyName] = node.value;
                });
            }

            update(node, lacesProperty);

            if (node.getAttribute("data-laces-editable") === "true") {
                node.addEventListener(editEvent, function() {
                    var parent = node.parentNode;
                    var input = document.createElement("input");
                    input.setAttribute("type", "text");
                    input.setAttribute("value", node.textContent);

                    input.addEventListener(saveEvent, function() {
                        var newRef = reference(lacesProperty);
                        newRef.parent[newRef.propertyName] = input.value;
                        parent.insertBefore(node, input.nextSibling);
                        parent.removeChild(input);
                    });

                    parent.insertBefore(input, node.nextSibling);
                    parent.removeChild(node);
                    input.focus();
                });
            }
        }

        for (var i = 0, length = node.childNodes.length; i < length; i++) {
            process(node.childNodes[i]);
        }
    }

    function parse(html) {
        var fragment = document.createDocumentFragment();
        var div = document.createElement("div");
        div.innerHTML = html;
        while (div.firstChild) {
            var child = div.firstChild;
            process(child);
            fragment.appendChild(child);
        }
        return fragment;
    }

    if (template.render) {
        this.render = function() { clearBindings(); return parse(template.render(model)); };
    } else if (typeof template === "function") {
        this.render = function() { clearBindings(); return parse(template(model)); };
    } else if (typeof template === "string") {
        this.render = function() { clearBindings(); return parse(template); };
    } else {
        model.log("Unknown template type: " + template);
    }
}


if (typeof define === "function" && define.amd) {
    define(function(require) {
        var Laces = require("Laces");
        Laces.Tie = LacesTie;
        return Laces;
    });
} else {
    window.LacesTie = LacesTie;
}

})(this, document);
