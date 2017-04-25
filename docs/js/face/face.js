/*
* Heavily derived from Vadim Ogievetsky's KoalasToTheMax
* Powered by Mike Bostock's D3
*
* For me on GitHub:  https://github.com/vogievetsky/KoalasToTheMax
* License: MIT  [ http://koalastothemax.com/LICENSE ]
*
*/
  var face = {
    version: '2.1.3'
  };  
  
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
 
function run_persona() {

  face = {
    version: '1.8.2'
  };  
  
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

  // Find the color average of 4 colors in the RGB colorspace
  function avgColor(x, y, z, w) {
    return [
      (x[0] + y[0] + z[0] + w[0]) / 4,
      (x[1] + y[1] + z[1] + w[1]) / 4,
      (x[2] + y[2] + z[2] + w[2]) / 4
    ];
  }

  face.supportsCanvas = function() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
  };

  face.supportsSVG = function() {
    return !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
  };

  function Circle(vis, xi, yi, size, color, children, layer, onSplit) {
    this.vis = vis;
    this.x = size * (xi + 0.5);
    this.y = size * (yi + 0.5);
    this.size = size;
    this.color = color;
    this.rgb = d3.rgb(color[0],color[1],color[2]);
    //this.rgb = d3.rgb((color[0]+color[1]+color[2])/3, (color[0]+color[1]+color[2])/3, (color[0]+color[1]+color[2])/3);
    this.children = children;
    this.layer = layer;
    this.onSplit = onSplit;
  }

  Circle.prototype.isSplitable = function() {
    return this.node && this.children
  }

  Circle.prototype.split = function() {
    if (!this.isSplitable()) return;
    d3.select(this.node).remove();
    //delete this.node;
    Circle.addToVis(this.vis, this.children);
    this.onSplit(this);
  }

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

  Circle.addToVis = function(vis, circles, cat, num) {
    var circle = vis.selectAll('.nope').data(circles)
      .enter().append('circle');

     circle = circle;
    /*if (init) {
      // Setup the initial state of the initial circle
      circle = circle
        .attr('cx',   function(d) { return d.x; })
        .attr('cy',   function(d) { return d.y; })
        .attr('r', 4)
        .attr('fill', '#ffffff')
          .transition()
          .duration(300);
    } else {
      // Setup the initial state of the opened circles
      circle = circle
        .attr('cx',   function(d) { return d.parent.x; })
        .attr('cy',   function(d) { return d.parent.y; })
        .attr('r',    function(d) { return d.parent.size / 2; })
        .attr('fill', function(d) { return String(d.parent.rgb); })
        .attr('fill-opacity', 0.68)
          .transition()
          .duration(300);
    }*/
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
  var scores;
  var what_scores = {"what-you-say": 1,"what-you-do": 1, "who-you-know": 1, "where-you-go": 1};

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
    
  d3.json("survey.json", function(data) {
    scores = data.scores;
  });

  face.makeCircles = function(selector, colorData, onEvent) {
    onEvent = onEvent || function() {};

    var splitableByLayer = [],
        splitableTotal = 0,
        nextPercent = 0;

    function onSplit(circle) {
      // manage events
      var layer = circle.layer;
      splitableByLayer[layer]--;
      if (splitableByLayer[layer] === 0) {
        onEvent('LayerClear', layer);
      }

      var percent = 1 - d3.sum(splitableByLayer) / splitableTotal;
      if (percent >= nextPercent) {
        onEvent('PercentClear', Math.round(nextPercent * 100));
        nextPercent += 0.05;
      }
    }

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
        if(xi < (dim / 2) && yi < (dim / 2)){
            color = [Math.min(colorData[t]+100,255), colorData[t+1], colorData[t+2]];
        }else if(xi < (dim / 2) && yi >= (dim / 2)){
            color = [colorData[t], Math.min(colorData[t+1]+100,255), colorData[t+2]];
        }else if(xi >= (dim / 2) && yi >= (dim / 2)){
            color = [colorData[t], colorData[t+1], Math.min(colorData[t+2]+100,255)];
        } else{
            color = [Math.min(colorData[t]+100,255), Math.min(colorData[t+1]+100,255), colorData[t+2]];
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
            new Circle(vis, xi, yi, size, color, [c1, c2, c3, c4], currentLayer, onSplit)
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
    // Create the initial circle
    Circle.addToVis(vis, [level_list[1](0,0)], "wyk",delay);
    Circle.addToVis(vis, [level_list[1](1,0)], "wys",delay);
    Circle.addToVis(vis, [level_list[1](0,1)], "wyg",delay);
    Circle.addToVis(vis, [level_list[1](1,1)], "wyd",delay);
      
    // Interaction helper functions
    function splitableCircleAt(pos) {
      var xi = Math.floor(pos[0] / minSize),
          yi = Math.floor(pos[1] / minSize),
          circle = finestLayer(xi, yi);
      if (!circle) return null;
      while (circle && !circle.isSplitable()) circle = circle.parent;
      return circle || null;
    }

    function intervalLength(startPoint, endPoint) {
      var dx = endPoint[0] - startPoint[0],
          dy = endPoint[1] - startPoint[1];

      return Math.sqrt(dx * dx + dy * dy);
    }

    function breakInterval(startPoint, endPoint, maxLength) {
      var breaks = [],
          length = intervalLength(startPoint, endPoint),
          numSplits = Math.max(Math.ceil(length / maxLength), 1),
          dx = (endPoint[0] - startPoint[0]) / numSplits,
          dy = (endPoint[1] - startPoint[1]) / numSplits,
          startX = startPoint[0],
          startY = startPoint[1];

      for (var i = 0; i <= numSplits; i++) {
        breaks.push([startX + dx * i, startY + dy * i]);
      }
      return breaks;
    }

    function findAndSplit(startPoint, endPoint) {
      var breaks = breakInterval(startPoint, endPoint, 4);
      var circleToSplit = []

      for (var i = 0; i < breaks.length - 1; i++) {
        var sp = breaks[i],
            ep = breaks[i+1];

        var circle = splitableCircleAt(ep);
        if (circle && circle.isSplitable() && circle.checkIntersection(sp, ep)) {
          circle.split();
        }
      }
    }
 
    d3.select("#SMULevel").on("input", function() {
        console.log("Social Media changed 1");
        $.queue.clear();
        $.queue.add(function(){face.updateData()},this,500);
        console.log("Social Media changed 2");
    });
    d3.select("#IncLevel").on("input", function() {
        $.queue.clear();
        $.queue.add(function(){face.updateData()},this,500);
    });
      
    var base_scores = (JSON.parse(JSON.stringify(scores.tech)));
      
    face.loadProfileData = function loadProfileData(num){
       var answers = scores["sample"+num];
       d3.select("#SMULevel").property("value", answers["social-connections"]);
       d3.select("#IncLevel").property("value", answers["income"]);
       d3.select("#CarUse").property("value", answers["car"]);
       face.updateData();
    }; 
    
    
    function addToTotal(result){
       //console.log(result);
       for(var item in result){
            base_scores[item]["what-you-say"] = base_scores[item]["what-you-say"] * (result[item]); 
            base_scores[item]["what-you-do"] = base_scores[item]["what-you-do"] * (result[item]);
            base_scores[item]["who-you-know"] = base_scores[item]["who-you-know"] * (result[item]);
            base_scores[item]["where-you-go"] = base_scores[item]["where-you-go"] * (result[item]); 
       }
    }
    
    face.updateData = function updateData(){
       base_scores = (JSON.parse(JSON.stringify(scores.tech)));
       var smuResult, incResult, carResult;
       var i = 1; 
       for (item in scores.survey["social-connections"]){
           if (i == d3.select("#SMULevel").property("value"))
               smuResult = scores.survey["social-connections"][item];
           i++;
       }
       i = 1; 
       for (item in scores.survey["income"]){
           if (i == d3.select("#IncLevel").property("value"))
               incResult = scores.survey["income"][item];
           i++;
       }

       var carResult = scores.survey["car"][d3.select("#CarUse").property("value")];
    
       addToTotal(smuResult);
       addToTotal(incResult);
       addToTotal(carResult);
    
       what_scores["what-you-say"] = 1;
       what_scores["what-you-do"] = 1;
       what_scores["who-you-know"] = 1;
       what_scores["where-you-go"] = 1;
   
        
        for(var item in base_scores){
            what_scores["what-you-say"] = Math.min(1365, what_scores["what-you-say"] + Math.pow(base_scores[item]["what-you-say"],2));
            what_scores["what-you-do"] = Math.min(1365, what_scores["what-you-do"] + Math.pow(base_scores[item]["what-you-do"],2));
            what_scores["who-you-know"] =  Math.min(1365, what_scores["who-you-know"] + Math.pow(base_scores[item]["who-you-know"],2));
            what_scores["where-you-go"] = Math.min(1365, what_scores["where-you-go"] + Math.pow(base_scores[item]["where-you-go"],2));
        }
        //console.log(base_scores);
        //console.log("GRRRR!!!!")
        $.queue.add(function(){update(what_scores["who-you-know"],"wyk",0,0)},this);
        $.queue.add(function(){update(what_scores["what-you-say"],"wys",1,0)},this);
        $.queue.add(function(){update(what_scores["where-you-go"],"wyg",0,1)},this);
        $.queue.add(function(){update(what_scores["what-you-do"],"wyd",1,1)},this);

        //console.log("Jerkk!!!!")
    };
        
    function update(nLevel,cat,x,y) {
  	 //console.log(cat+": "+nLevel);
         vis.selectAll('.'+cat).remove();
         stackCircles(nLevel,x,y,cat);
        // update the circle radius
  	 //svg.selectAll("circle").attr("r", nLevel);
    }
      
    function log4(n){
        //console.log("log4: "+(Math.log(n) / Math.log(4)));
        return Math.log(n) / Math.log(4);
    }
      
      
    function stackCircles(nLevel, x, y,cat) {
        var level = Math.ceil(log4(3) + log4(nLevel) - 1);
        var num_parents = (Math.pow(4,level-1)-1)/3; //how many nodes above me
        var children = Math.ceil(((nLevel) - num_parents) / 4) * 4; //how many children I need to draw
        var delay_max = Math.ceil(50000 / ((level*level)+1));
        var counter = 0;
        //console.log("DelyMax:"+delay_max);
        if (nLevel <= 1) {
            Circle.addToVis(vis,[level_list[1](x,y)],cat)
            return;
        }
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
      } 
  };
    
  return face;
}

