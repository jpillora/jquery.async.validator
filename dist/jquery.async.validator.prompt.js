/** jQuery Asynchronous Validator - v0.0.1 - 2013/02/26
 * https://github.com/jpillora/jquery.async.validator
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function(window,document,undefined) {
'use strict';

var Options, Prompt, arrowDirs, className, create, getAnchorElement, pluginName, pluginOptions;

pluginName = 'prompt';

className = 'jqPrompt';

arrowDirs = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
};

pluginOptions = {
  autoHidePrompt: false,
  autoHideDelay: 10000,
  arrowShow: true,
  arrowSize: 5,
  arrowPosition: 'top',
  color: 'red',
  colors: {
    red: '#ee0101',
    green: '#33be40',
    black: '#393939',
    blue: '#00f'
  },
  showAnimation: 'fadeIn',
  showDuration: 200,
  hideAnimation: 'fadeOut',
  hideDuration: 600,
  gap: 2
};

create = function(tag) {
  return $(document.createElement(tag));
};

Options = function(options) {
  if ($.isPlainObject(options)) {
    return $.extend(this, options);
  }
};

Options.prototype = pluginOptions;

getAnchorElement = function(element) {
  var fBefore, radios;
  if (element.is('[type=radio]')) {
    radios = element.parents('form:first').find('[type=radio]').filter(function(i, e) {
      return $(e).attr('name') === element.attr('name');
    });
    element = radios.first();
  }
  fBefore = element.prev();
  if (fBefore.is('span.styled,span.OBS_checkbox')) {
    element = fBefore;
  }
  return element;
};

Prompt = (function() {

  function Prompt(elem, node, options) {
    if ($.type(options) === 'string') {
      options = {
        color: options
      };
    }
    this.options = new Options($.isPlainObject(options) ? options : {});
    this.elementType = elem.attr('type');
    this.originalElement = elem;
    this.elem = getAnchorElement(elem);
    this.elem.data(pluginName, this);
    this.buildWrapper();
    this.buildPrompt();
    this.wrapper.append(this.prompt);
    this.buildContent();
    this.prompt.append(this.content);
    this.prompt.data(pluginName, this);
    this.elem.before(this.wrapper);
    this.prompt.css(this.calculateCSS());
    this.run(node);
  }

  Prompt.prototype.buildArrow = function() {
    var alt, d, dir, showArrow, size;
    dir = this.options.arrowPosition;
    size = this.options.arrowSize;
    alt = arrowDirs[dir];
    this.arrow = create("div");
    this.arrow.addClass(className + 'Arrow').css({
      'margin-top': 2 + (document.documentMode === 5 ? size * -4 : 0),
      'position': 'relative',
      'z-index': '2',
      'margin-left': 10,
      'width': 0,
      'height': 0
    }).css('border-' + alt, size + 'px solid ' + this.getColor());
    for (d in arrowDirs) {
      if (d !== dir && d !== alt) {
        this.arrow.css('border-' + d, size + 'px solid transparent');
      }
    }
    showArrow = this.options.arrowShow && this.elementType !== 'radio';
    if (showArrow) {
      return this.arrow.show();
    } else {
      return this.arrow.hide();
    }
  };

  Prompt.prototype.buildPrompt = function() {
    return this.prompt = create('div').addClass(className).hide().css({
      'z-index': '1',
      'position': 'absolute',
      'cursor': 'pointer'
    });
  };

  Prompt.prototype.buildWrapper = function() {
    return this.wrapper = create('div').addClass("" + className + "Wrapper").css({
      'z-index': '1',
      'position': 'absolute',
      'display': 'inline-block',
      'height': 0,
      'width': 0
    });
  };

  Prompt.prototype.buildContent = function() {
    return this.content = create('div').addClass("" + className + "Content").css({
      'background': '#fff',
      'position': 'relative',
      'font-size': '11px',
      'box-shadow': '0 0 6px #000',
      '-moz-box-shadow': '0 0 6px #000',
      '-webkit-box-shadow': '0 0 6px #000',
      'padding': '4px 10px 4px 8px',
      'border-radius': '6px',
      'border-style': 'solid',
      'border-width': '2px',
      '-moz-border-radius': '6px',
      '-webkit-border-radius': '6px',
      'white-space': 'nowrap'
    });
  };

  Prompt.prototype.showPrompt = function(show) {
    var hidden;
    hidden = this.prompt.parent().parents(':hidden').length > 0;
    if (hidden && show) {
      this.prompt.show();
    }
    if (hidden && !show) {
      this.prompt.hide();
    }
    if (!hidden && show) {
      this.prompt[this.options.showAnimation](this.options.showDuration);
    }
    if (!hidden && !show) {
      return this.prompt[this.options.hideAnimation](this.options.hideDuration);
    }
  };

  Prompt.prototype.calculateCSS = function() {
    var elementPosition, height, left, promptPosition;
    elementPosition = this.elem.position();
    promptPosition = this.prompt.parent().position();
    height = this.elem.outerHeight();
    left = elementPosition.left - promptPosition.left;
    if (!navigator.userAgent.match(/MSIE/)) {
      height += elementPosition.top - promptPosition.top;
    }
    return {
      top: height + this.options.gap,
      left: left
    };
  };

  Prompt.prototype.getColor = function() {
    return this.options.colors[this.options.color] || this.options.color;
  };

  Prompt.prototype.run = function(node, options) {
    var t;
    if ($.isPlainObject(options)) {
      $.extend(this.options, options);
    } else if ($.type(options) === 'string') {
      this.options.color = options;
    }
    if (this.prompt && !node) {
      this.showPrompt(false);
      return;
    } else if (!this.prompt && !node) {
      return;
    }
    if ($.type(node) === 'string') {
      this.content.html(node.replace('\n', '<br/>'));
    } else {
      this.content.empty().append(node);
    }
    this.content.css({
      'color': this.getColor(),
      'border-color': this.getColor()
    });
    if (this.arrow) {
      this.arrow.remove();
    }
    this.buildArrow();
    this.content.before(this.arrow);
    this.showPrompt(true);
    if (this.options.autoHidePrompt) {
      clearTimeout(this.elem.data('promptTimer'));
      t = setTimeout(function() {
        return this.showPrompt(false);
      }, this.options.autoHideDelay);
      return this.elem.data('promptTimer', t);
    }
  };

  return Prompt;

})();

$(function() {
  return $(document).on('click', "." + className, function() {
    var inst;
    inst = getAnchorElement($(this)).data(pluginName);
    if (inst != null) {
      return inst.showPrompt(false);
    }
  });
});

$[pluginName] = function(elem, node, options) {
  return $(elem)[pluginName](node, options);
};

$[pluginName].options = function(options) {
  return $.extend(pluginOptions, options);
};

$.fn[pluginName] = function(node, options) {
  return $(this).each(function() {
    var inst;
    inst = getAnchorElement($(this)).data(pluginName);
    if (inst != null) {
      return inst.run(node, options);
    } else {
      return new Prompt($(this), node, options);
    }
  });
};

}(window,document));
(function($) {

  if(window.console === undefined)
    window.console = { isFake: true };

  var fns = ["log","warn","info","group","groupCollapsed","groupEnd"];
  for (var i = fns.length - 1; i >= 0; i--)
    if(window.console[fns[i]] === undefined)
      window.console[fns[i]] = $.noop;

  if(!$) return;
  
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
    if(grp === true) window.console.group(a[0]);
    if(a[0] && grp === null)
      if(window.navigator.userAgent.indexOf("MSIE") >= 0)
        window.console.log(a.join(','));
      else
        window.console[type].apply(window.console, a);
    if(grp === false) window.console.groupEnd();
  }

  function withOptions(opts) {
    return {
      log:  function() { log.apply(opts, arguments); },
      warn: function() { warn.apply(opts, arguments); },
      info: function() { info.apply(opts, arguments); }
    };
  }

  var console = function(opts) {
    opts = $.extend({}, console.defaults, opts);
    return withOptions(opts);
  };

  console.defaults = {
    suppressLog: false,
    prefix: '',
    postfix: ''
  };

  $.extend(console, withOptions(console.defaults));

  if($.console === undefined)
    $.console = console;
  
  $.consoleNoConflict = console;

}(jQuery));

//plugin wide ajax cache
var ajaxCache = { loading: {}, loaded: {} } ;

//callable from user defined rules. alias: r.ajax
function ajaxHelper(userOpts, rule, ruleInterface, validationElem) {

  var defaults = {
        method: "GET",
        timeout: 15 * 1000
      },
      promptContainer = ruleInterface.triggerField || ruleInterface.field,
      userSuccess = userOpts.success,
      userError   = userOpts.error,
      options = validationElem.options,
      serialised = JSON ? JSON.stringify(userOpts) : guid();

  function onErrorDefault(e) {
    log("ajax error");
    ruleInterface.callback("There has been an error");
  }

  var userCallbacks = {
    success: userSuccess,
    error: userError || onErrorDefault
  };

  //already completed
  if(ajaxCache.loaded[serialised]) {

    var args = ajaxCache.loaded[serialised],
        success = userCallbacks.success;

    success.apply(rule, args);
    return;
  }

  //this request is in progress,
  //store callbacks for when first request completes
  if(!ajaxCache.loading[serialised])
    ajaxCache.loading[serialised] = [];
  ajaxCache.loading[serialised].push(userCallbacks);

  if(ajaxCache.loading[serialised].length !== 1) return;

  options.prompt(promptContainer, "Checking...", "load");
  
  function intercept() {
    options.prompt(promptContainer, false);

    var reqs = ajaxCache.loading[serialised];
    while(reqs.length)
      reqs.pop().success.apply(rule,arguments);
    
    ajaxCache.loaded[serialised] = arguments;
  }

  var realCallbacks = {
    success: intercept,
    error: intercept
  };

  //result.ajax =
  $.ajax($.extend(defaults, userOpts, realCallbacks));
}

var guid = function() {
  return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1);
};
$.fn.scrollView = function(onComplete) {
  
  var field = $(this).first();
  if(field.length === 1) {
    if(field.is(".styled")) field = field.siblings("span");
    $('html, body').animate({
        scrollTop: Math.max(0,field.offset().top - 100)
    }, {
        duration: 1000,
        complete: onComplete || $.noop
    });
  }

  return $(this);
};

$.fn.equals = function(that) {
  if($(this).length !== that.length)
    return false;
  for(var i=0,l=$(this).length;i<l;++i)
    if($(this)[i] !== that[i])
      return false;
  return true;
};

$.Deferred.serialize = function(fns) {
  if(!$.isArray(fns) || fns.length === 0)
    return $.Deferred().resolve().promise();

  var pipeline = fns[0](), i = 1, l = fns.length;
  for(;i < l;i++)
    pipeline = pipeline.pipe(fns[i]);

  return pipeline;
};

$.Deferred.parallelize = function(fns) {

  var d = $.Deferred(),
      n = 0, i = 0, l = fns.length,
      rejected = false;

  if(!$.isArray(fns) || l === 0)
    return d.resolve();

  function pass(result) {
    n++;
    if(n === l) d.resolve(result);
  }

  function fail(result) {
    if(rejected) return;
    rejected = true;
    d.reject(result);
  }

  //execute all at once
  for(; i<l; ++i )
    fns[i]().done(pass).fail(fail);

  return d.promise();
};
// Inspired by base2 and Prototype

var Class = null;

(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})();
var Set = Class.extend({
  //class variables
  init: function(items, name) {
    //instance variables
    if(name)
      this.name = name;
    else
      this.name = "Set_"+guid();
    this.array = [];
    this.addAll(items);
  },

  //obj can be a filter function or an object to 'equals' against
  find: function(obj) {
    for(var i = 0, l = this.array.length;i<l; ++i)
      if($.isFunction(obj) ?
          obj(this.get(i)) :
          this.equals(this.get(i),obj))
        return this.get(i);
    return null;
  },

  get: function(i) {
    return this.array[i];
  },
  //truthy find
  has: function(item) {
    return !!this.find(item);
  },
  add: function(item) {
    if(!this.has(item)) {
      this.array.push(item);
      return true;
    }
    return false;
  },
  addAll: function(items) {
    if(!items) return 0;
    if(!$.isArray(items)) items = [items];
    var count = 0;
    for(var i = 0, l = items.length; i<l; ++i)
      if(this.add(items[i]))
        count++;
    return count;
  },
  remove: function(item) {
    var newSet = [];
    for(var i = 0, l = this.array.length; i<l; ++i)
      if(!this.equals(this.get(i),item))
        newSet.push(this.get(i));

    this.array = newSet;
    return item;
  },
  removeAll: function() {
    this.array = [];
  },
  equals: function(i1, i2) {
    if(i1 && i2 && i1.equals !== undefined && i2.equals !== undefined)
      return i1.equals(i2);
    else
      return i1 === i2;
  },
  each: function(fn) {
    for(var i = 0, l = this.array.length; i<l; ++i)
      fn(this.get(i));
  },
  map: function(fn) {
    return $.map(this.array,fn);
  },
  filter: function(fn) {
    return $.grep(this.array, fn);
  },
  size: function() {
    return this.array.length;
  },
  getArray: function() {
    return this.array;
  }
});
var TypedSet = Set.extend({
  init: function(type, items, name) {
    this.type = type;
    this._super(items, name);
  },
  add: function(item) {
    if(item instanceof this.type)
      this._super(item);
    else
      this.log("add failed - invalid type")
  }
});
var Utils = {

  //append to arguments[i]
  appendArg: function(args, expr, i) {
      if(!i) i = 0;
      var a = [].slice.call(args, i);
      a[i] = expr + a[i];
      return a;
  },

  //borrowed from lo_dash
  memoize: function(func, resolver) {
    var cache = {};
    return function() {
      var prop = resolver ?
        resolver.apply(this, arguments) :
        Array.prototype.join.call(arguments, '|');
      return Object.prototype.hasOwnProperty.call(cache, prop) ?
          cache[prop] : (cache[prop] = func.apply(this, arguments));
    };
  },

  dateToString: function(date) {
    return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
  },

  parseDate: function(dateStr) {
    //format check
    var m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(!m) return null;

    var date;
    //parse with jquery ui's date picker
    if($.datepicker !== undefined) {
      try {
        var epoch = $.datepicker.parseDate("dd/mm/yy", dateStr);
        date = new Date(epoch);
      } catch(e) { return null; }
    //simple regex parse
    } else {
      date = new Date(parseInt(m[3], 10),parseInt(m[2], 10)-1,parseInt(m[1], 10));
    }

    return date;
  },

  /**
   * returns true if we are in a RTLed document
   * @param {jqObject} field
   */
  isRTL: function(field) {
    var $document = $(document);
    var $body = $('body');
    var rtl =
      (field && field.hasClass('rtl')) ||
      (field && (field.attr('dir') || '').toLowerCase()==='rtl') ||
      $document.hasClass('rtl') ||
      ($document.attr('dir') || '').toLowerCase()==='rtl' ||
      $body.hasClass('rtl') ||
      ($body.attr('dir') || '').toLowerCase()==='rtl';
    return Boolean(rtl);
  }
};


