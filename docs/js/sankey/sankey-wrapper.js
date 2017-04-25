  var units = "USD",
      linkTooltipOffset = 62,
      nodeTooltipOffset = 130,
      technologies = ["Stingray", "ALPR", "ShotSpotter","CCTV and Public Transit", 
              "Social Media Monitoring"];

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 800 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

  /* Initialize tooltip */
  var tipLinks = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10,0]);

  var tipNodes = d3.tip()
      .attr('class', 'd3-tip d3-tip-nodes')
      .offset([-10, 0]);

  function formatAmount(val) {
      return val.toLocaleString("en-US", {style: 'currency', currency: "USD"}).replace(/\.[0-9]+/, "");
  };

  // append the svg canvas to the page
  var svg = d3.select("#sankey").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "sankey")
      .call(tipLinks)
      .call(tipNodes)
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

  // Set the sankey diagram properties
  var sankey = d3.alluvialGrowth()
      .nodeWidth(36)
      .nodePadding(14)
      .size([width, height]);

  var path = sankey.link();
  var alpr_link = 1;
  var tech_more;
  d3.json("survey.json", function(data) {
    tech_more = data.scores.tech;
  });
    
var tech_data = {
    "Stingray": {
        in_score : 1,
        out_score : 1,
        image : "img/stingray.png",
        bio : "<p>Blah Blah Blah Stung.</p>",
        color : "#54AF52",
        speed : "20s",
        short : "stingray"
    },  
    "ALPR": {
        in_score : 1,
        out_score : 1,
        image : "img/alpr1.jpg",
        bio : "<p>Blah Blah Blah Beep.</p>",
        color : "#DD6CA7",
        speed : "4s",
        short : "alpr"
    }, 
    "ShotSpotter": {
        in_score : 1,
        out_score : 1,
        image : "img/shotspotter.jpg",
        bio : "<p>Blah Blah Blah Bang.</p>",
        color : "#ff9f2f",
        speed : "17s",
        short : "shotspotter"
    }, 
    "CCTV and Public Transit": {
        in_score : 1,
        out_score : 1,
        image : "img/cctv.jpg",
        bio : "<p>Blah Blah Blah Bus.</p>",
        color : "#9D5130",
        speed : "3s",
        short : "cctv"
    }, 
    "Social Media Monitoring": {
        in_score : 1,
        out_score : 1,
        image : "img/socialmedia.jpg",
        bio : "<p>Blah Blah Blah Tweet.</p>",
        color : "#AB9C27",
        speed : "8s",
        short : "smm"
    }};
    
  var category_data = {
      "Where You Go": {
          in_score : 1,
      },
      "Who You Know": {
          in_score : 1,
      },
      "What You Say": {
          in_score : 1,
      },
      "What You Do": {
          in_score : 1,
      }
  };
    
  var agency_data = {
      "Oakland Police": {
          out_score : 1,
      },
      "Alameda County Sheriff": {
          out_score : 1,
      },
      "FBI": {
          out_score : 1,
      },
      "DHS": {
          out_score : 1,
      }
  };

 console.log("About to load sankey data!!");
  d3.csv("scores.csv", function(error, data) {

    var currentData = data;

    function processData(data, init) {
      var graph = {"nodes" : [], "links" : []};

      data.forEach(function (d) {
        graph.nodes.push({ "name": d.source,
                           "shortname": d.shortname });
        graph.nodes.push({ "name": d.target,
                           "shortname": d.shortname });
        if(init){
            if(d.target in tech_data){
                graph.links.push({ "source": d.source,
                               "target": d.target,
                               "endValue": +d.endval,
                               "value": +d.startval});
                tech_data[d.target].out_score = +d.startval;
            } else if(d.source in tech_data){
                graph.links.push({ "source": d.source,
                               "target": d.target,
                               "value": +d.startval,
                               "endValue": +d.endval });
                tech_data[d.source].in_score = +d.endval;
            } else {
                graph.links.push({ "source": d.source,
                   "target": d.target,
                   "endValue": +d.endval,
                   "value": +d.startval}); 
            }
        } else {
            if(d.target in tech_data){
                graph.links.push({ "source": d.source,
                               "target": d.target,
                               "endValue": +d.endval,
                               "value": +d.startval}); //tech_data[d.target].out_score});            
            } else if(d.source in tech_data){
                graph.links.push({ "source": d.source,
                               "target": d.target,
                               "value": +d.startval,
                               "endValue": tech_data[d.source].in_score});
            } else {
                graph.links.push({ "source": d.source,
                   "target": d.target,
                   "endValue": +d.endval,
                   "value": +d.startval});
            }
        }
       });

      graph.nodesNew = d3.nest()
         .key(function (d) { return d.name; })
         .rollup(function (d) { return d[0].shortname; }) // returns the shorname of the first element of that key
         .map(graph.nodes);

       // return only the distinct / unique nodes
      graph.nodes = d3.keys(d3.nest()
         .key(function (d) { return d.name; })
         .map(graph.nodes));


      // loop through each link replacing the text with its index from node
      graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
      });
        


      //now loop through each nodes to make nodes an array of objects
      // rather than an array of strings
      graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = { "name": d,
                           "shortname": d };
      });
      return graph;
    }

    
    function get_blurb(tech, title){
        var titlekey = title.replace(/\s+/g, '-').toLowerCase() + "-blurb";
        var blurb = tech_more[tech_data[tech].short][titlekey];
        var split_blurb = blurb.split(" ");

        var result = "";
        var char_count = 0;
        for(var i = 0; i < split_blurb.length; i++){
            if(char_count > 30){
                result = result + "<br>";
                char_count = 0;
            }
            result = result + " "+split_blurb[i];
            char_count = char_count + split_blurb[i].length;
            //console.log(result);
        }
        return result;
    }
      
      
    tipLinks.html(function(d) {
      var title, tech;
      if (technologies.indexOf(d.source.name) > -1) {
        tech = d.source.name;
        title = d.target.name;
        var html =  '<div class="table-wrapper">'+
            '<h1>'+title+': '+tech+'</h1>'+
            '<table>'+
                '<tr>'+
                    '<td class="col-left">'+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left" align="left">'+get_blurb(tech, title)+'</td>'+
                '</tr>'+
            '</table>'+
            '</div>';
      } else {
        tech = d.target.name;
        title = d.source.name;
        var html =  '<div class="table-wrapper">'+
            '<h1>'+title+': '+tech+'</h1>'+
            '<table>'+
                '<tr>'+
                    '<td class="col-left">'+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="col-left" align="left">'+get_blurb(tech, title)+'</td>'+
                '</tr>'+
            '</table>'+
            '</div>';
      }

      return html;
    });

    tipNodes.html(function(d) {
      var object = d3.entries(d),
          nodeName = object[0].value,
          linksTo = object[2].value,
          linksFrom = object[3].value,
          html;

      html =  '<div class="table-wrapper">'+
              '<h1>'+nodeName+'</h1>'+
              '<table>';
      if (linksFrom.length > 0 & linksTo.length > 0) {
        html+= '<tr><td><h2>Information Type:</h2></td><td></td></tr>'
      }
      for (i in linksFrom) {
        html += '<tr>'+
          '<td class="col-left">'+linksFrom[i].source.name+'</td>'+
          '<td align="right">'+formatAmount(linksFrom[i].value)+'</td>'+
        '</tr>';
      }
      if (linksFrom.length > 0 & linksTo.length > 0) {
        html+= '<tr><td><h2>Jurisdictions:</h2></td><td></td></tr>'
      }
      for (i in linksTo) {
        html += '<tr>'+
                  '<td class="col-left">'+linksTo[i].target.name+'</td>'+
                  '<td align="right">'+formatAmount(linksTo[i].value)+'</td>'+
                '</tr>';
      }
      html += '</table></div>';
      return html;
    });
      
    renderSankey(true);

    //the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr("transform", 
          "translate(" + d.x + "," + (
                  d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
              ) + ")");
      sankey.relayout();
      link.attr("d", path);
    }

    function hasLinks(node, links) {
      // checks if any links in links reference node
      l = false;
      links.forEach(function (d) {
        if (d.source == node || d.target == node) {
          l = true;
        }
      })
      return l;
    }

    d3.select('#spending-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data.filter(function (d) {
        return technologies.indexOf(d.source)+1;
      });
      renderSankey(false);
    });
    d3.select('#revenue-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data.filter(function (d) {
        return technologies.indexOf(d.target)+1;
      });
      renderSankey(false);
    });
    d3.select('#showall-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data;
      renderSankey(false);
    })

    function renderSankey(init) {
      d3.select('body').selectAll('g').remove();

      graph = processData(currentData, init);

      /*graph.links.forEach(function (d, i) {
            if(graph.nodes[d.source].name == "ALPR"){
                console.log(graph.nodes[d.source].name);
                graph.links[i].value = d3.select("#ALPRLevel").value;
            } 
        });*/
        
        
      myLinks = graph.links;
      myNodes = graph.nodes;


      svg = d3.select('.sankey')
          .attr("width", width+200)
          .attr("height", height)
        .append("g");


        
      sankey = d3.alluvialGrowth()
        .size([width, height])
        .nodes(myNodes)
        .links(myLinks)
        .layout(120);

      path = sankey.link();



      // add in the links
      link = svg.append("g").selectAll(".link")
          .data(myLinks)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          //.attr('class', 'flowline')
          .style("stroke-width", function(d) { 
                return 0; //Math.max(1, d.dy);
           })
          .style("fill", function(d) {
            return getGradient(d);
           })
          .sort(function(a, b) { return b.dy - a.dy; })
          .on('mousemove', function(event) {
            tipLinks
              .style("top", (d3.event.pageY - linkTooltipOffset) + "px")
              .style("left", function () {
                var left = (Math.max(d3.event.pageX - linkTooltipOffset, 10)); 
                left = Math.min(left, window.innerWidth - $('.d3-tip').width() - 20)
                return left + "px"; })
            })
          .on('mouseover', tipLinks.show)
          .on('mouseout', tipLinks.hide);


     // add in the nodes
      node = svg.append("g").selectAll(".node")
          .data(myNodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { 
              return "translate(" + d.x + "," + d.y + ")"; })
          .on('mousemove', function(event) {
            tipNodes
              .style("top", (d3.event.pageY - $('.d3-tip-nodes').height() - 20) + "px")
              .style("left", function () {
                var left = (Math.max(d3.event.pageX - nodeTooltipOffset, 10)); 
                left = Math.min(left, window.innerWidth - $('.d3-tip').width() - 20)
                return left + "px"; })
            })
          .on('mouseover', function(event){
            d3.select(this).style("cursor", "pointer");
            tipNodes.show(event);
          })
          .on('mouseout', tipNodes.hide)
        .call(d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", function() { 
              this.parentNode.appendChild(this); })
          .on("drag", dragmove))
            .on("mousedown", function(d){
               //console.log("CLIK!");
                if(d.name in tech_data){
                    showTechInfo(d.name);
                }
            });

      // add the rectangles for the nodes
      //node.append("rect")
          node.append("svg:image")
          .attr("height", function(d) { return d.dy; })
          .attr("width", function(d) { return d.dy; })
          .attr("xlink:href", function(d) {
            //console.log(d);
            if(d.name in tech_data){return tech_data[d.name].image;}
            return "img/node.png";
          })
  
          .attr("class", function(d) { 
            if (d.name == "Bernie Sanders" || d.name == "Hillary Clinton") { d.class = 'dem'; } 
            else if (technologies.indexOf(d.name) > 1) { d.class = 'rep'; } 
            else { d.class = 'none'; }
            return d.class; })
          .style("fill", function(d) {
            if(d.name in tech_data) tech_data[d.name].color;
            return "#CCCCCC";
          })
          .style("stroke", function(d) { 
		    return d3.rgb(d.color).darker(2); });
      
      if (true) {
        node.append("text")
            .attr("x", function(d) { return 6; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", function(d) { return 6;}) // + d.dy; })
            .attr("text-anchor", "start");
      } else {
        node.append("text")
            .attr("x", 6 + sankey.nodeWidth())
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", -6)
            .attr("text-anchor", "end");
      }
    }

    d3.select(window).on('resize.sankey', renderSankey(false));
      
    function getGradient(d) {
            var color = "#CCCCCC";
            var speed = "3s";
            var name = "undefined";
            if(d.source.name in tech_data){ 
                color = tech_data[d.source.name].color;
                speed = tech_data[d.source.name].speed;
                name = d.source.name;
                
            }
            if(d.target.name in tech_data){ 
                color = tech_data[d.target.name].color;
                speed = tech_data[d.target.name].speed;
                name = d.target.name;
            }
            name = name.replace(/\s/g,'');
            ////////////////////////////////////////////////////////////
            /////////////////// Animated gradient //////////////////////
            ////////////////////////////////////////////////////////////
            //var wrapper = d3.select("#sankey");
    var defs = svg.append("defs");
    var linearGradient = defs.append("linearGradient")
        .attr("id","animatedGradient"+name)
        .attr("x1","0%")
        .attr("y1","0%")
        .attr("x2","100%")
        .attr("y2","0")
        .attr("spreadMethod", "reflect");

    linearGradient.append("animate")
        .attr("attributeName","x1")
        .attr("values","0%;100%")
    //	.attr("from","0%")
    //	.attr("to","100%")
        .attr("dur",speed)
        .attr("repeatCount","indefinite");

    linearGradient.append("animate")
        .attr("attributeName","x2")
        .attr("values","100%;200%")
    //	.attr("from","100%")
    //	.attr("to","200%")
        .attr("dur",speed)
        .attr("repeatCount","indefinite");

    linearGradient.append("stop")
        .attr("offset","5%")
        .attr("stop-color","#FFFFFF");
    linearGradient.append("stop")
        .attr("offset","35%")
        .attr("stop-color",color);
    linearGradient.append("stop")
        .attr("offset","65%")
        .attr("stop-color",color);
    linearGradient.append("stop")
        .attr("offset","95%")
        .attr("stop-color","#FFFFFF");
     return "url(#animatedGradient"+name+")";
    }  
    
    function showTechInfo(name){
        document.getElementById("techinfo").innerHTML=tech_data[name].bio;
        document.getElementById("techinfo").style.display = 'block';
    }
      
    d3.select("#ALPRLevel").on("input", function() {
         tech_data["ALPR"].in_score = +this.value;
         renderSankey(false);
		});

  });