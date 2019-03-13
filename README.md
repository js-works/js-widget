# jsWidgets

**Remark: This README document is just an early draft - totally incomplete yet**

### Installation

```
# To download project and dependences
git clone https://github.com/js-works/js-widgets.git
cd js-widgets
npm install

# To start the demos
npm run demo

# To build the project
npm run build

# To prepare for publishing
npm run dist
```

### Introduction

jsWidgets is a long-term R&D project to find a minimalistic but still pragmatic
set of functions to build a base API for UI development.
It also provides a reference implementation of that API (internally
based on [React](https://www.reactjs.org)).
Be aware that jsWidgets is actually only for research purposes, it's currently
NOT meant to be used in real-world applications (and most propably never will).

You may ask: What's wrong with the original React API - React's API
itself does only consist of a few functions and (legacy) classes, isn't that minimal
enough?

Short answer: React is a really great UI library, the React dev team did and
does a remarkable job. There's nothing "wrong" with React.
The purpose of the jsWidgets R&D project is just to get a different look at
things and to evaluate different approaches and alternative APIs.

First, here's a small demo application to get a glimpse of how components
are currently implemented with jsWidgets:


#### Hello world component (pure ECMAScript)

```jsx
import { defineComponent } from 'js-widgets'
import { mount } from 'js-widgets/dom'

// just if you do not want to use JSX, of course JSX is also fully supported
import { div } from 'js-widgets/html'

export default defineComponent({
  displayName: 'HelloWorld',

  defaultProps: {
    name: 'world'
  }

  render(props) {
    return div(`Hello, ${props.name}!`)
  }
})
```

#### Simple counter (using a hook API and JSX)

```jsx
import { createElement, defineComponent } from 'js-widgets'
import { useState } from 'js-widgets/hooks'
import { mount } from 'js-widgets/dom'

// A 3rd-party general purpose validation library.
import { Spec } from 'js-spec'; 

export default defineComponent({
  displayName: 'Counter',

  // if you do not want property validation, the following "properties" 
  // parameter can easily be replaced by a simple "defaultProps" configuration
  // (see example below)
  properties: {
    initialValue: {
      type: Number,
      validate: Spec.integer, // using a third-party spec library
      defaultValue: 0
    }, 

    label: {
      type: String,
      defaultValue: 'Counter'
    }
  },

  render(props) {
    const
      [count, setCount] = useState(),
      onIncrement = useCallback(() => setCount(count + 1))

      return (
        <div>
          <label>{props.label}</label>
          <button onClock={onIncrement}>{count}</button>
        </div>
      )
    }
  }
});

mount(Demo(), 'main-content');
```
#### Alternative API for stateful/effectful components

React's hook API was really a ground-breaking improvement in UI development.
Nevertheless it also was a bit controversial as it seems a kind of unusual and
magical. As jsWidgets is a R&D project it also shows how an alternative to
such a hook API could look like. This alternative is based on a factory pattern
and seperates the process into a initialization phase and a render phase.
It is100% typesafe and 0% magical. However this alternative is a more verbose
then the hook API and has the the main issue that values often have to be
wrapped into getter functions or unwrapped from those.<br>
FYI: The author of jsWidgets prefers the hook API.<br>
Anyway, here's what the alternative component API looks like:

```jsx
const Counter = defineComponent({
  displayName: 'Counter',
  
  defaultProps: {
    label: 'Counter'
  },
  
  init(c) {
    const
      [getCount, setCount] = useState(c, 0),
      onIncrement = () => setCount(getCount() + 1)
    
    return props => {
      return (
        <div>
          <label>{props.label + ': '}</label>
          <button onClick={onIncrement}>{getCount()}</button>
        </div>
      )
    }
  }
})
```

### Motivation

What parts of React's API may allow some different still reasonable view?

* React's API is quite "optimized" for the use of JSX:

  While the following JSX syntax is really nice...

  ```jsx
  <FancyHeader>Some headline</FancyHeader>
  ```
  ... its non-JSX counterpart looks quite verbose ...

  ```javascript
  React.createElement(FancyHeader, null, 'Some headline')
  ```

  ... while it would be much nicer just to write ...
  
  ```javascript
  FancyHeader('Some headline')
  ```

  Be aware that you should ALWAYS use JSX with TypeScript
  the non-JSX usage is only meant for those who want to
  UIs in pure ECMAScript.

  In React's API, the main representation of component types are
  render functions (for function components) or component classes.
  Neither will component classes be instantiated by the user directly
  nor will render functions be called directly. The only useful
  usage of component types are that they will be passed as first argument to
  the `React.createElement` function. Same for context provider
  and consumers and the `Fragment` symbol.

  In jsWidgets things are different: Everything that can be used as first
  argument of the `createElement` function besides strings is a factory
  function that returns the result of a corresponding `createElement` call.
  Besides the second argument (`props`) of the `createElement` function
  and also for all the component factories is optional to provide a concice
  syntax: All component types, `Fragment`, context providers, context
  consumers are factory functions with an optional second `props` argument:

  ```jsx
  SomeComponent('some text')

  // or when using jsWidgets with JSX
  <SomeComponent>Some text</SomeComponent>
  ```

  ```jsx
  Fragment(
    SomeComponent('some text'),
    SomeComponent({ className: 'some-class'}, 'some text'))

  // or when using jsWidgets with JSX
  <>
    <SomeComponent>Some text</SomeComponent>
    <SomeComponent className="some-class">some text</SomeComponent>
  </>
  ```
  
  ```jsx
  Fragment({ key: someKey },
    SomeComponent(),
    SomeOtherComponent())
  
  // or when using jsWidgets with JSX
  <Fragment key={someKey}>
    <SomeComponent/>
    <SomeOtherComponent/>
  </>
  ```

  ```jsx
  SomeCtx.Provider({ value: someValue },
    SomeComponent(),
    SomeOtherComponent())
  
  // or when using jsWidgets with JSX
  <SomeCtx.Provider value={someValue}>
    <SomeComponent/>
    <SomeOtherComponent/>
  </SomeCtx.Provider>
  ```

  ```jsx
  SomeCtx.Consumer(value =>
    SomeComponent(value))
  
  // or when using jsWidgets with JSX
  <SomeCtx.Consumer>
    { it => <SomeComponent/> }
  </SomeCtx.Consumer>
  ```

* React handles ```props.children``` in a quite special way
  (mainly for performance reasons):<br>
  If there's only one children ```props.children``` is not an one-element
  array but the child itself.<br>
  Arrays and iterables stay non-flattened by `createElement` itself, but
  later at rendering.
  This is handled differently in jsWidgets:<br>
  If there are one ore more children then ```props.children``` will always be
  an array in jsWidgets and all contained arrays and other iterable objects
  will be flattened immediately by `createElement` (similar as it's done by
  the famous Preact library).

* Reacts provides the possibility for a sophisticated validation of the
  components' properties, which is great.
  Normally for that purpose a add-on library called "props-types".
  While it's great that "props-types" is not part of React itself, yet
  unfortunatelly all the validation function of "props-types" are only
  meant to be used with React, it's not meant as a general purpose validation
  library as the signature of the validation functions are very React-specific.
  This has some advantages of course (maybe shorter error messages and a bit
  smaller production bundle sizes) but the disadvantage that you cannot just use
  a general purpose validation library are really heavy.
  jsWidgets on the other hand allows the use of such general-purpose validation
  libraries - while it recommended to use the jsWidgets independent validation
  library ["js-spec"](https://github.com/js-works/js-spec).

* The React API lacks a bit of information hiding:
  As for complex components you always have the underlying component class
  or in case of references even the component instance directly,
  you always have access to a lot of data and methods you do not really
  need to have access to.
  
  In jsWidgets that's different: As component types are only represented by
  a corresponding factory method (that does only create a virtual element by
  using the `createElement` function) you do NOT have access to the
  underlying component implementation. And also you will never have access to
  the component instance: Refs will not pass the component instance itself as
  it is done with React, but instead will only pass a proxy for the component
  instance which only expose those component functionalities that have
  explicitly defined to be exposed.

### Current API (not complete yet)

#### Module "_core_" (js-widgets)

* `createElement(type, props?, ...children)`
* `defineComponent(componentConfig)`
* `defineContext(contextConfig)`
* `Fragment(props?, ...children)`
* `Dispatcher` object to manage hooks

#### Module "_dom_" (js-widgets/dom)

* `mount(content, container)`
* `unmount(container)`

#### Module "_html_" (js-widgets/html)

Factory functions for all HTML entities (to be used in non-JSX context: `div('some text')`)

#### Module "_svg_" (js-widgets/svg)

Factory functions for all SVG entities

#### Module "_hooks_" (js-widgets/hooks)

Provides hooks to implement Component side-effects in a React-like fashion

* `useState(initialValueProvider)`
* `useEffect(action, dependencies?)`
* `useContext(ctx)`
* `useRef(initialValue)`
* `usCallback(callback)`
* `usePrevious(subject)`
* `useForceUpdate()`

#### Module "_use_" (js-widgets/use)

Provides hooks to implement Component side-effects in an old-school non-magic fashion
(similar functionality like the same-named hooks in "js-widgets/hooks")

* `useState(initialValueProvider)`
* `useEffect(action, dependencies?)`
* `useContext(ctx)`
* `usePrevious(provider)`
* `useForceUpdate()`

#### Modules "_util_" (js-widgets/util)

* `isElement(it)`
* `isNode(it)`

### Project status

**Important**: This project is in a very early state and it is not meant 
to be used in production.