var VERSION = "0.0.1",
    cons = $.consoleNoConflict({ prefix: 'asyncValidator: ' }),
    log  = cons.log,
    warn = cons.warn,
    info = cons.info;

/* ===================================== *
 * Plugin Settings/Variables
 * ===================================== */

var globalOptions = {

  // Display log messages flag
  debug: false,

  // Attribute used to find validators
  validateAttribute: "data-validate",

  // Name of the event triggering field validation
  validationEventTrigger: "blur",

  // Automatically scroll viewport to the first error
  scroll: true,

  // Focus on the first input
  focusFirstField: true,

  // Hide error while the user is changing
  hideErrorOnChange: false,

  // Whether to skip the hidden fields with validators
  skipHiddenFields: true,
  // What class name to apply to the 'errorContainer'
  errorClass: "error",
  // Filter method to find element to apply error class (default: the input)
  errorContainer: function (e) {
    return e;
  },
  //Post form-submit validation hook
  onValidationComplete: function(form, status) {
    return status;
  },
  //tracking method
  track: $.noop,
  //prompt method,
  prompt: function(element, text, opts) {
    if($.type($.prompt) === 'function')
      $.prompt(element, text, opts);
  }
};

//option object creator inheriting from globals
function CustomOptions(opts) {
  $.extend(true, this, opts);
}
CustomOptions.prototype = globalOptions;

