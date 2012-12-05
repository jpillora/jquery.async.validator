jQuery Async Validator
=====
v1.0.0

Summary
---
A jQuery plugin for fully customisable asynchronous client-side validations.

Optionally includes another plugin - [jQuery prompt](http://www.github.com/jpillora/jquery.prompt/) - for displaying coloured text prompts.

Full Documentation and Demos
---
http://jpillora.github.com/jquery.async.validation/

*Note: These docs are a work in progress.*

Downloads
---

With `jquery.prompt`

* [Development Version including jquery.prompt]
* [Production Version including jquery.prompt]
* [Stylesheet for jquery.prompt]

Without `jquery.prompt`
*Note You must implement your own `prompt` handler.*

* [Development Version]
* [Production Version]

Basic Usage
---

Use the following HTML:

``` html
<!-- jQuery -->
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>

<!-- jQuery Async Validator (with jQuery Prompt included) -->
<script src="//raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.prompt.min.js"></script>
<!-- jQuery Prompt stylesheet -->
<link href="//raw.github.com/jpillora/jquery.prompt/master/dist/jquery.prompt.css" rel="stylesheet" type="text/css" >
 
<form>
  <input value="42" data-validate="number"/>
  <input value="abc" data-validate="number"/>
  <input type="submit"/>
</form>

<script>
  $(function() {
    $("form").asyncValidator();
  });
</script>
```

Press *submit* and you should see:

![basic usage result](//raw.github.com/jpillora/jquery.async.validator/master/demo/demos/quickstart.png)

Todo
---
* Nested validation groups
* Internationalisation
* Create a validation result object type instead of using strings/nulls 

Contributing
---
Issues and Pull-requests welcome, though please add tests. To build and test: `cd *dir*` then `npm install -g grunt` then `grunt`.

Credits
---
Thanks to [@posabsolute](https://github.com/posabsolute) as this plugin was originally a fork of [jQuery Validation Engine](https://github.com/posabsolute/jQuery-Validation-Engine) though it has now been completely rewritten in OO style and is now more extendible and fully asynchronous. Many features have been added and many have not been reimplemented so I have decided give this project a new name instead of trying to do a massive pull-request that wouldn't be backwards compatible.

Change Log
---

v1.0.0
======
Released !


  [Development Version including jquery.prompt]: http://raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.prompt.js
  [Production Version including jquery.prompt]: http://raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.prompt.min.js
  [Development Version]: http://raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.js
  [Production Version]: http://raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.min.js
  [Stylesheet for jquery.prompt]: http://raw.github.com/jpillora/jquery.prompt/master/dist/jquery.prompt.css




