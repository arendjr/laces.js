(function(window) {

// Laces Object constructor.
//
// This is the base class for the other laces object types. You should not
// instantiate this class directly. Instead, use LacesArray, LacesMap or
// LacesModel. The methods defined here are available on all said object types.
function LacesObject() {

    this._bindings = [];
    this._eventListeners = {};
    this._eventsPaused = false;
}

// Bind an event listener to the event with the specified name.
//
// eventName - Name of the event to bind to. Can be "add", "change", "remove" or
//             "change:<propertyName>".
// listener - Callback function that will be invoked when the event is fired.
//            The callback will receive an event parameter, the contents of
//            which relies on the event parameter given to the fire() method.
LacesObject.prototype.bind = function(eventName, listener) {

    if (!this._eventListeners.hasOwnProperty(eventName)) {
        this._eventListeners[eventName] = [];
    }
    this._eventListeners[eventName].push(listener);
};

// Fire an event and invoke all the listeners bound to it.
//
// eventName - Name of the event to fire.
// event - Optional event object to pass to the listener callbacks. If ommitted,
//         the empty object is assumed. Either way, the "name" property will be
//         set to match the event name.
LacesObject.prototype.fire = function(eventName, event) {

    this.log("Firing " + eventName);
    if (!this._eventsPaused && this._eventListeners.hasOwnProperty(eventName)) {
        event = event || {};
        event.name = eventName;

        var listeners = this._eventListeners[eventName];
        for (var i = 0, length = listeners.length; i < length; i++) {
            listeners[i].call(this, event);
        }
    }
};

LacesObject.prototype.log = function(message) {

    if (typeof console !== "undefined" && console.log) {
        console.log("laces.js: " + message);
    }
};

// Pause all firing of events. When called, no change events will be fired from
// this object until resumeEvents() is called.
//
// Warning: Use this method at your own risk! Properties that depend on other
// properties may lose their consistency.
LacesObject.prototype.pauseEvents = function() {

    this._eventsPaused = true;
};

// Resume firing of events. Call this method after pauseEvents() to resume
// firing of events.
LacesObject.prototype.resumeEvents = function() {

    this._eventsPaused = false;
};

// Unbind a previously bound listener callback.
//
// eventName - Name of the event to which the listener was bound.
// listener - Callback function to unbind.
LacesObject.prototype.unbind = function(eventName, listener) {

    if (!this._eventListeners.hasOwnProperty(eventName)) {
        return false;
    }

    var index = this._eventListeners[eventName].indexOf(listener);
    if (index > -1) {
        this._eventListeners[eventName].splice(index, 1);
        return true;
    } else {
        return false;
    }
};

LacesObject.prototype.wrap = function(value) {

    var wrapped;
    if (value && value._gotLaces) {
        wrapped = value;
    } else if (value instanceof Array) {
        wrapped = new LacesArray();
        for (var i = 0, length = value.length; i < length; i++) {
            wrapped.set(i, value[i]);
        }
    } else if (value instanceof Function) {
        wrapped = value;
    } else if (value instanceof Object) {
        wrapped = new LacesMap(value);
    } else {
        wrapped = value;
    }
    return wrapped;
};

LacesObject.prototype._gotLaces = true;

LacesObject.prototype._bindValue = function(key, value) {

    var event = {
        "key": key,
        "value": value
    };

    if (value && value._gotLaces) {
        var self = this;
        var binding = function() {
            self.fire("change:" + key, event);
            self.fire("change", event);
        };
        value.bind("change", binding);
        this._bindings.push(binding);
    }
};

LacesObject.prototype._unbindValue = function(value) {

    if (value && value._gotLaces) {
        for (var i = 0, length = this._bindings.length; i < length; i++) {
            if (value.unbind("change", this._bindings[i])) {
                this._bindings.splice(i, 1);
                break;
            }
        }
    }
};


// Laces Map constructor.
//
// Laces maps behave like a map or dictionary with get(), set() and remove()
// methods. Once a property has been set you may also use JavaScript's native
// dot notation for access (both getting and setting).
//
// When a property inside the map is changed, "add", "change" and/or "remove"
// events are fired.
//
// object - Optional object to initialize the map with. Properties will be
//          initialized for all key/value pairs of the object using the set()
//          method.
function LacesMap(object) {

    LacesObject.call(this);

    this._values = {};
    
    if (object) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                this.set(key, object[key]);
            }
        }
    }
}

LacesMap.prototype = new LacesObject();
LacesMap.prototype.constructor = LacesMap;