/* ===================================== *
 * Base Class
 * ===================================== */

var BaseClass = Class.extend({
  name: "Class",

  init: function() {
  },

  toString: function() {
    return (this.type ? this.type + ": ":'') +
           (this.name ? this.name + ": ":'');
  },

  log: function() {
    if(!globalOptions.debug) return;
    log.apply(this, Utils.appendArg(arguments, this.toString()));
  },
  warn: function() {
    warn.apply(this, Utils.appendArg(arguments, this.toString()));
  },
  info: function() {
    info.apply(this, Utils.appendArg(arguments, this.toString()));
  },

  bind: function(name) {
    var prop = this[name];
    if(prop && $.isFunction(prop))
        this[name] = $.proxy(prop,this);
  },
  bindAll: function() {
    for(var propName in this)
      this.bind(propName);
  }
}); 
var Rule = BaseClass.extend({

  init: function(type,name,userObj){
    this.name = name;
    this.type = type;
    this.buildFn(userObj);
  },

  //extracts the validation function out of the user defined object
  buildFn: function(userObj) {

    //object is already a function...
    if($.isFunction(userObj)) {
      this.fn = userObj;
      this.userObj = null;
      this.ready = true;
      return;
    } else if(!$.isPlainObject(userObj)) {
      return this.warn("rule definition must be a function or an object");
    }

    //object needs to be built into a funtion...

    //clone object to keep a canonical version intact
    this.userObj = $.extend(true, {}, userObj);

    //handle object.extend (may inherit a object.fn)
    while($.type(this.userObj.extend) === 'string') {
      //extend using another validator -> validator type:name or just name
      var m = this.userObj.extend.match(/^((\w+):)?(\w+)$/);
      var otherType = m[2] || this.type;
      var otherName = m[3];
      delete this.userObj.extend;
      //check type exists
      if(!validationRules[otherType]) {
        return this.warn("cannot extend type: '"+otherType+"'");
      }

      var otherUserObj = validationRules[otherType][otherName];
      //check not extending itself
      if(this.userObj === otherUserObj)
        return this.warn("cannot extend self");
      //type check
      if($.isPlainObject(otherUserObj)) {
        this.userObj = $.extend(true, {}, otherUserObj, this.userObj);
      } else {
        return this.warn("cannot extend: '"+otherName+"'");
      }
    }

    //handle object.fn
    if($.isFunction(this.userObj.fn)) {

      //move function into the rule
      this.fn = this.userObj.fn;
      delete this.userObj.fn;

    //handle object.regexp
    } else if($.type(this.userObj.regex) === "regexp") {

      //build regex function
      this.fn = (function(regex) {
        return function(r) {
          var re = new RegExp(regex);
          if(!r.val().match(re))
            return r.message || "Invalid Format";
          return true;
        };

      })(this.userObj.regex);

      delete this.userObj.regex;

    } else {
      return this.warn("rule definition lacks a function");
    }

    this.ready = true;
    //function built
  },


  //the 'this's in these interface mixins
  //refer to the rule 'r' object
  defaultInterface: {
    log: log,
    warn: warn
  },

  defaultFieldInterface: {
    val: function() {
      return this.field.val.apply(this.field,arguments);
    }
  },

  defaultGroupInterface: {
    fields: function(selector) {
      return this.field.find(selector || 'input,select');
    }
  },

  //build public ruleInterface the 'r' rule object
  buildInterface: function(ruleInterface) {
    var objs = [];

    objs.push({});
    //user object has lowest precedence!
    objs.push(this.userObj);
    objs.push(this.defaultInterface);
    if(this.type === 'field')
      objs.push(this.defaultFieldInterface);
    if(this.type === 'group')
      objs.push(this.defaultGroupInterface);
    objs.push(ruleInterface);

    return $.extend.apply(this,objs);
  }
});

