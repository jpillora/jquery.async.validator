//= require helper/json2
//= require helper/json2
//= require helper/resig-class
//= require helper/set
//= require helper/typedset
//= require helper/param-parser
//= require jquery.prompt
//= require jquery.console
//= require_self
//= require_directory ./jquery.async.validator


/*! jQuery Asynchronous Validator - v1.0.0 - 2012-12-14
* https://github.com/jpillora/jquery.async.validator
* Copyright (c) 2012 Jaime Pillora MIT Licensed  */


(function($) {

  "use strict";

  var VERSION = "1.0.0";

  /* ===================================== *
   * Debug helpers
   * ===================================== */

  var cons = $.consoleNoConflict({ prefix: 'asyncValidator: ' }),
      log  = cons.log,
      warn = cons.warn,
      info = cons.info;

  /* ===================================== *
   * Utility class
   * ===================================== */

  var Utils = {

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
      var m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
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
  /* ===================================== *
   * Validation Rules
   * ===================================== */

  var validationRules = {
    field:{},
    group:{}
  };

  function addFieldRules(obj) {
    addRules('field', obj);
  }
  function addGroupRules(obj) {
    addRules('group', obj);
  }
  function addRules(type,obj) {
    //check format
    for(var name in obj) {
      if(validationRules[type][name])
        warn("validator '%s' already exists", name);
      // else
      //   log("adding %s validator '%s'", type, name);
    }

    //deep extend rules by obj
    $.extend(true, validationRules[type], obj);
  }

  //initialised in private scope
  var getElementRulesAndParams = null;
  (function(){
    //private scope for helper functions

    //cached token parser - must be in form 'one(1,2,two(3,4))'
    var parse = Utils.memoize(ParamParser.parse);

    var parseAttribute = function(elem, formOpts) {
    };

    //cached rule builder
    var getRule = Utils.memoize(function(type,name) {
      if(type !== 'field' && type !== 'group')
        return warn("invalid rule type: '" + type + "'");

      var userObj = validationRules[type][name];
      if(!userObj)
        return warn("missing '"+type+"' rule '"+name+"'");

      return new Rule(type, name, userObj);
    });

    //getElementRules
    getElementRulesAndParams = function(validationElem) {

      var required = false,
          type = null,
          rules = [];

      if(validationElem.type === 'ValidationGroup')
        type = 'group';
      else if(validationElem.type === 'ValidationField')
        type = 'field';
      else
        return warn("cannot get rules from invalid type");

      if(!validationElem.elem)
        return rules;

      var attrName = validationElem.form.options.validateAttribute;
      var attr = validationElem.elem.attr(attrName);

      if(!attr)
        return rules;

      var results = parse("x("+attr+")").x;

      if(!results)
        return rules;

      for(var i = 0, l = results.length; i<l;++i ) {

        var name = null, params = [], result = results[i];
        //validate parsed names and params
        if(!result)
          return warn("cannot execute null rule");
        else if ($.type(result) === 'string')
          name = result;
        else if ($.isPlainObject(result)) {

          for(var n in result)
            if(name) return warn('rule object should only contain 1 key');
            else name = n;

          if(!name)
            return warn('rule object should contain 1 key');

          params = result[name];

          if(!$.isArray(params))
            return warn('invalid rule params type - must be array');
        } else
          return warn('cannot execute rule of type "'+$.type(result)+'"');

        name = $.trim(name);

        if(name === 'required') required = true;

        //validated
        var rule = getRule(type,name);

        if(rule)
          rules.push({rule: rule, params: params});
      }

      rules.required = required;

      return rules;
    };
  })();


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

  //append to arguments[0]
  function appendArg(args, expr) {
      var a = [].slice.call(args, 0);
      a[0] = expr + a[0];
      return a;
  }

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
      log.apply(this, appendArg(arguments, this.toString()));
    },
    warn: function() {
      warn.apply(this, appendArg(arguments, this.toString()));
    },
    info: function() {
      info.apply(this, appendArg(arguments, this.toString()));
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


  /* ===================================== *
   * Ajax Helper Class
   * ===================================== */

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

  /* ===================================== *
   * Rule Class
   * ===================================== */

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
   * Execution Classes
   * ===================================== */

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
        this.element.fieldsets.map(function(f) {
          _this.executables.push(new GroupExecution(f, _this));
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
        this.element.info('result: ' + (result===undefined ? 'Passed' : 'Failed: ' + result));
        this.domElem.triggerHandler("validated", arguments);
      }

    });

    //set in private scope
    var GroupExecution = Execution.extend({
      type: "GroupExecution",

      init: function(fieldset, parent) {
        this._super(fieldset, parent);
      },

      execute: function() {
        this._super();

        if(this.skipValidations())
          return $.Deferred().always(this.executed).resolve().promise();

        this.log('getting group rules');
        var ruleParams = getElementRulesAndParams(this.element);

        //map group rules into before/after groups
        var ruleExes = $.map(ruleParams, $.proxy(function(r) {
          return new RuleExecution(r, this);
        },this));

        this.beforeRules = [];
        this.afterRules = [];

        for(var i = 0, l = ruleExes.length; i<l; ++i){
          var ruleExe = ruleExes[i];
          if(ruleExe.rule.userObj &&
             ruleExe.rule.userObj.run === 'after')
            this.afterRules.push(ruleExe);
          else
            this.beforeRules.push(ruleExe);
        }

        //decide which fields to include
        //in this group execution
        if(this.parent instanceof FieldExecution &&
           this.afterRules.length === 0) {
          //if executed from a field and there are no 'after' rules
          //only validate the one field
          var field = this.parent;
          field.group = this;
          this.fields = [field];
        } else {
          //if executed from a form or there are 'after' rules
          //validate all fields in the group (fieldset)
          this.fields = this.element.fields.map($.proxy(function(f) {
            return new FieldExecution(f, this);
          },this));
        }

        this.log("exec");

        var executables = [];

        if(this.beforeRules.length > 0)
          executables.push(this.execBefore);

        executables.push(this.execFields);

        if(this.afterRules.length > 0)
          executables.push(this.execAfter);

        //execute in 3 stages
        return this.serialize(executables).always(this.executed);
      },

      //group validators
      execBefore: function() {
        this.log("before rules #%s", this.beforeRules.length);
        return this.serialize(this.beforeRules).always(this.executedBefore);
      },

      //field validators
      execFields: function() {
        this.log("exec fields #%s", this.fields.length);
        return this.parallelize(this.fields).always(this.executedFields);
      },

      //more group validators
      execAfter: function() {
        this.log("after rules #%s", this.afterRules.length);
        return this.serialize(this.afterRules).always(this.executedAfter);
      },

      executedBefore: function(result) {
        this.executedBeforeAfter(result);
      },

      executedFields: function(result) {
      },

      executedAfter: function(result) {
        this.executedBeforeAfter(result);
      },

      executedBeforeAfter: function(result) {

        var errored = !!result;
        var opts = this.element.form.options;

        
        this.element.fields.each(function(f) {
          opts.prompt(f.elem, false);
          if(opts.errorClass)
            opts.errorContainer(f.elem)
              .toggleClass(opts.errorClass, errored);
        });

        var elem = this.triggerField();
        if(!elem) elem = this.element.fields.array[0] && this.element.fields.array[0].elem;
        if(elem) opts.prompt(elem, result);



        if(this.parent instanceof FieldExecution)
          this.parent.element.options.track(
            'Validate Group',
            this.parent.element.name + ';' + (this.domElem.attr('data-validate') || 'non_group'),
            errored ? result : 'Valid',
            errored ? 0 : 1
          );
      },

      executed: function(result) {
        this._super();
        var errored = !!result;
      },

      triggerField: function() {
        if(this.parent instanceof FieldExecution)
          return this.parent.domElem;
        return null;
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
        var ruleParams = getElementRulesAndParams(this.element);
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

  /* ===================================== *
   * Field Classes
   * ===================================== */

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
        this.fieldsets = new TypedSet(ValidationGroup);
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
        this.info("bound to " + this.fields.size() + " elems");
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
            field, fieldElem, fieldset, fieldsetElem;

        if(elem.is(fieldSelector))
          fieldElem = elem;
        else
          fieldsetElem = elem;

        //have field - find its fieldset
        if(fieldElem) {
          field = this.fields.find(fieldElem);

          if(!field) {
            field = new ValidationField(fieldElem, this);
            this.fields.add(field);
          }
          fieldsetElem = fieldElem.parentsUntil(this.elem, "["+this.options.validateAttribute+"]:first");
        }

        //TODO allow nested fieldsets
        //fieldsetElem = elem.parentsUntil(this.elem, "["+this.options.validateAttribute+"]:first");

        fieldset = this.fieldsets.find(fieldsetElem);

        if(!fieldset) {
          fieldset = new ValidationGroup(fieldsetElem, this);
          this.fieldsets.add(fieldset);
        }

        if(field) {
          fieldset.fields.add(field);
          field.fieldset = fieldset;
        } else {
          fieldsetElem.find(fieldSelector).each(this.updateField);
        }

        return field;
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

  $.fn.scrollView = function(onComplete) {
    return this.each(function() {

      var field = $(this);
      if(field.is(".styled")) field = field.siblings("span");
      $('html, body').animate({
          scrollTop: Math.max(0,field.offset().top - 100)
      }, {
          duration: 1000,
          complete: onComplete || $.noop
      });

    });
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

  //allow programmatic validations
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

  /* ===================================== *
   * Plugin Public Interface
   * ===================================== */

  $.asyncValidator = function(options) {
    $.extend(globalOptions, options);
  };

  $.extend($.asyncValidator, {
    version: VERSION,
    addFieldRules: addFieldRules,
    addGroupRules: addGroupRules,
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
      return $(this).find("[data-validate]").length; 
    }).asyncValidator();
  });

  $(function() {
    $("form").filter(function() {
      return $(this).find("[data-validate]").length > 0;
    }).asyncValidator();
  });

  log("plugin added.");

})(jQuery);