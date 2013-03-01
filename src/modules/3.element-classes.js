/* ===================================== *
 * Validation Classes
 * ===================================== */

var ValidationForm = null;
(function() {

  /* ===================================== *
   * Element Super Class
   * ===================================== */

  var ValidationElement = BaseClass.extend({

    type: "ValidationElement",
    init: function(domElem) {

      this.bindAll();
      this.domElem = domElem;
      this.setName();
      this.execution = null;

      if(!domElem.length || domElem.data('asyncValidator'))
        return false;

      if(domElem)
        domElem.data('asyncValidator',this);

      return true;
    },

    setName: function() {
      var name = null;

      if(this.domElem)
        name = this.domElem.attr('name') || this.domElem.attr('id');

      if(!name)
        name = guid();

      this.name = name;
    },

    equals: function(that) {
      var e1, e2;

      if( this.domElem )
        e1 = this.domElem;
      else
        return false;

      if( that.jquery )
        e2 = that;
      else if( that instanceof ValidationElement && that.domElem )
        e2 = that.domElem;

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
    init: function(domElem, form) {
      //sanity checks
      if(!this._super(domElem)) return;
      //instance variables
      this.form = form;
      this.options = form.options;
      this.groups = form.groups;
      this.ruleNames = null;
    },

    //for use with $(field).validate(callback);
    validate: function(callback) {
      (new FieldExecution(this)).execute().always(function(exec) {
        if(callback) callback(exec.result, exec.success);
      });
      return undefined;
    },

    update: function() {
      this.rules = ruleManager.parseElement(this);

      //manage this field within shared groups
      for(var i = 0; i < this.rules.length; ++i) {
        var r = this.rules[i];
        if(r.rule.type !== 'group') continue;
        if(!this.groups[r.name])
          this.groups[r.name] = {};
        var scope = r.scope || 'default';
        if(!this.groups[r.name][scope])
          this.groups[r.name][scope] = new TypedSet(ValidationField);
        this.groups[r.name][scope].add(this);
      }
    },

    displayErrors: function(exec) {
      
      if(exec.errorDisplayed) return;

      var opts = this.options,
          prompt = opts.prompt,
          errorFields = exec.getErrorFields();

      $.each(errorFields, function(i, err) {
        prompt(err.domElem, err.result);
        if(opts.errorClass)
          opts.errorContainer(err.domElem).toggleClass(opts.errorClass, !exec.success);
      });

      exec.errorDisplayed = true;
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

    init: function(domElem, options) {
      //sanity checks
      if(!domElem.length) return;
      if(!domElem.is("form")) return;
      if(!this._super(domElem)) return;

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

      this.domElem
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
      this.domElem.off(".jqv");
    },

    updateFields: function() {
      var sel = "["+this.options.validateAttribute+"]";
      this.domElem.find(sel).each(this.updateField);

      // this.log("print form", true);
      // this.print();
      // this.log(null, false);
    },
    
    //creates new validation elements
    //adds them to the form
    updateField: function(i, domElem) {
      if(i.jquery !== undefined) domElem = i;
      if(domElem.jquery === undefined)
        domElem = $(domElem);

      var fieldSelector = "input:not([type=hidden]),select,textarea",
          field, fieldElem;

      if(!domElem.is(fieldSelector))
        return this.warn("Element '"+domElem.prop('tagName')+"' cannot use validators");

      fieldElem = domElem;

      field = this.fields.find(fieldElem);

      if(!field) {
        field = new ValidationField(fieldElem, this);
        this.fields.add(field);
      }

      field.update();

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
        this.validate(this.doSubmit);

      //have result
      } else if (this.submitResult !== undefined) {
        submitForm = this.options.onValidationComplete(event, this.submitResult);
      }

      if(!submitForm) event.preventDefault();
      return submitForm;
    },

    doSubmit: function(err, result) {
      this.submitPending = false;
      this.submitResult = !err;
      this.domElem.submit(); //trigger onSubmit, though with a result
      this.submitResult = undefined;
    },

    onKeyup: function(event) {
      if(this.options.hideErrorOnChange)
        this.options.prompt($(event.currentTarget),false);
    },

    //user triggered validate field event
    onValidate: function(event) {
      var domElem = $(event.currentTarget);
      var field = domElem.data('asyncValidator') || this.updateField(domElem);
      field.log("validate");
      field.validate($.noop);
    },

    /* ===================================== *
     * Validate Form
     * ===================================== */

    validate: function(callback) {
      this.updateFields();
      //finish old executions
      // if(this.execution && this.execution.status === 1)
      //   this.execution.cancel();

      (new FormExecution(this)).execute().always(function(exec) {
        if(callback) callback(exec.result, exec.success);
      });
      return undefined;
    },

    //listening for 'validate' event
    scrollFocus: function() {

      var lastExec = this.execution;

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