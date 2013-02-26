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
 * Current Rules (Plugin Wide)
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


