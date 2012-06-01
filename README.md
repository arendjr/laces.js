
# laces.js

Laces.js provides a minimal implicit state machine with automatic bindings


## Rationale

Ever found yourself in the situation where it would be convenient to define
variables in terms of other variables, and have all of them update whenever one
of them changes value? If your answer is yes, then Laces.js might be just for
you!

## Usage

Laces.js works as an implicit state machine. First, you create a state object:

```js
var state = new LacesState();
```

The state machine is called implicit because the state is defined (implicitly)
by the set of properties that will be assigned to it (as opposed to how a
typical final state machine* works).

*) See: http://en.wikipedia.org/wiki/Finite-state_machine


### Defining properties

We can define properties using the defineProperty() method:

```js
state.defineProperty("firstName", "Arend");
state.defineProperty("lastName", "van Beelen");
```

As you can see, nothing more than the property name and the initial value are
required. Once the property is defined, it can be accessed using dot-notation on
the state object:

```js
state.firstName; // "Arend"
```

More interesting is defining properties by using the value of other properties:

```js
state.defineProperty("fullName", function() { return this.firstName + " " + this.lastName; });

state.fullName; // "Arend van Beelen"
```

Still no rocket science, however. But let's watch what happens when we now
modify one of the variables that we have used to define the fullName property:

```js
state.firstName = "Arie";

state.fullName; // "Arie van Beelen"
```

As you can see, changes the value of a single property now automatically updates
all properties that are defined in terms of that property. Needless to say, this
behavior can also be chained, so that a property that relies on fullName also
gets updated when firstName or lastName is modified.


### Nested properties

It is also possible to use nested properties within your state object. Example:

```js
state.defineProperty("user", null);
state.defineProperty("displayName", function() { return this.user && this.user.name || "Anonymous"; });
```

There are now several ways of modifying the state.user.name property, each of
which will reflect on the displayName property:

```js
state.user = { name: "Arend" };

state.displayName; // "Arend"

state.user.name = "Arie";

state.displayName; // "Arie"

state.user = null;

state.displayName; // "Anonymous"
```


### Custom bindings

Finally, you may be interested in binding a custom callback to whenever one of those
properties changes value:

```js
state.bind("fullName", function(newValue, oldValue) { $(".full-name").text(newValue); });
```

Bindings can also be chained to the defineProperty() call:

```js
state.defineProperty("fullName", function() { return this.firstName + " " + this.lastName; })
     .bind(function(newValue, oldValue) { $(".full-name").text(newValue); });
```

Note that by default, the callback is also called initially on binding, so that you
don't need to write your initialization code twice. If you want to disable this
behavior however, you can pass an options object with the noInitialFire property to
true.


## Demo

See: https://github.com/arendjr/laces.js/tree/master/demo


## Compatibility

- Chrome 5+
- IE 9+
- Firefox 4+
- Safari 5+
- Opera 11.60+
