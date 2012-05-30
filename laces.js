(function(window, undefined) {

// Constructor.
function LacesState() {

    this._values = {};
    this._functions = {};
    this._changeListeners = {};
}

// Define a new property. Once defined, the property may be used like any other
// JavaScript property (that is, using the dot-notation).
//
// propertyName - Name of the property to define.
// value - Initial value of the property. If it is a function, the function's
//         return value is used. If the function references any other properties
//         of this state, implicit bindings will be created for them.
// dependencies - (Optional) Array of explicit dependencies for this property.
LacesState.prototype.defineProperty = function(propertyName, value, dependencies) {

    if (this._values.hasOwnProperty(propertyName)) {
        this.log("Property '" + propertyName + "' already defined.");
        return;
    }

    var self = this;
    if (typeof value === "function") {
        dependencies = dependencies || [];
        
        var source = value.toString();
        var regExp = /this.(\w+)/g;
        
        var match;
        while ((match = regExp.exec(source)) !== null) {
            dependencies.push(match[1]);
        }

        dependencies.forEach(function(dependency) {
            //self.log("Making binding from " + dependency + " to " + propertyName);
            self.bind(dependency, function() {
                self._reevaluate(propertyName);
            }, { "noInitialFire": true });
        });

        this._functions[propertyName] = value;

        value = value.apply(this);
    }

    Object.defineProperty(this, propertyName, {
        "get": function() { return self._values[propertyName]; },
        "set": function(newValue) { return self._setValue(propertyName, newValue); }
    });

    this._setValue(propertyName, value);
}

// Binds a callback to a property so that it will be called every time the value
// of the property changes. If the property is already defined, the callback will
// be triggered right away too (unless the noInitialFire option is used).
//
// propertyName - Name of the property to be watched by the callback.
// callback - The callback to call whenever the property changes value. The
//            callback will receive newValue and oldValue parameters.
// options - (Optional) Options object. Set the noInitialFire property to true to
//           disable the initial firing of the callback when the property is
//           defined.
LacesState.prototype.bind = function(propertyName, callback, options) {

    options = options || {};

    if (!this._changeListeners[propertyName]) {
        this._changeListeners[propertyName] = [];
    }
    this._changeListeners[propertyName].push(callback);

    if (!options.noInitialFire && this._values.hasOwnProperty(propertyName)) {
        callback.apply(this, [this._values[propertyName]]);
    }
}

LacesState.prototype._setValue = function(propertyName, newValue) {

    var oldValue = this._values[propertyName];
    if (newValue !== oldValue) {
        this._values[propertyName] = newValue;

        if (this._changeListeners[propertyName]) {
            var self = this;
            this._changeListeners[propertyName].forEach(function(callback) {
                callback.apply(self, [newValue, oldValue]);
            });
        }
    }
}

LacesState.prototype._reevaluate = function(propertyName) {

    var newValue = this._functions[propertyName].apply(this);
    this._setValue(propertyName, newValue);
}

LacesState.prototype.log = function(message) {

    if (window.console) {
        console.log(message);
    }
}

if (window.define !== undefined) {
    define(function(require) { return LacesState; });
} else {
    window.LacesState = LacesState;
}

}(this));