/* ===================================== *
 * Rules Manager (Plugin Wide)
 * ===================================== */

var ruleManager = null;
(function() {

  //cached token parser - must be in form 'one(1,2,two(3,4),three[scope](6,7),five)'
  var parse = _.memoize(function(str) {

    var chars = str.split(""), 
        rule, rules = [],
        c, m, depth = 0;
    
    //replace argument commas with semi-colons
    for(var i = 0, l = chars.length; i<l; ++i) {
      c = chars[i];
      if(c === '(') depth++;
      if(c === ')') depth--;
      if(depth > 1) return null;
      if(c === ',' && depth === 1) chars[i] = ";";
    }
    str = chars.join('');
    
    //bracket check
    if(depth !== 0) return null;
    
    //convert to object
    $.each(str.split(','), function(i, rule) {
      m = rule.match(/^(\w+)(\[(\w+)\])?(\((\w+(\;\w)*)\))?$/);
      if(!m) return;
      rule = {};
      rule.name = m[1];
      if(m[3]) rule.scope = m[3];
      if(m[5]) rule.args = m[5].split(';');
      rules.push(rule);
    });
    return rules;
  });

  //privates
  var rawRules = {},
      builtRules = {};

  var addRules = function(type,obj) {
    //check format
    for(var name in obj)
      if(rawRules[name])
        warn("validator '%s' already exists", name);

    obj.type = type;

    //deep extend rules by obj
    $.extend(true, rawRules, obj);
  };

  //public
  var addFieldRules = function(obj) {
    addRules('field', obj);
  };

  var addGroupRules = function(obj) {
    addRules('group', obj);
  };

  var getRule = function(name) {
    var r = builtRules[name];
    if(!r) {
      r = new Rule(name, rawRules[name]);
      builtRules[name] = r;
    }
    return r;
  };

  var parseAttribute = function(validationElem) {
    var attrName = validationElem.form.options.validateAttribute,
        attr = validationElem.elem.attr(attrName);
    if(!attr) return null;
    return parse(attr);
  };

  var parseElement = function(validationElem) {

    var required = false,
        type = null,
        results = [];

    if(validationElem.type !== 'ValidationField')
      return warn("cannot get rules from invalid type");

    if(!validationElem.elem) return [];

    results = this.parseAttribute(validationElem);

    if(!results) return [];

    return $.map(results, function(result) {
      result.rule = getRule(result.name);
    });
  };

  //public interface
  ruleManager = {
    addFieldRules: addFieldRules,
    addGroupRules: addGroupRules,
    getRule: getRule,
    parseAttribute: parseAttribute,
    parseElement: parseElement
  };

}());