// Return the value of a property.
//
// This method is provided for consistency. It is advised however to use
// JavaScript's native dot notation for accessing properties of a map.
//
// key - Key of the property to return.
LacesMap.prototype.get = function(key) {

    return this._values[key];
};

// Remove a property.
//
// key - Key of the property to remove.
LacesMap.prototype.remove = function(key) {

    if (this._values.hasOwnProperty(key)) {
        var value = this._values[key];
        this._unbindValue(value);
        delete this._values[key];
        delete this[key];

        var event = {
            "key": key,
            "oldValue": value
        };
        this.fire("remove", event);
        this.fire("change:" + key, event);
        this.fire("change", event);

        return true;
    } else {
        return false;
    }
};

// Set a property.
//
// Use this method to initially set a property with its value. Once set, it is
// advised to use JavaScript's native dot notation for accessing properties.
//
// key - Key of the property to set.
// value - Value of the property to set.
// options - Optional options object. May contain a type property, which if set
//           determines the type which will be enforced on the property. The
//           following values are recognized for the type property:
//           "boolean"        - The property will be either true or false.
//           "float"/"number" - The property will be a floating point number.
//           "integer"        - The property will be an integer number.
//           "string"         - The property will be a string.
LacesMap.prototype.set = function(key, value, options) {

    options = options || {};

    var self = this;
    var getter = function() { return this._values[key]; };
    var setter = function(newValue) { return self._setValue(key, newValue); };

    if (typeof value === "function") {
        this._setValue(key, value);
        setter = function() { self.log("Function properties cannot be set."); };
    } else if (options.type) {
        if (options.type === "boolean") {
            setter = function(newValue) { return self._setValue(key, !!newValue); };
        } else if (options.type === "float" || options.type === "number") {
            setter = function(newValue) { return self._setValue(key, parseFloat(newValue, 10)); };
        } else if (options.type === "integer") {
            setter = function(newValue) { return self._setValue(key, parseInt(newValue, 10)); };
        } else if (options.type === "string") {
            setter = function(newValue) { return self._setValue(key, "" + newValue); };
        }
        setter(value);
    } else {
        this._setValue(key, value);
    }

    Object.defineProperty(this, key, {
        "get": getter,
        "set": setter
    });
};

LacesMap.prototype._setValue = function(key, value) {

    value = this.wrap(value);

    var event = {
        "key": key,
        "value": value
    };

    var newProperty = false;
    if (this._values.hasOwnProperty(key)) {
        var oldValue = this._values[key];

        this._unbindValue(oldValue);

        event.oldValue = oldValue;
    } else {
        newProperty = true;
    }

    this._values[key] = value;

    this._bindValue(key, value);

    if (newProperty) {
        this.fire("add", event);
    }
    this.fire("change:" + key, event);
    this.fire("change", event);
};


// Laces Model constructor.
//
// Laces models behave exactly like Laces maps, with only one exception: When a
// property is assigned a function as its value, the return value of the
// function is used as value for the property. If the function references other
// properties of the model, the value will automatically get updated when one of
// those other properties is updated. The properties which the function
// references are automatically detected if they have the form of
// "this.propertyName". References to properties of properties and array
// elements of properties are detected as well. If the function depends on other
// (non-detected) properties, you can specify those by giving an array of
// dependencies as part of the options argument to the set() method.
//
// Examples:
//
//   // references to the "firstName" and "lastName" properties get detected
//   // automatically:
//   model.set("fullName", function() {
//       return this.firstName + " " + this.lastName
//   });
//
//   // dependencies on properties that are referenced in a "hidden" way need to
//   // be specified explicitly:
//   model.set("displayName", function() {
//       return (this.preferredName === "lastName" ? this.title + " " : "") +
//              this[this.preferredName]
//   }, {
//       "dependencies": ["firstName", "lastName", "fullName"]
//   });
//
// object - Optional object to initialize the model with. Properties will be
//          initialized for all key/value pairs of the object using the set()
//          method.
function LacesModel(object) {

    this._functions = {};

    LacesMap.call(this, object);
}

LacesModel.prototype = new LacesMap();
LacesModel.prototype.constructor = LacesModel;

LacesModel.prototype.set = function(key, value, options) {

    options = options || {};

    if (typeof value === "function") {
        var dependencies = options.dependencies || [];

        this._functions[key] = value;

        var source = value.toString();

        var match;
        var regExp = /this.(\w+)/g;
        while ((match = regExp.exec(source)) !== null) {
            var dependencyName = match[1];
            if (dependencies.indexOf(dependencyName) === -1) {
                dependencies.push(dependencyName);
            }
        }

        var self = this;
        for (var i = 0, length = dependencies.length; i < length; i++) {
            var dependency = dependencies[i];
            this.bind("change:" + dependency, function() {
                self._reevaluate(key);
            });
        }

        value = value.call(this);
    }

    LacesMap.prototype.set.call(this, key, value, options);
};

