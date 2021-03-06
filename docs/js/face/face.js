/*
* Heavily derived from Vadim Ogievetsky's KoalasToTheMax
* Powered by Mike Bostock's D3
*
* For me on GitHub:  https://github.com/vogievetsky/KoalasToTheMax
* License: MIT  [ http://koalastothemax.com/LICENSE ]
*
*/

//create an initial object
var face = {
    version: '2.1.3'
};  

//create an async queue for animations - necessary to maintain smooth UI
//see: http://stackoverflow.com/questions/6921275/is-it-possible-to-chain-settimeout-functions-in-javascript
$.queue = {
    _timer: null,
    _queue: [],
    add: function(fn, context, time) {
        var setTimer = function(time) {
            $.queue._timer = setTimeout(function() {
                time = $.queue.add();
                if ($.queue._queue.length) {
                    setTimer(time);
                }
            }, time || 2);
        }

        if (fn) {
            $.queue._queue.push([fn, context, time]);
            if ($.queue._queue.length == 1) {
                setTimer(time);
            }
            return;
        }

        var next = $.queue._queue.shift();
        if (!next) {
            return 0;
        }
        next[0].call(next[1] || window);
        return next[2];
    },
    clear: function() {
        clearTimeout($.queue._timer);
        $.queue._queue = [];
    }
};

//start loading json data
var scores;
d3.json("survey.json", function(data) {
    scores = data.scores;
});


