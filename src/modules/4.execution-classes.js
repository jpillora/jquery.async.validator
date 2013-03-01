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
        this.options = this.element.options;
        this.domElem = element.domElem;
      }
      //parent Execution class
      this.parent = parent;
      this.name = guid();
      this.status = this.STATUS.NOT_STARTED;
      this.errorField = null;
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
      this.log('done: ' + (exec.rule ? exec.rule.name+': ' : '') + exec.success);
      this.status = this.STATUS.COMPLETE;
      this.success = exec.success;
      this.result = exec.result;

      if(this.domElem)
        this.domElem.triggerHandler("validated", arguments);

      //fill the errors array per execution
      if(this.success)
        this.errors.push({domElem: this.element, msg: this.result});

    },

    //resolves or rejects the execution's deferred object 'd'
    resolve: function() {
      if(!this.d || !this.d.resolve) throw "Invalid Deferred Object";
      if(!this.success) this.success = true;
      this.nextTick(this.d.resolve, [this], 0);
      return this.d.promise();
    },
    reject: function() {
      if(!this.d || !this.d.reject) throw "Invalid Deferred Object";
      if(!this.success) this.success = false;
      this.nextTick(this.d.reject, [this], 0);
      return this.d.promise();
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
    },

    //array of { domElem: ... message: ... }
    getErrorFields: function() {
      var list = [],
          _this = this,
          domElem,
          add = function(domElem, message) {
            list.push({ domElem: domElem, result: message });
          };

      var r = this.r, errorFields = null;
      if(r) errorFields = r.errorFields || r.errorField;

      //id string
      if(typeof errorFields === 'string') {
        domElem = this.r.groupElem(errorFields);
        if(domElem)
          add(domElem, this.result);

      //ids array
      } else if($.isArray(errorFields)) {
        $.each(errorFields, function(i, id) {
          domElem = _this.r.groupElem(id);
          if(domElem)
            add(domElem, _this.result);
        });
      //ids -> message object
      } else if($.isPlainObject(errorFields)) {
        for(var id in errorFields) {
          domElem = this.r.groupElem(id);
          if(domElem)
            add(domElem, errorFields[id]);
        }
      //default
      } else {
        add(this.element.domElem, this.result);
      }

      return list;
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
    },

    execute: function() {
      this._super();

      //execute rules
      var ruleParams = ruleManager.parseElement(this.element);
      this.d = null;

      //skip check
      if(this.skipValidations()) {
        this.log("skip");
      } else if(this.options.skipNotRequired && 
                !ruleParams.required &&
                !$.trim(this.domElem.val())) {
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

      this.element.displayErrors(exec);

      // if(isTrigger && (!parentGroup || parentGroup.parent instanceof FieldExecution))
      //   this.element.options.track(
      //     'Validate Field',
      //     this.element.form.name + " " + this.element.name,
      //     errored ? result : this.skip ? 'Skip' : 'Valid',
      //     errored ? 0 : 1
      //   );

      this.log("FINITO ! " + exec.name);
    }
    
  });

  //set in private scope
  var RuleExecution = Execution.extend({
    type: "RuleExecution",

    init: function(ruleParamObj, parent) {
      this._super(null, parent);

      this.d = $.Deferred();
      this.d.always(this.executed);

      this.rule = ruleParamObj.rule;
      this.params = ruleParamObj.params;
      this.element = this.parent.element;
      this.options = this.element.options;
      this.rObj = {};
    },

    //the function that gets called when
    //rules return or callback
    callback: function(result) {
      clearTimeout(this.t);
      this.callbackCount++;
      // this.log("callback #" + this.callbackCount + " with: " + result);
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

      //sanity checks
      if(!this.element || !this.rule.ready) {
        this.warn(this.element ? 'not  ready.' : 'invalid parent.');
        return this.resolve();
      }

      this.t = setTimeout(this.timeout, 10000);
      this.r = this.rule.buildInterface(this);
      //finally execute validator
      var result = this.rule.fn(this.r);

      //used return statement
      if(result !== undefined)
        this.nextTick(this.callback, [result]);

      return this.d.promise();
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

      this.realExecute = $.proxy(this._super, this);

      var groupSet = this.element.groups[this.group][this.scope];

      if(!groupSet)
        throw "Missing Group Set";
      if(groupSet.size() === 1)
        this.warn("Group only has 1 field. Consider a field rule.");

      this.getSiblings(groupSet);

      return this.parent.parent ?
        this.executeAll() :
        this.executeOne();
    },

    //ensures that another execution is a member the group
    isMember: function(that) {
      return that.type === "GroupRuleExecution" &&
             this.group === that.group &&
             this.scope === that.scope;
    },

    //gets an array of sibling executions which are ready to be linked
    getSiblings: function(groupSet) {

      var ready = true, siblings = [], _this = this;

      //get all fields in the group
      groupSet.each(function(field) {
        //get field's current execution
        var f = field.execution;

        //skip self
        if(_this.element === field) return;

        //no execution to check
        if(!f) ready = false;

        //check child rule execs
        var last = null;
        if(ready)
        $.each(f.children, function(i, rule) {
          //if the sibling group execution

          _this.log(rule);

          if(_this.isMember(rule)) {
            siblings.push(rule);
            //does not have a previously complete execution
            //mark not ready
            if(last && (last.status !== last.STATUS.COMPLETE || !last.success)) {
              ready = false;
              return false;
            }

            // _this.log(field)
            // _this.log("sibling: " + rule.rule);
          }
          last = rule;
        });

        //only keep checking if not cancelled
        return ready;
      });

      this.siblings = ready ? siblings : null;
      this.members = ready ? siblings.concat([this]) : null;
    },

    //if run from the form
    //wait for other fields, cancel if others fail before reaching the group
    executeAll: function() {
      this.log("ALL");

      var _this = this;

      //ready ! each member of the group
      //is up to the group validator
      if(this.siblings) {
        $.each(this.siblings, function(i, rule) {
          _this.log("LINK: " + rule);
          //use the status of this group
          //as the status of each linked
          _this.d.done(rule.d.resolve);
          _this.d.fail(rule.d.reject);

          //silent fail if one of the linked fields' rules
          //fails prior to reaching the group validation
          rule.parent.d.fail(function(exec) {
            _this.d.reject();
          });
        });
        //execute this 'd', linked siblings will run on
        return this.realExecute();
      }

      this.log("WAIT");
      //not ready - wait
      return this.d.promise();
    },

    //if run from editing the field
    //only trigger others if each sibling's last execution got up to the group
    executeOne: function(execute) {
      this.log("ONE");

      if(this.siblings) {
        this.log("ONE - READY");
        return this.realExecute();      
      }

      return this.reject();
    }


  });

})(); 