var ValidationForm = null;
(function() {

  /* ===================================== *
   * Element Super Class
   * ===================================== */

  var ValidationElement = BaseClass.extend({

    type: "ValidationElement",
    init: function(elem) {

      this.bindAll();
      this.elem = elem;
      this.setName();
      this.executions = [];

      if(!elem.length || elem.data('asyncValidator'))
        return false;

      if(elem)
        elem.data('asyncValidator',this);

      return true;
    },

    setName: function() {
      var name = null;

      if(this.elem)
        name = this.elem.attr('name') || this.elem.attr('id');

      if(!name)
        name = guid();

      this.name = name;
    },

    equals: function(that) {
      var e1, e2;

      if( this.elem )
        e1 = this.elem;
      else
        return false;

      if( that.jquery )
        e2 = that;
      else if( that instanceof ValidationElement && that.elem )
        e2 = that.elem;

      if(e1 && e2)
        return e1.equals(e2);

      return false;
    },

    print: function() {
      if(this instanceof ValidationField)
        this.log(">");

      function innerPrint(validationElem) {
        if(!(validationElem instanceof ValidationElement))
          return;
        validationElem.print();
      }

      for(var name in this) {
        var prop = this[name];
        if(!(prop instanceof Set)) continue;
        this.log(name + " #"+ prop.size(), true);
        prop.each(innerPrint);
        this.log(undefined, false);
      }
    }
  });

  /* ===================================== *
   * Field Wrapper
   * ===================================== */

  var ValidationField = ValidationElement.extend({

    //class variables
    type: "ValidationField",
    init: function(elem, form) {
      //sanity checks
      if(!this._super(elem)) return;
      //instance variables
      this.form = form;
      this.options = form.options;
      this.ruleNames = null;
      this.fieldset = null;
    },

    //for use with $(field).validate(callback);
    validate: function(callback) {
      var exec = new FieldExecution(this);
      exec.execute().always(callback);
      return undefined;
    }
  });

  /* ===================================== *
   * Field Set Wrapper
   * ===================================== */

  var ValidationGroup = ValidationElement.extend({

    //class/default variables
    type: "ValidationGroup",
    nongroup: false,

    init: function(elem, form) {

      //elem is allowed to be an empty selector
      //represents a 'no_group' set - the set of individual fields

      this._super(elem);
      //sanity checks
      if(!elem || !elem.jquery)
        return;

      if(!elem.length) {
        this.nongroup = true;
        this.name += "_nongroup";
      }

      this.form = form;
      this.options = form.options;
      this.fields = new TypedSet(ValidationField);
    }
  });
  /* ===================================== *
   * Form Wrapper
   * ===================================== */

  ValidationForm = ValidationElement.extend({

    /* ===================================== *
     * Instance variables
     * ===================================== */
    type: "ValidationForm",

    init: function(elem, options) {
      //sanity checks
      if(!elem.length) return;
      if(!elem.is("form")) return;
      if(!this._super(elem)) return;

      this.options = new CustomOptions(options);

      this.fields = new TypedSet(ValidationField);
      this.groups = {};
      this.fieldByName = {};
      this.invalidFields = {};
      this.fieldHistory = {};
      this.submitResult = undefined;
      this.submitPending = false;
      this.cache = {
        ruleNames: {},
        ajax: { loading: {}, loaded: {} }
      };

      $(document).ready(this.bindEvents);
    },

    extendOptions: function(opts) {
      $.extend(true, this.options, opts);
    },

    bindEvents: function() {

      this.elem
        .on("keyup.jqv", "input", this.onKeyup)
        .on("blur.jqv", "input[type=text]:not(.hasDatepicker),input:not([type].hasDatepicker)", this.onValidate)
        .on("change.jqv", "input[type=text].hasDatepicker", this.onValidate)
        .on("change.jqv", "select,[type=checkbox],[type=radio]", this.onValidate)
        .on("submit.jqv", this.onSubmit)
        .on("validated.jqv", this.scrollFocus)
        .trigger("initialised.jqv");

      this.updateFields();
      this.log("bound to " + this.fields.size() + " elems");
    },

    unbindEvents: function() {
      this.elem.off(".jqv");
    },

    updateFields: function() {
      var sel = "["+this.options.validateAttribute+"]";
      this.elem.find(sel).each(this.updateField);
      // this.log("print form", true);
      // this.print();
      // this.log(null, false);
    },
    
    //creates new validation elements
    //adds them to the form
    updateField: function(i, elem) {
      if(i.jquery !== undefined) elem = i;
      if(elem.jquery === undefined)
        elem = $(elem);

      var fieldSelector = "input:not([type=hidden]),select,textarea",
          field, fieldElem;

      if(!elem.is(fieldSelector))
        return this.warn("Containers cannot use validators");

      fieldElem = elem;

      field = this.fields.find(fieldElem);

      if(!field) {
        field = new ValidationField(fieldElem, this);
        this.fields.add(field);
      }

      this.updateGroup(field);

      return field;
    },

    updateGroup: function(field) {
      
      // fieldsets = new TypedSet(ValidationGroup);
      var rules = ruleManager.parseAttribute(field);

      this.log(JSON.stringify(rules,null,2));
    },

    /* ===================================== *
     * Event Handlers
     * ===================================== */

    onSubmit: function(event) {

      var submitForm = false;


      if(this.submitPending)
        this.warn("pending...");

      //no result -> begin
      if(!this.submitPending &&
          this.submitResult === undefined) {

        this.submitPending = true;

        var _this = this;
        this.validate(function(error) {
          _this.submitPending = false;
          _this.submitResult = !error;
          _this.elem.submit(); //trigger submit again, though with a result
          _this.submitResult = undefined;
        });

      //have result
      } else if (this.submitResult !== undefined) {
        submitForm = this.options.onValidationComplete(event, this.submitResult);
      }

      if(!submitForm) event.preventDefault();
      return submitForm;
    },

    onKeyup: function(event) {

      if(this.options.hideErrorOnChange)
        this.options.prompt($(event.currentTarget),false);

    },

    onValidate: function(event) {

      var elem = $(event.currentTarget);
      var field = elem.data('asyncValidator') || this.updateField(elem);

      field.log("validate");
      field.validate($.noop);
    },

    /* ===================================== *
     * Validate Form
     * ===================================== */

    validate: function(callback) {
      this.updateFields();
      var exec = new FormExecution(this);
      exec.execute().always(callback);
      return undefined;
    },

    //listening for 'validate' event
    scrollFocus: function() {

      var lastExec = this.executions[this.executions.length-1];

      if(!lastExec.errors.length) return;

      var field = lastExec.errors[0].field;

      var doFocus =
        this.options.focusFirstField &&
        field.is("input[type=text]");

      if (this.options.scroll)
        field.scrollView(function() {
          if(doFocus) field.focus();
        });
      else if(doFocus)
        field.focus();
    }
  });

})();
//only exposing two classes
var FormExecution = null,
    FieldExecution = null;