LacesModel.prototype._reevaluate = function(key) {

    var newValue = this._functions[key].call(this);
    this._setValue(key, newValue);
};


// Laces Array constructor.
//
// Laces arrays behave almost exactly as regular JavaScript arrays. There are
// two important differences:
// - When an element inside the array is changed, "add", "change" and/or
//   "remove" events are fired.
// - When setting an element, you should use the set() method rather than the
//   default bracket notation. This assures the proper change events get
//   generated.
function LacesArray() {

    var array = [];
    for (var method in LacesArray.prototype) {
        array[method] = LacesArray.prototype[method];
    }
    LacesObject.call(array);
    return array;
}

LacesArray.prototype = new LacesObject();
LacesArray.prototype.constructor = LacesArray;

// Return the element at the specified index.
//
// This method is provided for consistency. It is advised however to use
// JavaScript's native bracket notation for getting elements from an array.
//
// index - Index of the element to return.
LacesArray.prototype.get = function(index) {

    return this[index];
};

// Remove the last element from the array and return that element.
LacesArray.prototype.pop = function() {

    var value = Array.prototype.pop.call(this);
    this._unbindValue(value);
    this.fire("remove", { "elements": [value] });
    this.fire("change", { "elements": [value] });
    return value;
};

// Mutate the array by appending the given elements and returning the new length
// of the array.
LacesArray.prototype.push = function() {

    for (var i = 0, length = arguments.length; i < length; i++) {
        var value = this.wrap(arguments[i]);
        this._bindValue(this.length, value);
        arguments[i] = value;
    }

    Array.prototype.push.apply(this, arguments);

    this.fire("add", { "elements": arguments });
    this.fire("change", { "elements": arguments });
};

// Reverse the array in place. The first array element becomes the last and the
// last becomes the first.
LacesArray.prototype.reverse = function() {

    Array.prototype.reverse.call(this);
    this.fire("change", { "elements": [] });
};

// Set the element at the specified index to the given value. Use this method
// instead of the default bracket notation to assure the proper change events
// get generated.
LacesArray.prototype.set = function(index, value) {

    if (index < this.length) {
        this._unbindValue(this[index]);
    }

    value = this.wrap(value);
    this[index] = value;
    this._bindValue(index, value);

    this.fire("change", { "elements": [value] });
};

// Remove the first element from the array and return that element. This method
// changes the length of the array.
LacesArray.prototype.shift = function() {

    var value = Array.prototype.shift.call(this);
    this._unbindValue(value);
    this.fire("remove", { "elements": [value] });
    this.fire("change", { "elements": [value] });
    return value;
};

// Sort the elements of the array in place and return the array.
LacesArray.prototype.sort = function() {

    Array.prototype.sort.call(this);
    this.fire("change", { "elements": [] });

    return this;
};

// Change the content of the array, adding new elements while removing old
// elements.
LacesArray.prototype.splice = function(index, howMany) {

    var removedElements = Array.prototype.splice(this, arguments);
    var addedElements = arguments.slice(2);

    if (removedElements.length > 0) {
        for (var i = 0, length = removedElements.length; i < length; i++) {
            this._unbindValue(removedElements[i]);
        }
        this.fire("remove", { "elements": removedElements });
        this.fire("change", { "elements": removedElements });
    }
    if (addedElements.length > 0) {
        for (var j = 0, length = addedElements.length; j < length; j++) {
            this._bindValue(index + j, addedElements[j]);
        }
        this.fire("add", { "elements": addedElements });
        this.fire("change", { "elements": addedElements });
    }
    
    return removedElements;
};

// Add one or more elements to the beginning of the array and return the new
// length of the array.
LacesArray.prototype.unshift = function() {

    for (var i = 0, length = arguments.length; i < length; i++) {
        var value = this.wrap(arguments[i]);
        this._bindValue(i, value);
        arguments[i] = value;
    }

    Array.prototype.unshift.apply(this, arguments);

    this.fire("add", { "elements": arguments });
    this.fire("change", { "elements": arguments });

    return this.length;
};


if (typeof define === 'function' && define.amd) {
    define({
        "Model": LacesModel,
        "Map": LacesMap,
        "Array": LacesArray
    });
} else {
    window.LacesModel = LacesModel;
    window.LacesMap = LacesMap;
    window.LacesArray = LacesArray;
}

})(this);
