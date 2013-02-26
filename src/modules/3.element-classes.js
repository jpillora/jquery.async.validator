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