//run persona creates a new face (for a specific persona)
function run_persona() {

  //from original koalas_to_the_max
  face = {
    version: '1.8.2'
  };  
  
  //from original koalas_to_the_max
//creates a new 2d array of given size
    function array2d(w, h) {
    var a = [];
    return function(x, y, v) {
      if (x < 0 || y < 0) return void 0;
      if (arguments.length === 3) {
        // set
        return a[w * x + y] = v;
      } else if (arguments.length === 2) {
        // get
        return a[w * x + y];
      } else {
        throw new TypeError("Bad number of arguments");
      }
    }
  }

   //from original koalas_to_the_max
  // Find the color average of 4 colors in the RGB colorspace
  function avgColor(x, y, z, w) {
    return [
      (x[0] + y[0] + z[0] + w[0]) / 4,
      (x[1] + y[1] + z[1] + w[1]) / 4,
      (x[2] + y[2] + z[2] + w[2]) / 4
    ];
  }

  //from original koalas_to_the_max
  face.supportsCanvas = function() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  };

  //from original koalas_to_the_max
  face.supportsSVG = function() {
    return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
  };

  //from original koalas_to_the_max
  function Circle(vis, xi, yi, size, color, children, layer) {
    this.vis = vis;
    this.x = size * (xi + 0.5);
    this.y = size * (yi + 0.5);
    this.size = size;
    this.color = color;
    this.rgb = d3.rgb(color[0],color[1],color[2]);
    //this.rgb = d3.rgb((color[0]+color[1]+color[2])/3, (color[0]+color[1]+color[2])/3, (color[0]+color[1]+color[2])/3);
    this.children = children;
    this.layer = layer;
  }

  //from original koalas_to_the_max
  Circle.prototype.checkIntersection = function(startPoint, endPoint) {
    var edx = this.x - endPoint[0],
        edy = this.y - endPoint[1],
        sdx = this.x - startPoint[0],
        sdy = this.y - startPoint[1],
        r2  = this.size / 2;

    r2 = r2 * r2; // Radius squared

    // End point is inside the circle and start point is outside
    return edx * edx + edy * edy <= r2 && sdx * sdx + sdy * sdy > r2;
  }

  //from original koalas_to_the_max
  //changed to create growing animation
  Circle.addToVis = function(vis, circles, cat, num) {
    var circle = vis.selectAll('.nope').data(circles)
      .enter().append('circle');

    circle
      .attr('cx',   function(d) { return d.x; })
      .attr('cy',   function(d) { return d.y; })
      .attr('r',    function(d) { return 0; })
      .attr('fill', function(d) { return String(d.rgb); })
      .attr('fill-opacity', 1)
      .attr('class', cat);
      
    // Transition the to the respective final state
    circle
      .attr('cx',   function(d) { return d.x; })
      .attr('cy',   function(d) { return d.y; })
      .transition().duration(1*num)
      .attr('r',    function(d) { return d.size / 2; })
      .attr('fill', function(d) { return String(d.rgb); })

      .attr('fill-opacity', 1)
      .attr('class', cat);
      //.each('end',  function(d) { d.node = this; });
  }

  // Main code
  var vis,
      maxSize = 512,
      minSize = 8,
      dim = maxSize / minSize;
  var level_list = [];

  var what_scores = {"what-you-say": 1,"what-you-do": 1, "who-you-know": 1, "where-you-go": 1};

    //from original koalas_to_the_max
    //loads the image
  face.loadImage = function(imageData) {
    // Create a canvas for image data resizing and extraction
    var canvas = document.createElement('canvas').getContext('2d');
    // Draw the image into the corner, resizing it to dim x dim
    canvas.drawImage(imageData, 0, 0, dim, dim);
    // Extract the pixel data from the same area of canvas
    // Note: This call will throw a security exception if imageData
    // was loaded from a different domain than the script.
    return canvas.getImageData(0, 0, dim, dim).data;
  };
    

  //base on original koalas_to_the_max
  //changed so that levels are kept track off (level_list)
  //also changed the colors by quadrants(there are four main colors)
  face.makeCircles = function(selector, colorData, onEvent) {
    onEvent = onEvent || function() {};

    var splitableByLayer = [],
        splitableTotal = 0,
        nextPercent = 0;

    // Make sure that the SVG exists and is empty
    if (!vis) {
      // Create the SVG ellement
      vis = d3.select(selector)
        .append("svg")
          .attr("width", maxSize)
          .attr("height", maxSize);
    } else {
      vis.selectAll('circle')
        .remove();
    }

    // Got the data now build the tree
    var finestLayer = array2d(dim, dim);
    var size = minSize;

    // Start off by populating the base (leaf) layer
    var xi, yi, t = 0, color;
    for (yi = 0; yi < dim; yi++) {
      for (xi = 0; xi < dim; xi++) {
          //if the color is close to white, just make it white
        if(colorData[t] >= 240 && colorData[t+1] >= 240 && colorData[t+2] >= 240){
            color = [255,255,255];
        } else {
            //changes the color - provides a tinit
            if(xi >= (dim / 2) && yi >= (dim / 2)){
                //pink "color2" : "rgba(211, 84, 154, 0.75)"
                color = [Math.min(colorData[t]+(211-colorData[t])*.40,255), Math.min(colorData[t+1]+(84-colorData[t])*.40,255), Math.min(colorData[t+2]+(154-colorData[t])*.40,255)];
            }else if(xi >= (dim / 2) && yi < (dim / 2)){
                //green rgba(42, 173, 147, 0.75)
                color = [Math.min(colorData[t]+(42-colorData[t])*.40,255), Math.min(colorData[t+1]+(173-colorData[t])*.40,255), Math.min(colorData[t+2]+(147-colorData[t])*.40,255)];
            }else if(xi < (dim / 2) && yi >= (dim / 2)){
                //blue: blue rgba(42, 59, 142, 0.75)
                color = [Math.min(colorData[t]+(42-colorData[t])*.40,255), Math.min(colorData[t+1]+(59-colorData[t])*.40,255), Math.min(colorData[t+2]+(142-colorData[t])*.40,255)];
            } else{
                //yellow rgba(250, 175, 76, 0.75)
                color = [Math.min(colorData[t]+(250-colorData[t])*.40,255), Math.min(colorData[t+1]+(175-colorData[t])*.40,255), Math.min(colorData[t+2]+(76-colorData[t])*.40,255)];
            }
            if(color[0] >= 230 && color[1] >= 230 && color[2] >= 230)
                color = [255,255,255];
        }
        finestLayer(xi, yi, new Circle(vis, xi, yi, size, color));
        t += 4;
      }
    }

    // Build up successive nodes by grouping
    level_list.splice(0, 0, finestLayer);
    var layer, prevLayer = finestLayer;
    var c1, c2, c3, c4, currentLayer = 0;
    while (size < maxSize) {
      dim /= 2;
      size = size * 2;
      layer = array2d(dim, dim);
      for (yi = 0; yi < dim; yi++) {
        for (xi = 0; xi < dim; xi++) {
          c1 = prevLayer(2 * xi    , 2 * yi    );
          c2 = prevLayer(2 * xi + 1, 2 * yi    );
          c3 = prevLayer(2 * xi    , 2 * yi + 1);
          c4 = prevLayer(2 * xi + 1, 2 * yi + 1);
          color = avgColor(c1.color, c2.color, c3.color, c4.color);
          c1.parent = c2.parent = c3.parent = c4.parent = layer(xi, yi,
            new Circle(vis, xi, yi, size, color, [c1, c2, c3, c4], currentLayer)
          );
        }
      }
      splitableByLayer.push(dim * dim);
      splitableTotal += dim * dim;
      level_list.unshift(layer);
      currentLayer++;
      prevLayer = layer;
    }
    
    var delay = 5;
    // Create the initial circles (start with a group of 4)
    Circle.addToVis(vis, [level_list[1](0,0)], "wyk",delay);
    Circle.addToVis(vis, [level_list[1](1,0)], "wys",delay);
    Circle.addToVis(vis, [level_list[1](0,1)], "wyg",delay);
    Circle.addToVis(vis, [level_list[1](1,1)], "wyd",delay);
      
 
    //keep track of what technologies have been answered
    var answered_tech = {
                    "social-connections": false,
                    "income": false,
                    "car": false,
                    "cell": false,
                    "transit": false,
                    "events": false,
                    "smuse": false};
    var variables_set = 0;
      
    //listener for Social Media connection slider
    d3.select("#SMULevel").on("input", function() {
        if(!answered_tech["social-connections"]){
            answered_tech["social-connections"] = true;
            variables_set++;
            d3.select("#smcerror")
                .style("display","block");
        }
        $.queue.clear();
        $.queue.add(function(){face.updateData()},this,50);
    });
      
    //listener for Income level slider
    d3.select("#IncLevel").on("input", function() {
        if(!answered_tech["income"]){
            answered_tech["income"] = true;
            variables_set++;
            d3.select("#incomeerror")
                .style("display","block");
        }
        $.queue.clear();
        $.queue.add(function(){face.updateData()},this,50);
    });
      
    //will be called by all the other buttons
    face.updateDataWrap = function updateDataWrap(key){
        if(!answered_tech[key]){
            answered_tech[key] = true;
            variables_set++;
            d3.select("#"+key+"error")
                .style("display","block");
        }
        
        //console.log("Updating " + key);
        $.queue.clear();
        $.queue.add(function(){face.updateData()},this,50);
    }
    
    //load the base scores (before any privacy score tallying is done)
    var base_scores;
    if("undefined" === typeof scores){
        d3.json("survey.json", function(data) {
            scores = data.scores;
            base_scores = (JSON.parse(JSON.stringify(scores.tech)));
        });
    } else {
            base_scores = (JSON.parse(JSON.stringify(scores.tech)));
    }
      
    //if you are loading a profile, answer the behavior scores according to the profile number
    face.loadProfileData = function loadProfileData(num){
       if(num > 0){
           variables_set = 7;
           var answers = scores["sample"+num];
           d3.select("#SMULevel").property("value", answers["social-connections"]);
           d3.select("#IncLevel").property("value", answers["income"]);
           d3.select("#CarUse").property("value", answers["car"]);
           d3.select("#CellUse").property("value", answers["cell"]);
           d3.select("#TransitUse").property("value", answers["public-transit"]);
           d3.select("#EventUse").property("value", answers["public-events"]);
           d3.select("#SMUse").property("value", answers["social-media"]);

           answered_tech = 
               {"social-connections": true,
                "income": true,
                "car": true,
                "cell": true,
                "transit": true,
                "events": true,
                "smuse": true};
           
          //loads the quote of the persona
           document.getElementById("bio").innerHTML = "<p style='height: 400px;  background-image: url(img/quote.png); background-repeat:no-repeat; background-size: 100%; padding-left: 10px; padding-right: 40px; padding-top: 20px; padding-bottom: 5px; font-size:smaller'>"+answers["quote"]+"</p>";
           face.updateData();
       }else{
           variables_set = 0;
       }
    }; 
    
    //calculates the new scoring based on the technology and the answer to the survey
    function addToTotal(result){
       //console.log(result);
       for(var item in result){
            base_scores[item]["what-you-say"] = base_scores[item]["what-you-say"] * (result[item]); 
            base_scores[item]["what-you-do"] = base_scores[item]["what-you-do"] * (result[item]);
            base_scores[item]["who-you-know"] = base_scores[item]["who-you-know"] * (result[item]);
            base_scores[item]["where-you-go"] = base_scores[item]["where-you-go"] * (result[item]); 
       }
    }
    
    //updateData - checks the survey results for any changes, updates the scoring, and redraws the circles
    face.updateData = function updateData(){
       base_scores = (JSON.parse(JSON.stringify(scores.tech)));
       var smuResult, incResult, carResult, cellResult, transitResult, eventsResult, smuseResult;
       var i = 1; 
       if(answered_tech["social-connections"]){ 
           for (item in scores.survey["social-connections"]){
               if (i == d3.select("#SMULevel").property("value"))
                   smuResult = scores.survey["social-connections"][item];
               i++;
           }
           addToTotal(smuResult);
       }
       if(answered_tech["income"]){ 
           i = 1; 
           for (item in scores.survey["income"]){
               if (i == d3.select("#IncLevel").property("value"))
                   incResult = scores.survey["income"][item];
               i++;
           }
           addToTotal(incResult);
       }
       if(answered_tech["car"]){ 
           carResult = scores.survey["car"][d3.select("#CarUse").property("value")];
           //console.log("Car Result: "+carResult);
           addToTotal(carResult);
       }
       if(answered_tech["cell"]){ 
           cellResult = scores.survey["cell"][d3.select("#CellUse").property("value")];
           addToTotal(cellResult);
       }
       if(answered_tech["transit"]){ 
           transitResult = scores.survey["transit"][d3.select("#TransitUse").property("value")];
           addToTotal(transitResult);
       }
       if(answered_tech["events"]){ 
           eventsResult = scores.survey["events"][d3.select("#EventUse").property("value")];
           addToTotal(eventsResult);
       }
       if(answered_tech["smuse"]){ 
           smuseResult = scores.survey["smuse"][d3.select("#SMUse").property("value")];
           addToTotal(smuseResult);
       }

       what_scores["what-you-say"] = 1;
       what_scores["what-you-do"] = 1;
       what_scores["who-you-know"] = 1;
       what_scores["where-you-go"] = 1;
   
        //recalculate the scoring
        for(var item in base_scores){
            if(variables_set < 7){
                //console.log("GRRRR!!!!");
                if(scores.tech[item]["what-you-say"] > 0 && scores.tech[item]["what-you-say"] != base_scores[item]["what-you-say"]){
                    what_scores["what-you-say"] = Math.min(1365, what_scores["what-you-say"] + Math.pow(base_scores[item]["what-you-say"],1));
                }
                if(scores.tech[item]["what-you-do"] > 0 && scores.tech[item]["what-you-do"] != base_scores[item]["what-you-do"]){
                    what_scores["what-you-do"] = Math.min(1365, what_scores["what-you-do"] + Math.pow(base_scores[item]["what-you-do"],1));
                }
                if(scores.tech[item]["who-you-know"] > 0 && scores.tech[item]["who-you-know"] != base_scores[item]["who-you-know"]){
                    what_scores["who-you-know"] =  Math.min(1365, what_scores["who-you-know"] + Math.pow(base_scores[item]["who-you-know"],1));
                }
                if(scores.tech[item]["where-you-go"] > 0 && scores.tech[item]["where-you-go"] != base_scores[item]["where-you-go"]){    
                    what_scores["where-you-go"] = Math.min(1365, what_scores["where-you-go"] + Math.pow(base_scores[item]["where-you-go"],1));
                }
            }else{
                what_scores["what-you-say"] = Math.min(1365, what_scores["what-you-say"] + Math.pow(base_scores[item]["what-you-say"],1));
                what_scores["what-you-do"] = Math.min(1365, what_scores["what-you-do"] + Math.pow(base_scores[item]["what-you-do"],1));
                what_scores["who-you-know"] =  Math.min(1365, what_scores["who-you-know"] + Math.pow(base_scores[item]["who-you-know"],1));
                what_scores["where-you-go"] = Math.min(1365, what_scores["where-you-go"] + Math.pow(base_scores[item]["where-you-go"],1));
            }
        }
        //console.log(base_scores);
        //console.log("GRRRR!!!!")
        
        //redraw the circles with async threading
        $.queue.add(function(){update(what_scores["who-you-know"],"wyk",0,0)},this);
        $.queue.add(function(){update(what_scores["what-you-say"],"wys",1,1)},this);
        $.queue.add(function(){update(what_scores["where-you-go"],"wyg",0,1)},this);
        $.queue.add(function(){update(what_scores["what-you-do"],"wyd",1,0)},this);

        //console.log("Jerkk!!!!")
    };
        
    //updates the circles
    function update(nLevel,cat,x,y) {
  	 //console.log(cat+": "+nLevel);
         vis.selectAll('.'+cat).remove();
         stackCircles(nLevel,x,y,cat);
        // update the circle radius
  	 //svg.selectAll("circle").attr("r", nLevel);
    }
      
    //base log 4 to calculate number of children to draw
    function log4(n){
        //console.log("log4: "+(Math.log(n) / Math.log(4)));
        return Math.log(n) / Math.log(4);
    }
      
    //redraws each of the circles
    //calculates the number of children that need to be drawn
    function stackCircles(nLevel, x, y,cat) {
        var level = Math.ceil(log4(3) + log4(nLevel) - 1);
        var num_parents = (Math.pow(4,level-1)-1)/3; //how many nodes above me
        var children = Math.ceil(((nLevel) - num_parents) / 4) * 4; //how many children I need to draw
        var delay_max = Math.ceil(50000 / ((level*level)+1));
        var counter = 0;
        //console.log("DelyMax:"+delay_max);
        if (nLevel <= 1) {
            Circle.addToVis(vis,[level_list[1](x,y)],cat);
            re_label();
            return;
        }
        
        //if on the left side of face, draw starting on the right
        if (x <= 0) { 
            for (var i = x*Math.pow(2,level) ; i < (x+1)*(Math.pow(2,level)); i+=2) {
                for (var j = y*Math.pow(2,level); j < (y+1)*(Math.pow(2,level)); j+=2) {
                    if(children > 0){
                        Circle.addToVis(vis,[level_list[level+1](i,j)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i+1,j)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i,j+1)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i+1,j+1)], cat, Math.round(Math.random()*delay_max) + 1);
                        children = children - 4;
                    } else {
                        Circle.addToVis(vis,[level_list[level+1](i,j).parent],cat, Math.round(Math.random()*delay_max) + 1);
                    }
                }
            }
                    
        //if on the right side of face, draw starting on the left
        } else {
            for (var i = (x+1)*Math.pow(2,level)-1 ; i >= (x)*(Math.pow(2,level)); i-=2) {
                for (var j = (y+1)*Math.pow(2,level)-1; j >= (y)*(Math.pow(2,level)); j-=2) {
                    if(children > 0){
                        Circle.addToVis(vis,[level_list[level+1](i,j)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i-1,j)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i,j-1)], cat, Math.round(Math.random()*delay_max) + 1);
                        Circle.addToVis(vis,[level_list[level+1](i-1,j-1)], cat, Math.round(Math.random()*delay_max) + 1);
                        children = children - 4;
                    } else {
                        Circle.addToVis(vis,[level_list[level+1](i,j).parent],cat, Math.round(Math.random()*delay_max) + 1);
                    }
                }
            }            
        }
        re_label();
      }
    
    
    //adds label panels to the score quadrants
    function generate_titles(x,y, text, fill, class_id, isNormal){
        if(isNormal){
            vis.append("text")
            .style("fill", fill)
            .style("font-weight",900)
            .attr("class", class_id)
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ".35em")
            .text(function(d) { return text; });
        }else{
            vis.append("text")
            .style("stroke", fill)
            .style("stroke-width", "2.5px")
            //.style("opacity", 0.9)
            .style("font-weight",900)
            .attr("class", class_id)
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ".35em")
            .text(function(d) { return text; });
        }
    }
      
    function re_label(){
        d3.selectAll(".normal-text").each(function(){
            this.parentNode.appendChild(this);
        });
    }
   
    //writes the blurb in each panel over the face quadrants
    function write_report_blurb(x, y, text){
        var titlekey,blurb,split_blurb;
        titlekey = text.replace(/\s+/g, '-').toLowerCase();
        blurb = scores.information_categories[titlekey].blurb;
        split_blurb = blurb.split(" ");
        var result = "";
        var char_count = 0;
        line = 0;

        for(var i = 0; i < split_blurb.length; i++){
            if(char_count > 25){
                vis.append("text")
                .attr("class","stain-text")
                .attr("x", x)
                .attr("y", y+ (20*(line+1)))
                .style("fill", "white")
                .style("font-size","smaller")
                .text(function(d){return result;});
                result = "";
                char_count = 0;
                line++;
            }
            result = result + " "+split_blurb[i];
            char_count = char_count + split_blurb[i].length;
            //console.log(result);
        }
        if(char_count > 0){
             vis.append("text")
                    .attr("class","stain-text")
                    .attr("x", x)
                    .attr("y", y+ (20*(line+1)))
                    .style("fill", "white")
                    .style("font-size","smaller")
                    .text(function(d){return result;});
        }
    }
      
    //creates back panels with reports over each quadrant of face
    function generate_reports(x,y,text,tx,ty){
        vis.append("svg:rect")
        .style("fill", "black")
        .attr("opacity", 0.7)
        .attr("class", "stain")
        .attr("transform", function(d) { 
          return "translate(" + x + "," + y + ")"; })
        .attr("height", maxSize / 2)
        .attr("width", maxSize / 2);

        generate_titles(tx,ty,text,"white", "stain-text", true);
        write_report_blurb(x+20,y+60,text);
    }  
      
    //when you move your mouse over a quadrant, draws a black panel
      // based on koala_to_the_max code
    function onMouseMove() {
      var mousePosition = d3.mouse(vis.node());
      if (isNaN(mousePosition[0])) {
        return;
      }else {
        if(mousePosition[0] < maxSize / 2 && mousePosition[1] < maxSize / 2){
            //console.log("Who You Know! "+mousePosition);
            d3.selectAll(".stain").remove();
            d3.selectAll(".stain-text").remove();
            generate_reports(0,0,"WHO YOU KNOW",14,14);
 
        }
        else if(mousePosition[0] >= maxSize / 2 && mousePosition[1] < maxSize / 2){
            //console.log("What You Do! "+mousePosition);
            d3.selectAll(".stain").remove();
            d3.selectAll(".stain-text").remove();
            generate_reports((maxSize / 2),0,"WHAT YOU DO", maxSize - 151, 14);
        }
        else if(mousePosition[0] < maxSize / 2 && mousePosition[1] >= maxSize / 2){
            //console.log("Where You Go! "+mousePosition);
            d3.selectAll(".stain").remove();
            d3.selectAll(".stain-text").remove();
            generate_reports(0,(maxSize / 2),"WHERE YOU GO",14, maxSize - 16);
        }
        else if(mousePosition[0] >= maxSize / 2 && mousePosition[1] >= maxSize / 2){
            //console.log("What You Say! "+mousePosition);
            d3.selectAll(".stain").remove();
            d3.selectAll(".stain-text").remove();
            generate_reports((maxSize / 2),(maxSize / 2),"WHAT YOU SAY",maxSize - 151,maxSize - 16);

        }
      }
      //d3.event.preventDefault();
    }
      
    //removes panels if mouse is not over face
    function onMouseLeave() {
      var mousePosition = d3.mouse(vis.node());
      // Do nothing if the mouse point is not valid
      if (isNaN(mousePosition[0])) {
        return;
      } 
      if(mousePosition[0] < 0 || mousePosition[1] < 0 || mousePosition[0] > maxSize || mousePosition[1] > maxSize){
        //console.log(mousePosition);
        d3.selectAll(".stain").remove();
        d3.selectAll(".stain-text").remove();
        re_label();
        return;
      }  
    }
     

      
    /*generate_titles(15,15,"WHO YOU KNOW","white", "normal-text");
    generate_titles(maxSize - 150,15,"WHAT YOU DO","white", "normal-text");
    generate_titles(15,maxSize - 15,"WHERE YOU GO","white", "normal-text");
    generate_titles(maxSize - 150,maxSize - 15,"WHAT YOU SAY","white", "normal-text"); 
 */

 
    generate_titles(15,15,"WHO YOU KNOW","black", "normal-text", false);
    generate_titles(maxSize - 150,15,"WHAT YOU DO","black", "normal-text", false);
    generate_titles(15,maxSize - 15,"WHERE YOU GO","black", "normal-text", false);
    generate_titles(maxSize - 150,maxSize - 15,"WHAT YOU SAY","black", "normal-text", false); 
      
    generate_titles(15,15,"WHO YOU KNOW","rgba(255, 190, 104, 1)", "normal-text", true);
    generate_titles(maxSize - 150,15,"WHAT YOU DO","#44bea5", "normal-text", true);
    generate_titles(15,maxSize - 15,"WHERE YOU GO","#7789e5", "normal-text", true);
    generate_titles(maxSize - 150,maxSize - 15,"WHAT YOU SAY","#d16fa5", "normal-text", true);

  
    d3.select("#dots")
      .on('mousemove.face', onMouseMove);
    d3.select(document.body).on('mouseout.face', onMouseLeave);

  };
    
  return face;

}

