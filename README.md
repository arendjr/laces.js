# laces.js

Laces.js provides the M in MVC, while you tie the rest.


## Rationale

While there are plenty of MVC frameworks available for JavaScript, most of them
dictate a variety of other application design choices on you. For example,
Backbone.js requires that you use underscore.js, Ember.js comes with its own
templating system, AngularJS requires you to extend the DOM, and so on. A few
frameworks require (or strongly encourage) you to use CoffeeScript, and many
carry significant overhead.

Laces.js by contrast provides you with a Model, but nothing more. It provides you
with the laces to tie your model to whatever View or Controller you prefer. It
consists of under 600 lines of JavaScript code, including whitespace and comments.

The project was created because I wanted a good model to use with an HTML5 map
editor for a [game engine](https://github.com/arendjr/PlainText) I'm working on.
The map editor has a canvas view and uses a custom WebSockets-based API for server
communication, leaving me with little use for templating engines and XHR
integration most other MVC frameworks provide.


## Basic Usage

Laces.js works as a model with automatic data binding. First, you create a model:

```js
var model = new LacesModel();
```

We can set properties using the set() method:

```js
model.set("firstName", "Arend");
model.set("lastName", "van Beelen");
```

Once a property is set, it can be accessed using dot notation on the model object:

```js
model.firstName; // "Arend"
```

As a shorthand form, properties can also be set using nothing but the constructor:

```js
var model = new LacesModel({
     firstName: "Arend",
     lastName: "van Beelen"
});
```

You can also define properties that reference other properties. We call these
computed properties:

```js
model.set("fullName", function() { return this.firstName + " " + this.lastName; });

model.fullName; // "Arend van Beelen"
```

When a property is updated, any computed properties that depend on its value are
also updated:

```js
state.firstName = "Arie";

state.fullName; // "Arie van Beelen"
```

As you can see, changes to the value of a single property now automatically update
all properties that depend on that property. This behavior can also be chained, so
that a property that depends on fullName for example, also gets updated when
firstName or lastName is modified.


### Nested Properties

It is also possible to use nested properties within your model. Example:

```js
model.set("user", null);
model.set("displayName", function() { return this.user && this.user.name || "Anonymous"; });
```

There are now several ways of modifying the state.user.name property, each of
which will reflect on the displayName properly:

```js
model.user = { name: "Arend" };

model.displayName; // "Arend"

model.user.name = "Arie";

model.displayName; // "Arie"

model.user = null;

model.displayName; // "Anonymous"
```


### Maps and Arrays

The properties of a Laces Model can contain more than just primitives. They also
support Maps (also known as dictionaries) and Arrays.

You may not have realized it, but you've already seen a Laces Map in action. The
example above, with the nested properties, used a Laces Map. Every time you
assign assign a plain JavaScript object to a Laces property, the value gets
converted automatically to a Map. The assignment of the user object above could
thus also have been written as:

```js
model.user = new LacesMap({ name: "Arend" });
```

The API for a Laces Map is the same as a Laces Model. If you want to add a
previously unknown property to a Map, you have to use set(). If you want to
remove a property from a Map, you should use remove():

```js
model.user.remove("name");
```

You can iterate over the properties in a Map in exactly the same way as a plain
JavaScript object. Just don't forget to use the hasOwnProperty() guard (which
you should do anyway, according to jslint):

```js
for (var propertyName in model.user) {
     if (model.user.hasOwnProperty(propertyName)) {
          console.log("Property " + propertyName + " has value: " + model.user[propertyName]);
     }
}
```

Unlike a Model, a Map does not support computed properties. Assigning a function
to a property would simply set the value to be that function. If you really want
computed properties in nested objects, it is possible to nest Models:

```js
model.user = new LacesModel({ name: "Arend" });
```

Arrays are supported too, and a Laces Array is created implicitly when you
assign an array to a Laces property:

```js
model.user.friends = [];
```

You may also assign a Laces Array explicitly:

```js
model.user.friends = new LacesArray();
```

The API for a Laces Array is exactly the same as for a regular JavaScript array,
but it can be bound to in the same way as a Laces Map or Model:

```js
mode.user.friends.bind("change", function(event) { console.log("Friends changed"); });
```

Read on to the next section for more about bindings.


### Custom Bindings and Templates

You may be interested in binding a custom callback to whenever one of those
properties changes value:

```js
model.bind("change:fullName", function(event) { $(".full-name").text(event.value); });
```

You can also watch the whole model instead of a specific property. This is an
effective way to integrate with template systems. For example, the following
code shows how to render a Hogan.js template when the model changes:

```js
var addressCardTemplate = Hogan.compile("<div class=\"address-card\">" +
                                        "<p>{{fullName}}</p>" +
                                        "<p>{{address}}</p>" +
                                        "<p>{{postalCode}} {{cityName}}</p>" +
                                        "<p>{{countryName}}</p>" +
                                        "</div>");
model.bind("change", function(event) { addressCardTemplate.render(model); });
```


### Require.js Usage

If you want to use Laces.js with Require.js, you can do so easily. Example:

```js
require(["laces"], function(Laces) {
     var model = new Laces.Model({
          firstName: "Arend",
          lastName: "van Beelen"
     });
});
```

As you can see, the LacesModel type is now defined as the Model property on
the Laces object. The same applies to the other Laces types.


## Demo

See: https://github.com/arendjr/laces.js/tree/master/demo

For a real-world example, see the PlainText
[map model](https://github.com/arendjr/PlainText/blob/master/web/mapmodel/model.js).


## Compatibility

- Chrome 5+
- IE 9+
- Firefox 4+
- Safari 5+
- Opera 11.60+
