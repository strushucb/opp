  var units = "USD",
      linkTooltipOffset = 62,
      nodeTooltipOffset = 130,
      technologies, orgs, cats;

  d3.json("survey.json", function(data) {
    technologies = data.scores.tech;
    orgs = data.scores.orgs;
    cats = data.scores.information_categories;
  });

  var margin = {top: 10, right: 10, bottom: 10, left: 300},
      width = Math.round($(window).width() * .95) - margin.left - margin.right,
      height = Math.round($(window).height() * .75) - margin.top - margin.bottom;

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


 //console.log("About to load sankey data!!");
 d3.json("survey.json", function(data) {
    
    var currentData = data;
    function processData(data, init) {
        

        //console.log(data.scores);
        technologies = data["scores"]["tech"];
        orgs = data.scores.orgs;
        cats = data.scores.information_categories;

        var graph = {"nodes" : [], "links" : []};
        //console.log(technologies);
        for(var item in technologies){
            d = technologies[item];
            //console.log(d["short"]);
            graph.nodes.push({ "shortname": d["long"],
                               "name": d["short"] });        
            
            
            if(+d["what-you-say"] > 0){
                graph.nodes.push({ "shortname": "What You Say",        
                                   "name": "what-you-say" });
                graph.links.push({ "target": "what-you-say",
                                    "source": d["short"],
                                    "value": d["in_score"],
                                    "endValue": +d["what-you-say"]});  
            }
            if(+d["what-you-do"] > 0){
            graph.nodes.push({ "shortname": "What You Do",        
                               "name": "what-you-do" });
            graph.links.push({ "target": "what-you-do",
                                "source": d["short"],
                                "value": d["in_score"],
                                "endValue": +d["what-you-do"]});  
            }
            if(+d["where-you-go"] > 0){
                graph.nodes.push({ "shortname": "Where You Go",        
                               "name": "where-you-go" });
                graph.links.push({ "target": "where-you-go",
                                "source": d["short"],
                                "value": d["in_score"],
                                "endValue": +d["where-you-go"]});  
            }
            if(+d["who-you-know"] > 0){            
                graph.nodes.push({ "shortname": "Who You Know",        
                                   "name": "who-you-know" });
                graph.links.push({ "target": "who-you-know",
                                    "source": d["short"],
                                    "value": d["in_score"],
                                    "endValue": +d["who-you-know"]});  
            }
         }
        
        for(var item in orgs){
            d = orgs[item];
            equipment = d["tech"];
            //console.log(d["short"]);
            graph.nodes.push({ "shortname": d["long"],
                               "name": d["short"] });
            for(tech in equipment){
                if(equipment[tech] > 0){
                    graph.links.push({ "target": tech,
                                    "source": d["short"],
                                    "value": equipment[tech],
                                    "endValue": technologies[tech]["out_score"]});  
                }
            }
        }
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

    
      
      
    function write_link_blurb(tech, title){
    
        d3.selectAll(".panel-text").remove();
        var titlekey,blurb,split_blurb;
        if(title in orgs){
            titlekey = tech + "-blurb";
            blurb = orgs[title][titlekey];
            split_blurb = blurb.split(" ");
            title = orgs[title].long;
        }else{
            titlekey = title.replace(/\s+/g, '-').toLowerCase() + "-blurb";
            blurb = technologies[tech][titlekey];
            split_blurb = blurb.split(" ");
            title = cats[title].long;
        }

        var result = "";
        var char_count = 0;
        line = 0;
        
        svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
                .style("fill", "white")
                .style("font-size","smaller")
                .style("font-weight",900)
                .text(function(d){return technologies[tech].long;});
        line++;

        svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
                .style("fill", "white")
                .style("font-size","smaller")
                .style("font-weight",900)
                .text(function(d){return " & "+title+": ";});
        line++;

        for(var i = 0; i < split_blurb.length; i++){
            if(char_count > 27){
                svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
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
             svg.append("text")
                    .attr("class","panel-text")
                    .attr("x", 10)
                    .attr("y", 20*(line+1))
                    .style("fill", "white")
                    .style("font-size","smaller")
                    .text(function(d){return result;});
        }
    }
      
    function write_node_blurb(item){
    
        d3.selectAll(".panel-text").remove();
        //var titlekey = title.replace(/\s+/g, '-').toLowerCase() + "-blurb";
        var title, blurb;
        if(item in technologies){
            title = technologies[item].long;
            blurb = technologies[item].blurb;
        }else if(item in orgs){
            title = orgs[item].long;   
            blurb = orgs[item].blurb;   
        }else{
            title = cats[item].long;
            blurb = cats[item].blurb;
        }

        var split_blurb = blurb.split(" ");
        var result = "";
        var char_count = 0;
        line = 0;
        
        svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
                .style("fill", "white")
                .style("font-size","smaller")
                .style("font-weight",900)
                .text(function(d){return title;});
        line++;

        svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
                .style("fill", "white")
                .style("font-size","smaller")
                .style("font-weight",900)
                .text(function(d){return " & You: ";});
        line++;

        for(var i = 0; i < split_blurb.length; i++){
            if(char_count > 27){
                svg.append("text")
                .attr("class","panel-text")
                .attr("x", 10)
                .attr("y", 20*(line+1))
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
             svg.append("text")
                    .attr("class","panel-text")
                    .attr("x", 10)
                    .attr("y", 20*(line+1))
                    .style("fill", "white")
                    .style("font-size","smaller")
                    .text(function(d){return result;});
        }
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

      d3.selectAll(".panel-text")
            .style("fill", "white")
            .text(function(d) { return html});
      return "";
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
//          .attr("transform", function(d) { 
    //the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr("transform", 
          "translate(" + (margin.left + d.x) + "," + (
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


    function renderSankey(init) {
      d3.select('body').selectAll('g').remove();
      graph = processData(currentData, init);        
        
      myLinks = graph.links;
      myNodes = graph.nodes;

      //console.log("Links: "+myLinks);
    
      svg = d3.select('.sankey')
          .attr("width", width+100)
          .attr("height", height)

        .append("g");

      sankey = d3.alluvialGrowth()
        .size([width-300, height])
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
          .attr("transform", 
            "translate(" + margin.left + "," + 0 + ")")
          //.attr('class', 'flowline')
          .style("stroke-width", function(d) { 
                return 0; //Math.max(1, d.dy);
           })
          .style("fill", function(d) {
            return getGradient(d, false);
           })
          .sort(function(a, b) { return b.dy - a.dy; })
          .on('mousemove', function(event) {
            })
          .on('mouseover', function(event){
            var title, tech, html;
            if (event.source.name in technologies) {
                    tech = event.source.name;
                    title = event.target.name;
            } else {
                    tech = event.target.name;
                    title = event.source.name;
            }
            highlight_links(tech, false);
            write_link_blurb(tech, title);
          })
          .on('mouseout', function(event){
                highlight_links("", true);
            });

        
    function highlight_links(name, showAll){
        var links = svg.selectAll(".link");
        svg.selectAll("defs").remove();
        var items = [];
        if(name in technologies){
            items.push(name);
        }else if(name in orgs){
            var tech;
            d = orgs[name];
            tech = d["tech"];
            for(var x in tech){
                //console.log(x);
                if(tech[x] > 0){
                    items.push(x);
                }
            }
        }else if(name in cats){
            for(var x in technologies){
                d = technologies[x];
                if(d[name] > 0)
                    items.push(d.short);
            }
        }
        console.log(items);
        links.style("fill", function(d){
            if(showAll || items.indexOf(d.source.name) >= 0 || items.indexOf(d.target.name) >= 0){
                console.log("color - "+d.source.name+" to - "+d.target.name);
                return getGradient(d, false);
            } else{
                //console.log("grey - "+d.source.name+" to - "+d.target.name);
                return getGradient(d, true);
            }
        });
            
    }
        
     // add in the nodes
      node = svg.append("g").selectAll(".node")
          .data(myNodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { 
              return "translate(" + (margin.left + d.x) + "," + (d.y) + ")"; })
          .on('mousemove', function(event) {
          })
          .on('mouseover', function(event){
                write_node_blurb(event.name);
                highlight_links(event.name, false);
          })
          .on('mouseout', function(event){
                highlight_links(event.name, true);
            })
          .call(d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", function() { 
              this.parentNode.appendChild(this); })
          .on("drag", dragmove))
          .on("mousedown", function(d){
                /*if(d.name in technologies){
                    showTechInfo(d.name);
                }*/
            });

      // add the rectangles for the nodes
      //node.append("rect")
          node.append("svg:image")
          .attr("height", function(d) { return d.dy; })
          .attr("width", function(d) { return d.dy; })
          .attr("xlink:href", function(d) {
            //console.log(d);
            if(d.name in technologies){return technologies[d.name].image;}
            if(d.name in orgs){return orgs[d.name].image;}
            if(d.name in cats){return cats[d.name].image;}
            return "img/node.png";
          })
  
          .attr("class", function(d) { 
                d.class = 'tech'; 
            return d.class; })
          .style("fill", function(d) {
            if(d.name in technologies) technologies[d.name].color;
            return "#CCCCCC";
          })
          .style("stroke", function(d) { 
		    return d3.rgb(d.color).darker(2); });
        
      svg.append("svg:rect")
        .style("fill", "black")
        .attr("opacity", 0.7)
        .attr("class", "sankey-panel")
        .attr("transform", function(d) { 
          return "translate(" + (0) + "," + (0) + ")"; })
        .attr("height", height)
        .attr("width", 290);
        
        svg.append("text")
        .attr("class","panel-text")
        .attr("x", (45))
        .attr("y", 30)
        .attr("height", height)
        .attr("width", 300)
        .style("fill", "white")
        .style("font-size","smaller")
        .text("Explore the chart with your mouse.")
        
        svg.append("text")
        .attr("class","panel-text")
        .attr("x", (30))
        .attr("y", height/2)
        .attr("height", height)
        .attr("width", 300)
        .style("fill", "white")
        .style("font-size","smaller")
        .text("Details on each entity and relationship");
              
        svg.append("text")
        .attr("class","panel-text")
        .attr("x", (75))
        .attr("y", (height/2) + 20)
        .attr("height", height)
        .attr("width", 300)
        .style("fill", "white")
        .style("font-size","smaller")
        .text("will be displayed here.");
    }

    d3.select(window).on('resize.sankey', function(){
        width = Math.round($(window).width() * .95) - margin.left - margin.right,
        height = Math.round($(window).height() * .75) - margin.top - margin.bottom;
        renderSankey(false);
    });
                         
    function getGradient(d, isGray) {
            var color = "#CCCCCC";
            var color2 = "#AAAAAA";
            var speed = "3s";
            var name = "undefined";
            if(d.source.name in technologies){ 
                color = technologies[d.source.name].color;
                color2 = technologies[d.source.name]["color2"];
                speed = technologies[d.source.name].speed;
                name = d.source.name;
                
            }
            if(d.target.name in technologies){ 
                color = technologies[d.target.name].color;
                color2 = technologies[d.target.name]["color2"];
                speed = technologies[d.target.name].speed;
                name = d.target.name;
            }
            name = name.replace(/\s/g,'');
        
            if(isGray){
                color = "rgba(204, 204, 204, 0.5)";
                color2 = "rgba(170, 170, 170, 0.25)";
            }
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
        .attr("values","0%;-100%")
    //	.attr("from","0%")
    //	.attr("to","100%")
        .attr("dur",speed)
        .attr("repeatCount","indefinite");

    linearGradient.append("animate")
        .attr("attributeName","x2")
        .attr("values","-100%;-200%")
    //	.attr("from","100%")
    //	.attr("to","200%")
        .attr("dur",speed)
        .attr("repeatCount","indefinite");

    linearGradient.append("stop")
        .attr("offset","5%")
        .attr("stop-color",color2);
    linearGradient.append("stop")
        .attr("offset","35%")
        .attr("stop-color",color);
    linearGradient.append("stop")
        .attr("offset","65%")
        .attr("stop-color",color);
    linearGradient.append("stop")
        .attr("offset","95%")
        .attr("stop-color",color2);
     return "url(#animatedGradient"+name+")";
    }  
    
    function showTechInfo(name){
        document.getElementById("techinfo").innerHTML=technologies[name].bio;
        document.getElementById("techinfo").style.display = 'block';
    }
      
    d3.select("#ALPRLevel").on("input", function() {
         technologies["alpr"].in_score = +this.value;
         renderSankey(false);
		});

  });