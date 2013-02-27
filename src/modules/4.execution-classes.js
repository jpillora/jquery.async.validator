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

    type: "Execution",

    STATUS: {
      NOT_STARTED: 0,
      RUNNING: 1,
      COMPLETE: 2,
      WAITING_FOR_GROUP: 3
    },

    init: function(element, parent) {
      //corresponding <Form|Fieldset|Field>Element class
      this.element = element;
      if(element) {
        element.execution = this;
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
      // this.log('execute', true);
      this.status = this.STATUS.RUNNING;
      if(this.domElem)
        this.domElem.triggerHandler("validating");
    },

    executed: function(exec) {
      // this.log('', false);
      this.log('done: ' + exec.success);
      this.status = this.STATUS.COMPLETE;
      this.success = exec.success;
      this.result = exec.result;

      if(this.domElem)
        this.domElem.triggerHandler("validated", arguments);

      //TODO fill the errors array per execution
      // if(!!result)
      //   this.errors.push({elem: this.element, msg: result});

    },

    //resolves or rejects the execution's deferred object 'd'
    resolve: function() {
      if(!this.d || !this.d.resolve) throw "Invalid Deferred Object";
      this.nextTick(this.d.resolve, [this], 0);
    },
    reject: function() {
      if(!this.d || !this.d.reject) throw "Invalid Deferred Object";
      this.nextTick(this.d.reject, [this], 0);
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

      //prepare child executables
      this.children = this.element.fields.map($.proxy(function(f) {
        return new FieldExecution(f, this);
      }, this));
    },

    execute: function() {
      this._super();
      this.log("exec fields #" + this.children.length);
      this.d = this.parallelize(this.children).always(this.executed);
      return this.d;
    },

    executed: function(exec) {
      this._super(exec);
      this.element.log('result: ' + (exec.success ? 'Passed' : 'Failed: ' + exec.result));
    }

  });

  //set in plugin scope
  FieldExecution = Execution.extend({
    type: "FieldExecution",

    init: function(field, parent) {
      this._super(field, parent);
      this.children = [];
      this.executables = null;
    },

    execute: function() {
      this._super();

      //execute rules
      var ruleParams = ruleManager.parseElement(this.element);
      this.d = null;

      //skip check
      if(this.skipValidations()) {
        this.log("skip");
      } else if(!ruleParams.required && !$.trim(this.domElem.val())) {
        this.log("not required");
      } else if(ruleParams.length === 0) {
        this.log("no validators");
      
      //ready!
      } else {
        this.children = $.map(ruleParams, $.proxy(function(r) {
          if(r.rule.type === 'group')
            return new GroupRuleExecution(r, this);
          else
            return new RuleExecution(r, this);
        }, this));

        // this.log("exec rules #%s", this.children.length);
        this.d = this.serialize(this.children);
      }

      //pass when skipping
      this.skip = this.d === null;
      if(this.d === null) {
        this.d = $.Deferred();
        this.resolve();
      }

      this.d.always(this.executed);
      return this.d.promise();
    },

    executed: function(exec) {

      this._super(exec);
      var errored = !exec.success;
      var opts = this.element.form.options;

      //show/hide prompt
      opts.prompt(this.domElem, exec.result);

      // if(opts.errorClass)
      //   opts.errorContainer(this.domElem).toggleClass(opts.errorClass, errored);

      // var parentGroup = this.parent,
      //     parentParent = parentGroup && parentGroup.parent,
      //     trigger = null,
      //     isTrigger = false;

      // if(errored && parentParent && parentParent instanceof FormExecution)
      //   this.parent.parent.errors.push({
      //     message: result,
      //     field: this.domElem
      //   });

      // if(parentGroup)
      //   trigger = parentGroup.triggerField();

      // isTrigger = trigger ? trigger.equals(this.domElem) : true;

      // if(isTrigger && (!parentGroup || parentGroup.parent instanceof FieldExecution))
      //   this.element.options.track(
      //     'Validate Field',
      //     this.element.form.name + " " + this.element.name,
      //     errored ? result : this.skip ? 'Skip' : 'Valid',
      //     errored ? 0 : 1
      //   );
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
      this.rObj = {};
    },

    //the function that gets called when
    //rules return or callback
    callback: function(result) {
      clearTimeout(this.t);
      this.callbackCount++;
      this.log("callback #" + this.callbackCount + " with: " + result);
      if(this.callbackCount > 1) return;

      var passed = result === undefined || result === true;

      //success
      if(passed) {
        this.resolve();
      } else {
        this.result = result;
        this.reject();
      }
    },

    timeout: function() {
      this.warn("timeout!");
      this.callback("Timeout");
    },

    execute: function() {
      this._super();
      this.callbackCount = 0;
      this.d = $.Deferred();

      this.d.always(this.executed);

      //sanity checks
      if(!this.validationElem || !this.rule.ready) {
        this.warn(this.validationElem ? 'not ready.' : 'invalid parent.');
        callback();
        return d.promise();
      }

      //finally execute validator
      var result = this.rule.fn(this.buildInterface());

      //used return statement
      if(result !== undefined)
        this.nextTick(this.callback, [result]);

      return this.d.promise();
    },

    buildInterface: function() {
      //READY!
      this.log("run");

      //watch for timeouts
      this.t = setTimeout(this.timeout, 10000);


      //find trigger field in a group execution
      var triggerField = null;
      // if(this.parent instanceof GroupExecution)
      //   currInterface.triggerField = this.parent.triggerField();

      this.rObj.field = this.validationElem.elem;
      this.rObj.form =  this.validationElem.form.elem;
      this.rObj.callback = this.callback;
      this.rObj.params = this.params;
      this.rObj.args = this.params;
      this.rObj.ajax = function(userOpts) {
        ajaxHelper(userOpts, this.rule, this.rObj, this.validationElem);
      };

      //build the rule interface 'r'
      return this.rule.buildInterface(this.rObj);
    }

  });

  var GroupRuleExecution = RuleExecution.extend({

    type: "GroupRuleExecution",

    init: function(ruleParamObj, parent) {
      this._super(ruleParamObj, parent);
      this.group = ruleParamObj.name;
      this.id = ruleParamObj.id;
      this.scope = ruleParamObj.scope || 'default';
    },

    execute: function() {
      var fieldExec = this.parent,
          execute = $.proxy(this._super, this),          
          groupSet = this.validationElem.groups[this.group][this.scope];

      if(!groupSet) throw "Missing Group Set";

      return fieldExec.parent ?
        this.executeForm  (groupSet, execute) :
        this.executeSingle(groupSet, execute);
    },

    //if run from the form
    //wait for other fields, cancel if others fail before reaching the group
    executeForm: function(groupSet, execute) {
      this.log("FORM");

      var ready = false;

      groupSet.each(function(field) {

        var exec = field.execution;
        if(!exec) return;
        console.log(exec);
      });

      var d = execute();

      return d;
    },


    //if run from editing the field
    //only trigger others if each sibling's last execution got up to the group
    executeSingle: function(groupSet, execute) {
      this.log("SINGLE");

      var ready = true;

      groupSet.each(function(field) {

        var exec = field.execution;
        if(!exec) {
          ready = false;
        }
        //TODO
        return ready;
      });

      //deferred
      var d = null;
      if(ready) {
        d = execute();
      } else {
        d = $.Deferred();
        this.reject();
      }

      return d;
    }


  });

})(); 