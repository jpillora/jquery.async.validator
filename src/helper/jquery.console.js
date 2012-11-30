
/* ===================================== *
 * jQuery Console Plugin
 * Console shortcuts
 * @author Jaime Pillora
 * ===================================== */

(function($) {

  if(window.console === undefined)
    window.console = { isFake: true };

  fns = ["log","warn","info","group","groupCollapsed","groupEnd"];
  for (var i = fns.length - 1; i >= 0; i--) {
    var f = fns[i];
    if(window.console[f] === undefined)
      window.console[f] = $.noop;
  }

  var I = function(i){ return i; };

  function log() {
    if(this.suppressLog)
      return;
    cons('log', this, arguments);
  }

  function warn() {
    cons('warn', this, arguments);
  }

  function info() {
    cons('info', this, arguments);
  }

  function cons(type, opts, args) {
    if(window.console === undefined ||
       window.console.isFake === true)
      return;

    var a = $.map(args,I);
    a[0] = [opts.prefix, a[0], opts.postfix].join('');
    var grp = $.type(a[a.length-1]) === 'boolean' ? a.pop() : null;

    //if(a[0]) a[0] = getName(this) + a[0];
    if(grp === true) console.group(a[0]);
    if(a[0] && grp === null)
      if($.browser.msie)
        console.log(a.join(','));
      else
        console[type].apply(console, a);
    if(grp === false) console.groupEnd();
  }

  function withOptions(opts) {
    return {
      log:  function() { log.apply(opts, arguments); },
      warn: function() { warn.apply(opts, arguments); },
      info: function() { info.apply(opts, arguments); }
    }
  }

  $.console = function(opts) {
    opts = $.extend({}, $.console.defaults, opts);
    return withOptions(opts);
  };

  $.console.defaults = {
    suppressLog: false,
    prefix: '',
    postfix: ''
  };

  $.extend($.console, withOptions($.console.defaults));

}(jQuery));