//instantiated inside private scope
(function() {

  //super class
  //set in private scope
  var Execution = BaseClass.extend({

    STATUS: {
      NOT_STARTED: 0,
      RUNNING: 1,
      COMPLETE: 2
    },

    init: function(element, parent) {
      //corresponding <Form|Fieldset|Field>Element class
      this.element = element;
      if(element) {
        element.executions.push(this);
        this.domElem = element.elem;
      }
      //parent Execution class
      this.parent = parent;
      this.name = guid();
      this.status = this.STATUS.NOT_STARTED;
      this.errors = [];
      this.bindAll();
    },


    toString: function() {
      return this._super() + (this.element || this.rule).toString();
    },

    //execute in sequence, stop on fail
    serialize: function(executables) {
      return $.Deferred.serialize(
        $.map(executables, function(e) {
          return $.isFunction(e) ? e : e.execute;
        })
      );
    },
    //execute all at once,
    parallelize: function(executables) {
      return $.Deferred.parallelize(
        $.map(executables, function(e) {
          return $.isFunction(e) ? e : e.execute;
        })
      );
    },

    execute: function() {
      this.log('execute', true);
      this.status = this.STATUS.RUNNING;
    },

    executed: function(result) {
      this.log('', false);
      this.log('done: ' + result);
      this.status = this.STATUS.COMPLETE;

      //TODO fill the errors array per execution
      // if(!!result)
      //   this.errors.push({elem: this.element, msg: result});

    },

    skipValidations: function() {

      //custom-form-elements.js hidden fields
      if(this.element.form.options.skipHiddenFields &&
        ((!this.domElem.hasClass("styled") && this.domElem.is(':hidden')) ||
         (this.domElem.hasClass("styled") && this.domElem.parents(":hidden").length > 0))) {
        return true;
      }

      //skip disabled
      if(this.domElem.is('[disabled]'))
        return true;

      return false;
    }
  });

  //set in plugin scope
  FormExecution = Execution.extend({
    type: "FormExecution",
    init: function(form) {
      this._super(form);

      this.ajaxs = [];

      //set groups
      var _this = this;
      this.executables = [];
      this.element.fields.map(function(f) {
        _this.executables.push(new FieldExecution(f, _this));
      });
    },

    execute: function() {
      this._super();
      this.log("exec groups #" + this.executables.length);
      this.domElem.triggerHandler("validating");
      return this.parallelize(this.executables).always(this.executed);
    },

    executed: function(result) {
      this._super(result);
      this.element.log('result: ' + (result===undefined ? 'Passed' : 'Failed: ' + result));
      this.domElem.triggerHandler("validated", arguments);
    }

  });



  //set in plugin scope
  FieldExecution = Execution.extend({
    type: "FieldExecution",

    init: function(field, parent) {
      this._super(field, parent);

      this.children = [];

      if(parent instanceof GroupExecution) {
        this.group = parent;
      }
    },

    execute: function() {

      this._super();
      this.skip = true;

      //execute fieldset first
      if(!this.group && this.element.fieldset.nongroup === false) {

        this.log("redirect to group exec: " + this.element.name);
        //no-group, build, execute
        this.group = new GroupExecution(this.element.fieldset, this);
        return this.group.execute().always(function() {
          log('',false);
        });

      }

      this.domElem.triggerHandler("validating");

      //execute rules
      var ruleParams = ruleManager.parseElement(this.element);
      var d = null;

      if(this.skipValidations()) {

        this.log("skip");

      } else if(!ruleParams.required && !$.trim(this.domElem.val())) {
        this.log("not required");

      } else if($.isArray(ruleParams) && ruleParams.length) {
        //has rules - validate!
        var _this = this;

        //prepare rule executions
        var executables = $.map(ruleParams, function(r) {
          return new RuleExecution(r, _this);
        });

        this.log("exec rules #%s", executables.length);
        d = this.serialize(executables);
        this.skip = false;

      } else {
        this.log("no validators");
      }

      if(this.skip === true) {
        d = $.Deferred();
        d.resolve(); //default pass
      }

      d.always(this.executed);
      return d.promise();

    },

    executed: function(result) {

      this._super(result);
      this.log('validated');
      var errored = !!result;
      var opts = this.element.form.options;

      //show/hide prompt
      opts.prompt(this.domElem, result);

      //trigger event on field
      this.domElem.triggerHandler("validated", [result]);

      if(opts.errorClass)
        opts.errorContainer(this.domElem).toggleClass(opts.errorClass, errored);

      var parentGroup = this.parent,
          parentParent = parentGroup && parentGroup.parent,
          trigger = null,
          isTrigger = false;

      if(errored && parentParent && parentParent instanceof FormExecution)
        this.parent.parent.errors.push({
          message: result,
          field: this.domElem
        });

      if(parentGroup)
        trigger = parentGroup.triggerField();

      isTrigger = trigger ? trigger.equals(this.domElem) : true;

      if(isTrigger && (!parentGroup || parentGroup.parent instanceof FieldExecution))
        this.element.options.track(
          'Validate Field',
          this.element.form.name + " " + this.element.name,
          errored ? result : this.skip ? 'Skip' : 'Valid',
          errored ? 0 : 1
        );
    }
  });

  //set in private scope
  var RuleExecution = Execution.extend({
    type: "RuleExecution",

    init: function(ruleParamObj, parent) {
      this._super(null, parent);

      this.rule = ruleParamObj.rule;
      this.params = ruleParamObj.params;
      this.validationElem = this.parent.element;
      this.options = this.validationElem.options;
    },

    execute: function() {
      this._super();
      var d = $.Deferred(),
          rule = this.rule, _this = this;

      d.always(this.executed);

      var callbackCount = 0;
      var callback = function(result) {
        clearTimeout(t);
        callbackCount++;
        _this.log("callback #" + callbackCount + " with: " + result);
        if(callbackCount > 1) return;

        var passed = result === undefined || result === true;
        if(passed)
          d.resolve();
        else
          d.reject(result);
      };

      var validationElem = this.validationElem;

      //sanity checks
      if(!validationElem || !rule.ready) {
        this.warn(!validationElem ? 'invalid parent.' : 'not ready.');
        callback();
        return d.promise();
      } else {
        //READY!
        this.log("run");
      }

      //watch for timeouts
      var t = setTimeout(function() {
        _this.warn("timeout!");
        callback("Timeout");
      }, 10000);


      var currInterface = {};

      //find trigger field in a group execution
      var triggerField = null;
      if(this.parent instanceof GroupExecution)
        currInterface.triggerField = this.parent.triggerField();



      currInterface.field = validationElem.elem;
      currInterface.form =  validationElem.form.elem;
      currInterface.callback = callback;
      currInterface.params = this.params;
      currInterface.args = this.params;
      currInterface.ajax = function(userOpts) {
        ajaxHelper(userOpts, rule, currInterface, validationElem);
      };

      //build the rule interface 'r'
      var ruleInterface = rule.buildInterface(currInterface);

      //finally execute validator
      var result = rule.fn(ruleInterface);

      //instant callback - becomes synchronous
      if(result !== undefined) callback(result);

      return d.promise();
    }
  });

})(); 
$.fn.validate = function(callback) {
  var validator = $(this).data('asyncValidator');
  if(validator)
    validator.validate(callback);
  else
    warn("element does not have async validator attached");
};

