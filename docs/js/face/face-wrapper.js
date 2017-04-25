
 // Code left intentionally unminimized for your reading pleasure.

    function newImage(num) {
        var element = document.getElementById("dots");
        while (element != null && element.firstChild) {
            element.removeChild(element.firstChild);
        }
        window.shownFile = 'none';
        var face = run_persona(true);

        // If an error happens I want to know about it!
        window.onerror = function(msg, url, ln) {
          msg = msg.toString();
          // In Chrome and Firefox an error on a script form a foreign domain will cause this, see link bellow:
          // http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
          if (msg === 'Script error.' && url === '' && ln === 0) return;
          // Track only one error per page load
          window.onerror = function() {};
        };

        // First, make sure we can run.
        if (!face.supportsCanvas()) {
          alert("Sorry, FaceToTheMax needs HTML5 Canvas support which your browser does not have. Supported browsers include Chrome, Safari, Firefox, Opera, and Internet Explorer 9, 10");
          return;
        }

        if (!face.supportsSVG()) {
          alert("Sorry, FaceToTheMax needs SVG support which your browser does not have. Supported browsers include Chrome, Safari, Firefox, Opera, and Internet Explorer 9, 10");
          return;
        }

        // This is strange, track it if it happens.
        if (!window.d3) {
          alert("Some how D3 was not loaded so the site can not start. This is bad... We are investigating. Try refreshing the page and see if that helps.");
          return;
        }

          function basicLoad(location) {
            var possible = ['persona'+num];
            var file = 'img/' + possible[Math.floor(Math.random() * possible.length)] + '.jpg'
            return {
              file: file,
              shownFile: location.protocol + '//' + location.host + location.pathname + file
            };
          }

          function parseUrl(location) {
            // Fall though
            return basicLoad(location);
          }

          var parse = parseUrl(location);
          if (!parse) return;
          var file = parse.file;
          window.shownFile = parse.shownFile;

          if (parse.background) {
            d3.select(document.body)
              .style('background', parse.background);
          }
          if (parse.hideNote) {
            d3.select('#footer')
              .style('display', 'none');
          }

          var img = new Image();
          
          img.onload = function() {
            var colorData;
            try {
              colorData = face.loadImage(this);
            } catch (e) {
              colorData = null;
              alert("Sorry, FaceToTheMax could not load the image '" + file + "'");
              setTimeout(function() {
                window.location.href = domain;
              }, 750);
            }
            console.log("Loooad!!!!");
            if (colorData) {
              face.makeCircles("#dots", colorData, null);
              console.log("Loooad!2222!!!");
              face.loadProfileData(1)
              console.log("Loooad!3333!!!");
              //track('GoodLoad', 'Yay');
            }
          };
          img.src = file;
      };
    newImage(1);