
/* ===================================== *
 * Plugin Public Interface
 * ===================================== */

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
  addRules: addFieldRules,
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
    return $(this).find("[" + globalOptions.validateAttribute + "]").length > 0;
  }).asyncValidator();
});

log("plugin added.");

