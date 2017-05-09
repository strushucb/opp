
 // Code left intentionally unminimized for your reading pleasure.
/*
* Heavily derived from Vadim Ogievetsky's KoalasToTheMax
* Powered by Mike Bostock's D3
*
* For me on GitHub:  https://github.com/vogievetsky/KoalasToTheMax
* License: MIT  [ http://koalastothemax.com/LICENSE ]
*
*/
//I modified Vadim's code in order for new faces to be loaded
//by clicking on the personas.
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

        //the basicLoad if not given a specific number, meaning someone click on a face,
        //will load one of the 4 personas at random.
          function basicLoad(location) {
            var possible; 
            if(num == 0){
                //possible = "profileimage.jpg";
                possible = "persona"+(Math.ceil(Math.random() * 4))+".jpg";
            }else
                possible = "persona"+num+".jpg";
            var file = 'img/team/' + possible;
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
          //loads a new face if someone clicks on a different persona button
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
            //console.log("Loooad!!!!");
            if (colorData) {
              face.makeCircles("#dots", colorData, null);
              //console.log("Loooad!2222!!!");
              face.loadProfileData(num);
              //console.log("Loooad!3333!!!");
              //track('GoodLoad', 'Yay');
            }
          };
          img.src = file;
      };
    newImage(0); //by default, on load, just specify 0 for no persona survey.