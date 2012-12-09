require.config({
  shim: {
    '../dist/jquery.async.validator':             ['jquery'],
    '../../jquery.prompt/dist/jquery.prompt':     ['jquery']
  }
});

define([
  'util/log',
  'jquery',
  '../dist/jquery.async.validator',
  '../../jquery.prompt/dist/jquery.prompt',
  'css!../../jquery.prompt/dist/jquery.prompt',
  'underscore',
  'lib/prettify',
  'lib/bootstrap.min'],
  function(log) {

    function setCode(container, pre) {

      if(container.length === 0 || pre.length === 0) return;
      var content = container.html();
      var lines = content.split('\n'), indentation;

      content = "";
      for (var i = 0, l = lines.length; i < l; ++i) {
        var line = lines[i];
        if(i === 0 || i === l-1) continue;

        if(indentation === undefined) {
          var m = line.match(/^(\ *)/);
          if(m) indentation = m[1];
        }
        line = line.replace(new RegExp("^" + indentation), "");
        content += line + "\n";
      }
      pre.append(prettyPrintOne(encode(content)));
    }


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

        if(elem.length === 0) return;

        btn.click(function() {
          var visible = elem.is(':visible');
          
          var text = btn.html();
          btn.html(text.replace(/hide|show/i, visible ? 'Show' : 'Hide'));

          if(visible)
            elem.slideUp();
          else
            elem.slideDown();
        });

      });
    };


    function create(type) { return $("<"+type+"/>"); }

    function setupNav() {

      var header = _.template('<li class="nav-header"><%= title %></li>'),
          anchor = _.template('<li><a href="#<%= title %>"><%= title %></a></li>'),
          navList = $("#nav-list");

      $("[data-nav-heading]").each(function() {

        navList.append(header({title: $(this).data('nav-heading') }));

        $(this).find("[data-nav-anchor]").each(function() {
          var title = $(this).data("nav-anchor");
          $(this).attr('id', title);
          navList.append(anchor( {title: title}));
        });
      });
    }

    function setupCodeSnippets() {
      $(".demo").each(function() {


        var demo = $(this),
            htmlDemo = demo.find("div[data-html]"),
            htmlPre = demo.find("pre[data-html]"),
            scriptDemo = demo.find("script[data-script]"),
            scriptPre = demo.find("pre[data-script]");

        setCode(htmlDemo, htmlPre);
        setCode(scriptDemo, scriptPre);

      });
    }

    $(document).ready(function() {

      setupNav();
      setupCodeSnippets();

      $('.loading-cover').fadeOut('fast');

      window.prettyPrint();

      //intercept all form submissions
      var successElem = $('<div class="alert alert-success"><strong>'+
        'Validation successful ! </strong> Submitting form...'+
        '</div>');

      $(document).on("submit","form", function() {
        $(this).append(successElem.show().stop().delay(2000).fadeOut());
        return false;
      });
      
    });

  }
);


