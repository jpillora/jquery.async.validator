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
      this.element.log('result: ' + (result===undefined ? 'Passed' : 'Failed: ' + result));
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
          this.parent.element.name + ';' +
            (this.domElem.attr(opts.validateAttribute) || 'non_group'),
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