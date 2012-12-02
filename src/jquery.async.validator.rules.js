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
      message: "Use numbers and letters only"
    },
    street_number: {
      regex: /^\d+[A-Za-z]?(-\d+)?[A-Za-z]?$/,
      message: "Street Number only"
    },
    number: {
      regex: /^\d+$/,
      message: "Use numbers only"
    },
    numberSpace: {
      regex: /^[\d\ ]+$/,
      message: "Use numbers and spaces only"
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
          var str = r.params[0];
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
      var v = r.val();
      if(!v.match(/^[\d\s]+$/))
        return "Use numbers and spaces only";
      if(!v.match(/^0/))
        return "Number must start with 0";
      if(v.replace(/\s/g,"").length !== 10)
        return "Must be 10 numbers long";
      return true;
    },
    size: function(r){
      var v = r.val(), exactOrLower = r.params[0], upper = r.params[1];
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
      var v = r.val(), min = parseInt(r.params[0], 10);
      if(v.length < min)
        return "Must be at least " + min + " characters";
      return true;
    },
    max: function(r) {
      var v = r.val(), max = parseInt(r.params[0], 10);
      if(v.length > max)
        return "Must be at most " + max + " characters";
      return true;
    },

    decimal: function(r) {
      var vStr = r.val(),
          places = r.params[0] ? parseInt(r.params[0], 10) : 2;
    
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
          suffix = r.params[1] || '',
          min = parseFloat(r.params[0]);
      if(v < min)
        return "Must be greater than " + min + suffix;
      return true;
    },
    max_val: function(r) {
      var v = parseFloat(r.val().replace(/[^\d\.]/g,'')),
          suffix = r.params[1] || '',
          max = parseFloat(r.params[0]);
      if(v > max)
        return "Must be less than " + max + suffix;
      return true;
    },
    range_val: function(r) {
      var v = parseFloat(r.val().replace(/[^\d\.]/g,'')),
          prefix = r.params[2] || '',
          suffix = r.params[3] || '',
          min = parseFloat(r.params[0]),
          max = parseFloat(r.params[1]);
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
      var age = r.params[0];
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

    min_checks: {
      run: 'before',

      fn: function(r) {

        var checks = r.fields("input[type=checkbox]:checked");
        var checksRequired = parseInt(r.params[0],10);

        if(checks.length < checksRequired)
          return "You must choose at least " + (checksRequired === 1 ? 'one' : checksRequired);
        return true;
      }
    }

  });

})(jQuery);