$.fn.validate.version = VERSION;

$.fn.asyncValidator = function(userOptions) {
  return this.each(function(i) {

    //get existing form class this element
    var form = $.asyncValidator.forms.find($(this));

    //unbind and destroy form
    if(userOptions === false || userOptions === "destroy") {
      if(form) {
        form.unbindEvents();
        $.asyncValidator.forms.remove(form);
      }
      return;
    }

    if(form) {
      form.extendOptions(userOptions);
    } else {
      form = new ValidationForm($(this), userOptions);
      $.asyncValidator.forms.add(form);
    }

  });
};

$.asyncValidator = function(options) {
  $.extend(globalOptions, options);
};

$.extend($.asyncValidator, {
  version: VERSION,
  addRules: ruleManager.addFieldRules,
  addFieldRules: ruleManager.addFieldRules,
  addGroupRules: ruleManager.addGroupRules,
  log: info,
  warn: warn,
  defaults: globalOptions,
  globals: globalOptions,
  utils: Utils,
  forms: new TypedSet(ValidationForm, [], "FormSet")
});

/* ===================================== *
 * Auto attach on DOM ready
 * ===================================== */

$(function() {
  $("form").filter(function() {
    return $(this).find("[" + globalOptions.validateAttribute + "]").length > 0;
  }).asyncValidator();
});

log("plugin added.");


