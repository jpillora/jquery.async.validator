
var ParamParser = (function() {

  var parse = function(str) {
    var chars = str.split(""), name = "", gotName = false, 
        param = "", gotParams = false, depth = 0, method = {};

    for(var i in chars) {
      var c = chars[i];
      //parse name 'name(...)'
      if(!gotName) {
        if(c == '(') {
          gotName = true;
          method[name] = [];
          continue;
        } else if(c != ' ')
          name += c;
      }
      //got name, recursive parse params '...(params)'
      if(gotName && !gotParams) {
        if(c == '(') {
          param += c;
          depth++;
        } else if(c == ')' && depth > 0) {
          param += c;
          if(param) method[name].push(parse(param));
          param = "";
          depth--;
        } else if(c == ')' && depth == 0)  {
          if(param) method[name].push(param);
          gotParams = true;
        } else if(c == ',' && depth == 0) {
          if(param) method[name].push(param);
          param = "";
        } else
          param += c;
      }
    }
    return method;
  }

  return {
    parse: parse
  };

}());

