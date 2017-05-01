# angular-extension-registry

An angular module that provides a plugin registry system for arbitrarily injecting additional UI components into views.  A primary use case would be allowing developers to add components to an application without compiling the extension point files into the actual application.

## Usage

Include the minified script in your html file.  If you want to use the pre-compiled default
templates, include the additional template script.

```html
<script src="/path/to/angular-extension-registry/dist/angular-extension-registry.min.js"></script>
<script src="/path/to/angular-extension-registry/dist/compiled-templates.js"></script>
```

Then require the module in your app.  This is done in the typical Angular fashion:

```javascript

// require 'extension-registry'
angular.module('myapp', [
  'extension-registry'
]);
```

### View Output

Output points must be defined in the views like this:


```html
<!--
  - extension-point is the main directive
  - configure it with extension-name="space delimited endpoint names"
  - configure it with extension-types to filter out types of objects it will
    render.  objects that do not match this filter will not be rendered.
  - configure runtime contextual data via extension-args.  This object will be
    passed to each registered callback function to generate unique output
  - in certain cases the # of items may need to be limited.  use extension-limit
-->
<div
  extension-point
  extension-name="register1 register2"
  extension-types="text link select html"
  extension-args="a_relevant_object_for_context"
  extension-limit="2"></div>
```
Then the service can be used to register data objects for render.  Two-way data
binding will apply, output will re-render whenever the UI changes.

### Built in types

Currently, there are 4 built-in extension types.  Some quick vanilla examples:

```javascript

// type: text
{
  type: 'text',
  className: 'my-text',
  text: 'This is some text.'
}
// type: link
{
  type: 'link',
  className: 'my-class',
  linkText: 'google link',
  href: 'http://google.com',
  target: '_blank'
},
// link: with an onclick function
{
  type: 'link',
  className: 'my-class'
  linkText: 'google alert',
  onClick: function() {
    alert('google!');
  }
},
// type: select box
{
  type: 'select',
  className: 'i am a select box test',
  nameText: 'select-name',
  options: [
    {
      label: 'bar 1 - 1',
      value: 'bar'
    },{
      label: 'bar 1 - 2',
      value: 'thing'
    },{
      label: 'bar 1 - 3',
      value: 'other'
    }
  ],
  onChange: function(item) {
    console.log('selected', item);
  }
},
// type: dom
// NOTE: node: '' can be a jQuery object, or a plain string
{
  type: 'dom',
  node: '<div>Hello World</div>'
},
// or
{
  type: 'dom',
  node: $('<div>')
          .addClass('outline-red')
          .append('<span>')
          .text('Hello world')
},
// and can be as complex as desired:
{
  type: 'dom',
  // arbitrary keys can be added to the object, these will be
  // accessible via node once rendered
  url: 'http://www.google.com',
  onClick: function() {
    $window.open(this.url, '_blank');
  },
  node: [
    '<div row ',
      'ng-show="item.url" ',
      'class="foo" ',
      'title="A link title">',
        '<div>',
          '<i class="fa fa-share" aria-hidden="true"></i>',
        '</div>',
        '<div>',
          '<a ng-click="item.onClick($event)" ',
            'ng-href="item.url">',
            'Open some link',
          '</a>',
        '</div>',
      '</div>'
  ].join('')
}

```

### Sorting

The data inputs will be sorted if a `weight` property is provided.  A convention of leaving
gaps is recommended in case items resolved at a later time need to be inserted.  The sorting
function is reasonably resilient, that said it is recommended to keep your data clean. 

```javascript
// valid weights are numbers & strings that cast to a number
{type:"text",weight: 1},
{type:"text",weight: 0},
{type:"text",weight: '6'},
{type:"text",weight: 5},
{type:"text",weight: '49'},
{type:"text",weight: 2},
{type:"text",weight: -10},
// recommended
{type:"text",weight: 40},
{type:"text",weight: 30},
{type:"text",weight: 20},
{type:"text",weight: 10},
// items without weight treated as weight: -1
// this is fine & expected when sort order is not important
{type:"text"},
{type:"text"},
// invalid values will be treated as -9999 and will sink
{type:"text",weight: NaN},
{type:"text",weight: null},
{type:"text",weight: undefined},
{type:"text",weight: 'invalid'},
{type:"text",weight: []},
{type:"text",weight: {}},
```

