# laces.js

Laces.js provides the M in MVC, while you tie the rest.

 * [**Rationale**](#rationale)
 * [**Basic Usage**](#basic-usage)
  * [Nested Properties](#nested-properties)
  * [Maps and Arrays](#maps-and-arrays)
  * [Custom Bindings and Templates](#custom-bindings-and-templates)
  * [Events](#events)
  * [Usage with Node.js or Require.js](#usage-with-nodejs-or-requirejs)
 * [**Add-ons**](#add-ons)
  * [Laces.js Tie](#lacesjs-tie)
  * [Laces.js Local](#lacesjs-local)
 * [**Demo**](#demo)
 * [**Tests**](#tests)
 * [**Compatibility**](#compatibility)


## Rationale

While there are plenty of MVC frameworks available for JavaScript, most of them
dictate a variety of other application design choices on you. For example,
Backbone.js requires that you use underscore.js, Ember.js comes with its own
templating system, AngularJS requires you to extend the DOM, and so on. A few
frameworks require (or strongly encourage) you to use CoffeeScript, and many
carry significant overhead.

Laces.js by contrast provides you with a Model, but nothing more. It provides
you with the laces to tie your model to whatever View or Controller you prefer.
It consists of about 700 lines of JavaScript code, including whitespace and
comments (7K minified). Optionally, you can add one or more add-ons for extra
features like two-way data binding with templates.

The project was created because I wanted a good model to use with an HTML5 map
editor for a [game engine](https://github.com/arendjr/PlainText) I'm working on.
The map editor has a canvas view and uses a custom WebSockets-based API for 
server communication, leaving me with little use for templating engines and XHR
integration most other MVC frameworks provide.


## Basic Usage

Laces.js works as a model with automatic data binding. First, you create a
model:

```js
var model = new LacesModel();
```

You can set properties using the set() method:

```js
model.set("firstName", "Arend");
model.set("lastName", "van Beelen");
```

Once a property is set, it can be accessed using dot notation on the model
object:

```js
model.firstName; // "Arend"
```

As a shorthand form, properties can also be set using nothing but the
constructor:

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

As you can see, changes to the value of a single property now automatically
update all properties that depend on that property. This behavior can also be
chained, so that a property that depends on fullName for example, also gets
updated when firstName or lastName is modified.


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

Unlike a Model, a Map does not support computed properties, and does not fire
events of the type "change:&lt;propertyName&gt;". Assigning a function
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
but when setting values in the array you should use the set() method rather than
bracket notation to make sure the changes are properly registered.

Arrays can be bound to in the same way as a Laces Map or Model:

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

The listener callback function gets executed in the scope of the model to which
it is bound.

An interesting feature of the bindings is that the listener callback can be
fired immediately after binding. This may be useful for initialization and
can save you from some code duplication:

```js
model.bind("change:fullName", function(event) { $(".full-name").text(event.value); }, { initialFire: true });
```

Note that you can bind and unbind events using the bind()/unbind() methods as
well as the on()/off() methods to match the style you prefer. 


### Events

As you saw above, Laces objects generate change events whenever something
changes. Here's an overview of all the events that get generated.

<table>
<tr><td><em>Event name</em></td><td><em>Description</em></td></tr>
<tr><td><b>add</b></td><td>Generated when a new property is set on map or
model, or a new element is added to an array.</td></tr>
<tr><td><b>update</b></td><td>Generated when an existing property's value
or an existing array element is changed.</td></tr>
<tr><td><b>remove</b></td><td>Generated when a property or an array element
is removed.</td></tr>
<tr><td><b>change</b></td><td>Generated on any kind of change (add, update
or remove).</td></tr>
<tr><td><b>change:&lt;propertyName&gt;</b></td><td>Generated when a specific
property is changed (Laces Models only).</td></tr>
</table>

All events carry a payload, which is passed as the event object to the listener
callback function.

If the object is a Laces Map or Model, the event object contains the following
properties:

<table>
<tr><td><em>Property</em></td><td><em>Description</em></td></tr>
<tr><td><b>name</b></td><td>Name of the triggered event ("add", "update",
etc..)</td></tr>
<tr><td><b>key</b></td><td>Key of the property for which the event is
generated.</td></tr>
<tr><td><b>value</b></td><td>Value of the property for which the event is
generated. Undefined if this is a remove event.</td></tr>
<tr><td><b>oldValue</b></td><td>Previous value of the property (if
applicable).</td></tr>
</table>

If the object is a Laces Array, the event object contains the following
properties:

<table>
<tr><td><em>Property</em></td><td><em>Description</em></td></tr>
<tr><td><b>name</b></td><td>Name of the triggered event ("add", "update",
etc..)</td></tr>
<tr><td><b>elements</b></td><td>Array of affected elements (those that
were added, updated or removed).</td></tr>
<tr><td><b>index</b></td><td>Index of the first added, changed or removed
element.</td></tr>
</table>


### Usage with Node.js or Require.js

If you want to use Laces.js with Node.js or Require.js, you can do so easily.
Just import the module as you would expect. The module will have Model, Map and
Array properties defined on it.

Example with Node.js:

```js
var Laces = require("laces.js");
var model = new Laces.Model({
    firstName: "Arend",
    lastName: "van Beelen"
});
```

The Laces.js package for Node.js can be installed with npm:

```bash
$ npm install laces.js
```

Example with Require.js:

```js
require(["laces"], function(Laces) {
     var model = new Laces.Model({
          firstName: "Arend",
          lastName: "van Beelen"
     });
});
```


## Add-ons

### Laces.js Tie

Laces.js Tie is an add-on that adds two-way data bindings between a Laces Model
and a rendered template. Laces.js Tie uses HTML5 *data attributes* to create its
bindings and is template-engine agnostic. It has already been confirmed to work
in tandem with Handlebars.js, Hogan.js and Underscore.js's built-in templates,
in addition to plain HTML strings.

For example, here's how to tie a Hogan.js template to a Laces Model:

```js
var template = Hogan.compile(myTemplateString);
var tie = new LacesTie(model, template);
someDomElement.appendChild(tie.render());
```

The render() function returns a DocumentFragment which you can insert anywhere
into the DOM. It is important you don't convert this fragment into a string
before adding it to the DOM, as it would result in losing all live bindings.

If the template iterates over an array or other list, you may want to rerender
it when the list changes. In such case you can use something like the following
instead of the last line from above:
target
```js
model.someArray.bind("add remove", function() {
     someDomElement.innerHTML = "";
     someDomElement.appendChild(tie.render());
}, { initialFire: true });
```

An actual template might look something like this (using Hogan.js as example):

```html
<ul>
     {{#someArray}}
     <li>
          <span data-tie="text: someArray[{{index}}].name, editable: true"></span>
     </li>
     {{/someArray}}
</ul>
```

Once the fragment is inserted in the DOM, it maintains bi-directional bindings
for user-generated events. This means the fragment will automatically update
when the model is updated, but when an input element is bound to a model
property, any changes made by the user to the value of the element will also be
saved back into the model.

The data-tie attribute may contain multiple key-value pairs, separated by
commas. Here is an overview of all the supported keys:

<table>
<tr>
    <td><em>Key</em></td>
    <td><em>Value</em></td>
    <td><em>Description</em></td>
</tr>
<tr>
    <td><b>text</b></td>
    <td>property reference</td>
    <td>The text content of the element will reflect the value of the
        property.</td>
</tr>
<tr>
    <td><b>value</b></td>
    <td>property reference</td>
    <td>The value attribute of the element will reflect the value of the
        property. User-generated changes to the value attribute will be save
        back to the property.</td>
</tr>
<tr>
    <td><b>checked</b></td>
    <td>property reference</td>
    <td>The checked attribute will be set when the property's value evaluates
        to true, and unset otherwise. If the user changes the checked state of
        the element, this will be reflect in the property's value.</td>
</tr>
<tr>
    <td><b>disabled</b></td>
    <td>property reference</td>
    <td>The disabled attribute will be set when the property's value evaluates
        to true, and unset otherwise. Prefix the property reference with a ! to
        reverse the evaluation.</td>
</tr>
<tr>
    <td><b>radio</b></td>
    <td>property reference</td>
    <td>The value of the property is reflected on the radio input children of
        the element. The child whose name matches the property's value is
        selected and when the selection changes the property's value is set to
        the name of the newly selected radio input.</td>
</tr>
<tr>
    <td><b>visible</b></td>
    <td>property reference</td>
    <td>The CSS display property will be set to "none" when the property's value
        evaluates to false, and be unset otherwise. Prefix the property
        reference with a ! to reverse the evaluation.</td>
</tr>
<tr>
    <td><b>class</b></td>
    <td>property reference</td>
    <td>The property's value is interpreted as a CSS class which is added to the
        element.</td>
</tr>
<tr>
    <td><b>editable</b></td>
    <td>true | false</td>
    <td>Use this property to make an element whose text is tied to a property
        value editable. This will cause the element to be replaced by an input
        element on double-click (by default).</td>
</tr>
<tr>
    <td><b>default</b></td>
    <td>any value</td>
    <td>Default value to use if the property referenced by the text, value or
        radio key is not set. If not given, an empty string would be used (or
        the number 0 for an input element with a number type).</td>
</tr>
</table>

You can combine multiple ties in a single element. Example:

```html
<span data-tie="text: someArray[{{index}}].name, class: someArray[{{index}}].class"></span>
```

Finally, the LacesTie constructor also takes an optional options argument. It
supports the following options:

<table>
<tr>
    <td><em>Option</em></td>
    <td><em>Default</em></td>
    <td><em>Description</em></td>
</tr>
<tr>
    <td><b>editEvent</b></td>
    <td>"dblclick"</td>
    <td>The event used to trigger editing of a non-input element marked with the
        editable key.</td>
</tr>
<tr>
    <td><b>saveEvent</b></td>
    <td>"change"</td>
    <td>The event used to trigger the saving of an element's value back to the
        model.</td>
</tr>
<tr>
    <td><b>saveOnEnter</b></td>
    <td>true</td>
    <td>Whether an element's value should be saved back to the model when Enter
        is pressed.</td>
</tr>
<tr>
    <td><b>saveOnBlur</b></td>
    <td>true</td>
    <td>Whether an element's value should be saved back to the model when the
        element is blurred.</td>
</tr>
</table>

#### Changelog

**Saturday, December 7, 2013**: The Tie add-on has been heavily rewritten,
breaking backwards compatibility. Instead of various data-laces-* attributes,
the add-on now expects a single data-tie attribute. This update also adds
support for binding radio buttons and CSS classes. For more information, please
read the documentation above.

### Laces.js Local

Laces.js Local provides a very simple extension over the default Laces Model.
A Local Model will automatically sync with LocalStorage:

```js
var model = new LacesLocalModel('my-model'));
```

Any properties you set on the model will still be there when the page is
reloaded.


## Demo

There's a bunch of demos included in this repository, just check them out.

For real-world examples, check out these projects:

* [C.I. Joe](https://github.com/arendjr/CI-Joe/)
* [PlainText](https://github.com/arendjr/PlainText/)

You might also be interested in the
[TodoMVC example using Laces.js](https://github.com/arendjr/todomvc/tree/gh-pages/labs/architecture-examples/lacesjs).

And there's even a variation on the TodoMVC example that
[uses the Laces.js Tie and Laces.js Local add-ons](https://github.com/arendjr/todomvc/tree/gh-pages/labs/architecture-examples/laces_addons).


## Tests

After checkout, install dependencies with:
```
$ npm install
```
Then open test/index.html in the browser.


## Compatibility

- Chrome 5+
- IE 9+
- Firefox 4+
- Safari 5+
- Opera 11.60+
