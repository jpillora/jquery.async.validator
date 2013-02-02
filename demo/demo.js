define([
  'util/log',
  'underscore',
  'lib/prettify',
  'lib/bootstrap.min'],
  function(log) {
    window.$ = $;
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
    function slugify(title) { return title.replace(/\s/g, '-').toLowerCase(); }

    function setupNav() {

      var header = _.template('<li class="nav-header"><%= title %></li>'),
          anchor = _.template('<li><a href="#<%= slug %>"><%= title %></a></li>'),
          navList = $("#nav-list");

      $("[data-nav-heading]").each(setupNavHeading);

      function setupNavHeading(){
        navList.append(header({title: $(this).data('nav-heading') }));
        $(this).find("[data-nav-anchor]").each(setupNavAnchor);
      }

      function setupNavAnchor() {
        var title = $(this).data("nav-anchor"),
            slug = slugify(title),
            first = $(this).children(":first");

        if(!first.is('h4'))
          $(this).prepend($("<h4/>").html(title));

        $(this).attr('id', slug);
        navList.append(anchor( {title: title, slug: slug}));
      }

    }

    function setupLinks() {
      $("a[href^=#]").each(function() {
        var sel = $(this).attr('href');
        if($(sel).length === 0) console.log(this);
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

    // dom listeners
    function handleHashClick(e) {
      e.preventDefault();
      var id = $(this).attr('href');
      var elem = $(id).scrollView(function() {
        window.location.hash = id;
      });

      if(elem.length === 0) alert("Sorry those docs are still in progress !");

      return false;
    }

    //intercept all form submissions
    var successElem = $('<div class="alert alert-success"><strong>'+
      'Validation successful ! </strong> If this was a real form, it would be submitting right now...'+
      '</div>');

    function handleDemoFormSubmit() {
      $(this).append(successElem.show().stop().delay(2000).fadeOut());
      return false;
    }

    $(document).ready(function() {

      setupNav();
      setupLinks();
      setupCodeSnippets();

      $('.loading-cover').fadeOut('fast');

      window.prettyPrint();


      $(document)
        .on("submit","form", handleDemoFormSubmit)
        .on("click", "a[href^=#]", handleHashClick);
    
    });

  }
);