### Adding custom types

To add a new type, you must name the type & provide a template for rendering.
Templates are given a model object called `item`.

Example of adding a new type:

```javascript
extensionRegistry.addType('li', '<li>{{item.text}}</li>');

```

This will register the template with angular's `$templateCache` for use whenever the extension point is needed.  Templates are registered as `__extension-<type-name>.html`.  


### Other return types

A registered callback function can return any of the following:

- inapplicable, undefined
- simple, object
- simple, array
- complex, promise

A function that returns nothing may be used to instead manipulate the data.  It is encouraged to be a good citizen, of course.  Changing data that will be used by other registered extensions could have undesirable consequences.


### Data registration

Registering the data objects to a specific endpoint happens via a registration
function.  The function will receive contextual arguments and can return a
promise, data, etc.

```javascript

// args is an object set via the directive in the view.
// likely it is some object on a controller scope that gives
// meaning to the endpoint.
extensionRegistry.add('endpoint1', function(args) {
  return $q.when([
    // my objects
  ]);
});


```

A typical registration example:

```javascript

angular.module('myapp')
  .run([
    '$q',
    '$timeout',
    'extensionRegistry',
    function($q, $timeout, extensionRegistry) {

      // args is provided via the directive attrib extension-args="some_object"
      // and can be used to customize the data objects that will be rendered
      extensionRegistry.add('register1', function(args) {
        // simulate async (service calls, etc)
        return $q.when([
          // add a single link, assuming the args to the directive will provide
          // a name & href for the object
          {
            type: 'link',
            href: args.href,
            displayName: args.name + ' link',
            target: '_blank'
          }
        ]);
      });

      // multiple items registered
      extensionRegistry.add('register1', function(args) {
        return $q.when([
          {
            type: 'link',
            href: args.href,
            displayName: args.name + ' link',
            target: '_blank'
          },
          {
            type: 'link',
            displayName: args.name + 'alert',
            onClick: function() {
              alert('clicked!');
            }
          }
        ]);
      });
    }
  ]);

```

It is perfectly fine to register endpoints ahead of time, then later register additional callbacks.  Example:

```javascript

extensionRegistry.add('sidebar-left');
extensionRegistry.add('main');
extensionRegistry.add('footer');
extensionRegistry.add('foo');
extensionRegistry.add('bar');
extensionRegistry.add('shizzle');

// then elsewhere:
extensionRegistry.add('foo', function(args) {
  // do stuff...
}).

```

It is fine to register multiple callbacks to an endpoint:

```javascript

extensionRegistry.add('endpoint1', function() {  return [ /* stuff */ ] });
extensionRegistry.add('endpoint1', function() {  return [ /* stuff2 */ ] });
extensionRegistry.add('endpoint1', function() {  return [ /* stuff3 */ ] });
extensionRegistry.add('endpoint1', function() {  return [ /* stuff4 */ ] });
```

### Deregistering data

Each time you register data to a registry, the `.add()` function will return an object that
has a `.remove()` function bound to that particular data set, allowing you to unregister that
block of data.  Calling `.remove()` does not clear an entire registry, ONLY the data that was
registered in that data set.

```javascript
var reg = extensionRegistry.add('endpoint1', function() {  return [ /* stuff */ ] });

// nah, actually we don't want this anymore.
reg.remove();

```

### Template usage / overrides

The `/src/views/` directory houses the source html files used to generate templates.  These
are compiled into `/dist/compiled-templates.js`.  The script can be included to use the default
templates, **or** you can create your own overrides by making templates that match the template
path name.  Example: `__extension-link.html`.

These templates will need to be registered via Angular's templateCache.  The best way to do this
is with a build tool, such as gulp's `gulp-angular-templatecache` plugin.

### View the demos

Clone the project, then run the following from the root directory:

`npm install`
`bower install`
`gulp serve`

This will load a file in your browser with links to the `/demos` directory.  Feel free to experiment
with these examples.