(function($) {

  if($.asyncValidator === undefined) {
    window.alert("Please include jquery.async.validator.js before each rule file");
    return;
  }
  
  /* Field validation rules.
   * - must be in the form:
   *    <VALIDATOR_NAME>: {
   *     fn: function(r) {
   *
   *        return <TRUE for pass/STRING for fail and display>;
   *      }
   *    }
   * - parameter 'r' is the rule object.
   *   # it has a callback method used in asynchronous functions
   *   e.g.
   *   <VALIDATOR_NAME>: {
   *     fn: function(r) {
   *
   *        <SOME LENGTHY TASK> {
   *           r.callback(<TRUE for pass/STRING for fail and display>);
   *        }
   *
   *        return undefined; //ASYNC!
   *      }
   *    }
   *  # it gets merged with the object properties e.g. 'r.messages'
   */
  $.asyncValidator.addFieldRules({
    /* Regex validators
     * - at plugin load, 'regex' will be transformed into validator function 'fn' which uses 'message'
     */
    currency: {
      regex: /^\$?\d+(,\d+)*(\.\d+)?$/,
      message: "Invalid monetary value"
    },
    email: {
      regex: /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      message: "Invalid email address"
    },
    alphanumeric: {
      regex: /^[0-9A-Za-z]+$/,
      message: "Use digits and letters only"
    },
    street_number: {
      regex: /^\d+[A-Za-z]?(-\d+)?[A-Za-z]?$/,
      message: "Street Number only"
    },
    number: {
      regex: /^\d+$/,
      message: "Use digits only"
    },
    numberSpace: {
      regex: /^[\d\ ]+$/,
      message: "Use digits and spaces only"
    },
    postcode: {
      regex: /^\d{4}$/,
      message: "Invalid postcode"
    },
    date: {
      fn: function(r) {
        if($.asyncValidator.utils.parseDate(r.val()))
          return true;
        return r.message;
      },
      message: "Invalid date"
    },
    required: {

      fn: function(r) {
        return r.requiredField(r, r.field);
      },

      requiredField: function(r, field) {
        var v = field.val();
  
        switch (field.prop("type")) {
          case "radio":
          case "checkbox":
            var name = field.attr("name");
            if (r.form.find("input[name='" + name + "']:checked").size() === 0) {
              if (r.form.find("input[name='" + name + "']").size() === 1)
                return r.messages.checkboxSingle;
              else
                return r.messages.checkboxMultiple;
            }
            break;

          default:
            if (! $.trim(v))
              return r.messages.all;
            break;
        }
        return true;
      },
      messages: {
        "all": "This field is required",
        "checkboxMultiple": "Please select an option",
        "checkboxSingle": "This checkbox is required"
      }
    },
    regex: {
      fn: function(r) {
        var re;
        try {
          var str = r.args[0];
          re = new RegExp(str);
        } catch(error) {
          r.warn("Invalid regex: " + str);
          return true;
        }

        if(!r.val().match(re))
          return r.message || "Invalid Format";
        return true;
      },
      message: "Invalid format"
    },
    asyncTest: function(r) {

      r.prompt("Please wait...");
      setTimeout(function() {
        r.callback();
      },2000);

    },
    phone: function(r) {
      r.val(r.val().replace(/\D/g,''));
      var v = r.val();
      if(!v.match(/^[\d\s]+$/))
        return "Use digits and spaces only";
      if(!v.match(/^0/))
        return "Number must start with 0";
      if(v.replace(/\s/g,"").length !== 10)
        return "Must be 10 digits long";
      return true;
    },
    size: function(r){
      var v = r.val(), exactOrLower = r.args[0], upper = r.args[1];
      if(exactOrLower !== undefined && upper === undefined) {
        var exact = parseInt(exactOrLower, 10);
        if(r.val().length !== exact)
          return  "Must be "+exact+" characters";
      } else if(exactOrLower !== undefined && upper !== undefined) {
        var lower = parseInt(exactOrLower, 10);
        upper = parseInt(upper, 10);
        if(v.length < lower || upper < v.length)
          return "Must be between "+lower+" and "+upper+" characters";
      } else {
        console.log("size validator parameter error on field: " + r.field.attr('name'));
      }
      
      return true;
    },
    min: function(r) {
      var v = r.val(), min = parseInt(r.args[0], 10);
      if(v.length < min)
        return "Must be at least " + min + " characters";
      return true;
    },
    max: function(r) {
      var v = r.val(), max = parseInt(r.args[0], 10);
      if(v.length > max)
        return "Must be at most " + max + " characters";
      return true;
    },

    decimal: function(r) {
      var vStr = r.val(),
          places = r.args[0] ? parseInt(r.args[0], 10) : 2;
    
      if(!vStr.match(/^\d+(,\d{3})*(\.\d+)?$/))
        return "Invalid decimal value";
  
      var v = parseFloat(vStr.replace(/[^\d\.]/g,'')),
          factor = Math.pow(10,places);

      v = (Math.round(v*factor)/factor);
      r.field.val(v);

      return true;
    },
    min_val: function(r) {
      var v = parseFloat(r.val().replace(/[^\d\.]/g,'')),
          suffix = r.args[1] || '',
          min = parseFloat(r.args[0]);
      if(v < min)
        return "Must be greater than " + min + suffix;
      return true;
    },
    max_val: function(r) {
      var v = parseFloat(r.val().replace(/[^\d\.]/g,'')),
          suffix = r.args[1] || '',
          max = parseFloat(r.args[0]);
      if(v > max)
        return "Must be less than " + max + suffix;
      return true;
    },
    range_val: function(r) {
      var v = parseFloat(r.val().replace(/[^\d\.]/g,'')),
          prefix = r.args[2] || '',
          suffix = r.args[3] || '',
          min = parseFloat(r.args[0]),
          max = parseFloat(r.args[1]);
      if(v > max || v < min)
        return "Must be between " + prefix + min + suffix + "\nand " + prefix + max + suffix;
      return true;
    },

    agreement: function(r){
      if(!r.field.is(":checked"))
        return "You must agree to continue";
      return true;
    },
    minAge: function(r){
      var age = r.args[0];
      if(!age || isNaN(parseInt(age,10))) {
        console.log("WARNING: Invalid Age Param: " + age);
        return true;
      }
      var currDate = new Date();
      var minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - parseInt(age,10));
      var fieldDate = $.asyncValidator.utils.parseDate(r.val());

      if(fieldDate === "Invalid Date")
        return "Invalid Date";
      if(fieldDate > minDate)
        return "You must be at least " + age;
      return true;
    }
  });

  /* Group validation rules.
   * - same form as field validation rules
   * - however 'r' has extra options:
   *   # 'fields()': list of elements within the group
   *   # 'run': must be 'before' or 'after'
   *      whether to run the group rules before or after
   *      the field validations (default: 'after')
   */
  $.asyncValidator.addGroupRules({
    required: {
      run: 'before',
      extend: "field:required",
      fn: function(r) {

        var result = true;

        r.fields().each(function() {
          if(result !== true) return;
          result = r.requiredField(r, $(this));
        });

        return result;
      }
    },

    dateRange: {
      run: 'after',
      fn: function(r) {

        var start = r.fields("[data-date=start]"),
            end = r.fields("[data-date=end]");

        if(start.length === 0 || end.length === 0) {
          r.warn("Missing dateRange fields, skipping...");
          return true;
        }

        var startDate = $.asyncValidator.utils.parseDate(start.val());
        if(!startDate)
          return "Invalid Start Date";

        var endDate = $.asyncValidator.utils.parseDate(end.val());
        if(!endDate)
          return "Invalid End Date";

        if(startDate >= endDate)
          return "Start Date must come before End Date";

        return true;
      }
    },

    min_checks: {
      run: 'before',

      fn: function(r) {

        var checks = r.fields("input[type=checkbox]:checked");
        var checksRequired = parseInt(r.args[0],10);

        if(checks.length < checksRequired)
          return "You must choose at least " + (checksRequired === 1 ? 'one' : checksRequired);
        return true;
      }
    }

  });

})(jQuery);
}(window,document));