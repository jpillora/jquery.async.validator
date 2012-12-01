jQuery Async Validator
=====
v1.0.0

Summary
---
An asynchronous validation library for easy to use client side validations.

Documentation and Demos
---
(http://jpillora.github.com/jquery.async.validation/)

Downloads
---
* [Development Version](http:raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.js)
* [Production Version](http:raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.min.js)

Quick Start Guide
---

``` html
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script src="//raw.github.com/jpillora/jquery.async.validator/master/dist/jquery.async.validator.min.js"></script>

<style>
  input.error {
    border: thin solid red;
  }
</style>

<form>
  <input value="42" data-validate="number"/>
  <input value="abc" data-validate="number"/>
  <input type="submit"/>
</form>

<script>
  $("form").asyncValidator();
</script>
```

Todo
---
* Nested validation groups
* Internationalisation
* Create a result class instead of using strings/nulls 