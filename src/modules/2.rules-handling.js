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

