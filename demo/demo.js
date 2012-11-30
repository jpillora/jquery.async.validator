require.config({
  shim: {
    '../dist/jquery.async.validator':     ['jquery']
  }
});

define([,
  'util/log',
  'jquery',
  '../dist/jquery.async.validator',
  'css!../demo/demo',
  'underscore',
  'lib/prettify',
  'lib/bootstrap.min'],
  function(log) {

    var demos = [
      'basic',
      // 'regular-expressions',
      // 'groups',
      // 'extending',
      // 'user-defined'
    ];

    //
    function titlise(str, sep, join) {
      var p, part, parts, _i, _len;
      if (sep == null) 
        sep = ' ';
      if (join == null) 
        join = ' ';
      parts = str.split(sep);
      for (p = _i = 0, _len = parts.length; _i < _len; p = ++_i) {
        part = parts[p];
        parts[p] = part.charAt(0).toUpperCase() + part.substr(1).toLowerCase();
      }
      return parts.join(join);
    }

    //
    window.initScripts = {};

    var demoTemplate = _.template($("#demoTemplate").html());
    _.each(demos, buildDemo);

    function buildDemo(name) {
      var demoContainer = $(demoTemplate({
        name: name,
        title: titlise(name)
      }));
      $("#demos").append(demoContainer);
    }

    function setupDemo() {
      var container = $(this);
      if(container.hasClass('ready')) return;

      var name = container.data('name');

      $.get('demo/demos/'+name+'.html', 
        function(data) {
          var demo = $(data),
              script = demo.siblings('script[data-demo]'),
              html = demo.siblings('div[data-demo]');

          setCode(script.html(), container.find('pre.script'));
          setCode(html.html(), container.find('pre.html'));

          container.find('.demo-container').html(demo);

          window.initScripts[name](html);

          container.togglers();
          container.slideDown('slow').addClass('ready');
        }
      );
    }

    function setCode(content, pre) {

      if(!content) return;
      content = content.replace('demoContainer.find','$');

      var lines = content.split('\n'), indentation;

      content = "";
      for (var i = 0, l = lines.length; i < l; ++i) {
        var line = lines[i];
        if(i == 0 || i == l-1) continue;

        if(indentation === undefined) {
          var m = line.match(/^(\ *)/);
          if(m) indentation = m[1];
        }
        line = line.replace(new RegExp("^" + indentation), "");
        content += line + "\n";
      }
      pre.append(prettyPrintOne(encode(content)));
    }

    $(document).ready(function() {

      //open user demo on load
      var hash = window.location.hash.substr(1);
      if(hash) 
      $('#'+hash).on('hidden', function() { 
        $(this).collapse("show").off('hidden');
      });

      $('.collapse').collapse('hide').on('show', setupDemo);

      $('.loading-cover').fadeOut('fast');

      //intercept all form submissions
      $("#demos").on("submit","form", function() {
        console.log("All validations passed on form: " + $(this).attr('id') + " !");
        return false;
      });
      
    });

    //helpers
    function encode(value) {
      return $('<div/>').text(value).html();
    }

    $.fn.togglers = function() {

      var container = $(this);
      var togglers = container.find('[data-toggle]');
      togglers.each(function() {
        var btn = $(this),
            selector = btn.attr('data-toggle'),
            elem = container.find(selector);

        if(elem.length == 0) return;

        btn.click(function() {
          var visible = elem.is(':visible');
          
          var text = btn.html();
          btn.html(text.replace(/hide|show/i, visible ? 'Show' : 'Hide'))

          if(visible)
            elem.slideUp();
          else
            elem.slideDown();
        });

      });
    }


  }
);


