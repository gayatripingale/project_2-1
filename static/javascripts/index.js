/*define svg container dimensions for bubble chart*/
var svgWidth_b = 900;
var svgHeight_b = 500;

/*define margins around bubble chart area*/
var margin_b = {
  top: 50,
  right: 20,
  bottom: 20,
  left: 40
};

/*calculate bubble chart area dimensions*/
var width_b = svgWidth_b - margin_b.left - margin_b.right;
var height_b = svgHeight_b - margin_b.top - margin_b.bottom;

/*create the SVG container and set the origin point of bubble chart*/
var svg_b = d3.select("#bubbleChartSection").append("svg")
  .attr("id","bubbleChart")
  .attr("width", svgWidth_b)
  .attr("height", svgHeight_b);
    
var bubbleChartGroup = svg_b.append("g")
  .attr("transform", `translate(${margin_b.left}, ${margin_b.top})`);


/*define various scales used for x axis, y axis, radius of bubbles and color of bubbles*/
var xScale_b = d3.scaleLog().domain([40, 3000]).range([0, width_b]); /*use log scale so bubbles will not be displayed too closely*/
var yScale_b = d3.scaleLinear().domain([0, 18]).range([height_b, 0]);
var radiusScale_b = d3.scaleSqrt().domain([0, 4e7]).range([0, 40]); /*use square root scale to scale on large population numbers */
var colorScale_b = d3.scaleOrdinal(d3.schemeCategory10); /*use d3 ordinal color scale for different category of states*/

/*define x and y axis for bubble chart*/
var bottomAxis_b = d3.axisBottom(xScale_b);
bottomAxis_b.ticks(10, d3.format(",d")); /*make x axis tick show in integers on a log scale*/

var leftAxis_b = d3.axisLeft(yScale_b).ticks(10);

/*add x and y axis*/
bubbleChartGroup.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${height_b})`)
  .call(bottomAxis_b);

bubbleChartGroup.append("g")
  .attr("class", "y axis")
  .call(leftAxis_b);

/*add x and y axis labels*/
bubbleChartGroup.append("text")
  .attr("class", "x label")
  .attr("text-anchor", "end")
  .attr("x", width_b)
  .attr("y", height_b - 6)
  .text("Violent crime rate per 100,000 population");

bubbleChartGroup.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", 6)
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text("Unemployment rate");

/*add year label and set it to be the first year in the data*/
var label_b = bubbleChartGroup.append("text")
  .attr("class", "yearLabel")
  .attr("text-anchor", "end")
  .attr("x", parseInt(`${margin_b.left}`)+width_b/2)
  .attr("y", parseInt(`${margin_b.top}`)+height_b/8)
  .text(1976);

/*use d3-tip library to create tooltips*/ 
var toolTip_b = d3.tip()
  .attr('class', 'd3-tip')
  .direction('s')
  .html(function(data) {
    return `<strong>${data.stateName}</strong> <hr> <strong>Population:&nbsp&nbsp&nbsp </strong>` 
      + parseInt(`${data.population}`).toLocaleString() 
      + "<br><strong>Unemployment rate:&nbsp&nbsp&nbsp</strong>"
      + parseFloat(`${data.unemploymentRate}`).toFixed(2) + "% <br> <strong>Violent Crime Rate:&nbsp&nbsp&nbsp </strong>" 
      + parseFloat(`${data.crimeRate}`/100000*100).toFixed(2) + "%"
  });

/*add tooltips*/
bubbleChartGroup.call(toolTip_b);

/*load data*/
var routeURL = "/chartdata"
d3.json(routeURL, function(data) {
	
/*	var bubbleData = data.chartData;*/
  /*create a list of years from the data*/
  data.map(function (d) {
  	return d.year = d.year.map(d=>parseInt(d))
  })
  
  data.map(function (d) {
  	return d.unemploymentRate = d.unemploymentRate.map(d=>parseInt(d))
  })
  
  data.map(function (d) {
  	return d.robberyRate = d.robberyRate.map(d=>parseInt(d))
  })
      
  data.map(function (d) {
  	return d.rapeRate = d.rapeRate.map(d=>parseInt(d))
  })
  
  data.map(function (d) {
  	return d.population = d.population.map(d=>parseInt(d))
  })
    
  data.map(function (d) {
  	return d.murderRate = d.murderRate.map(d=>parseInt(d))
  })

	data.map(function (d) {
  	return d.crimeRate = d.crimeRate.map(d=>parseInt(d))
  })

	data.map(function (d) {
  	return d.assaultRate = d.assaultRate.map(d=>parseInt(d))
  })


  var yearList = data[0].year;  

  /*create the inital bubble chart*/
	var circleGroup = bubbleChartGroup.selectAll(".circle")
		.data(interpolateData(1976)) /*bind first year's data*/
		.enter()
		.append("circle")
		.attr("class", "circle")
		.attr("r", data=>radiusScale_b(data.population))
		.attr("cx", data=>xScale_b(data.crimeRate))
		.attr("cy", data=>yScale_b(data.unemploymentRate))
		.attr("opacity",.8)
		.style("fill", data=>colorScale_b(data.category))
		.sort(order); /*sort the bubbles based on radius so that smaller bubbles are always on top of larger bubbles*/

	/*add events for bubbles*/
  circleGroup.on("mouseover",function (data){
		toolTip_b.show(data);
	});

	circleGroup.on("mouseout",function (data){
		toolTip_b.hide(data);
	});	
/*==============================================*/

  circleGroup.on("click", function (d) {
		/*dataFilter(d.stateCode);*/
		var selectedYear = label_b.text();
		var selectedState = d.stateName;

		var crimeBreakdown = [
			{type:"Murder", value:Math.round(d.murderRate), percent:Math.round(d.murderRate) / Math.round(d.crimeRate)},
			{type:"Rape", value:Math.round(d.rapeRate), percent:Math.round(d.rapeRate) / Math.round(d.crimeRate)},
			{type:"Robbery", value:Math.round(d.robberyRate), percent:Math.round(d.robberyRate) / Math.round(d.crimeRate)},
			{type:"Assault", value:Math.round(d.assaultRate), percent:Math.round(d.assaultRate) / Math.round(d.crimeRate)}
		];
		var sortedBreakdown = crimeBreakdown.sort(function(a,b){
			return b.value - a.value;
		});
		extraChart(selectedYear,selectedState,sortedBreakdown);
	});

  
/*==============================================*/
	/*define function to sort the bubbles based on radius*/
  function radius(d) { return d.population; }
  function order(a, b) { return radius(b) - radius(a); } /*sort in descending order*/
  	
	/*add an overlay on top of year label*/
  var box_b = label_b.node().getBBox();
  var overlay_b = bubbleChartGroup.append("rect")
		.attr("class", "overlayBox")
		.attr("x", box_b.x)
		.attr("y", box_b.y)
		.attr("width", box_b.width)
		.attr("height", box_b.height-30)
		.on("mouseover", enableInteraction);
		

  /*define a function to start transition of bubbles*/
  function animate() {
	if (d3.select("#barChart")) {
		d3.select("#barChart").remove();
	}

	if (d3.select("#pieChart")) {
		d3.select("#pieChart").remove();
	}

	hideButton();

	bubbleChartGroup.transition()
		.duration(30000)
		.ease(d3.easeLinear)
		.tween("year",tweenYear); /*use tween method to create transition frame by frame*/

	setTimeout(showObservation, 30500);

	function showObservation() {
		d3.selectAll("li")
			.style("color","black")
	}
  }

  /*define a function to interpolate a year (or a fraction of year) from the list of years, and it is used to create transition frames*/
  function tweenYear() {
  	var year = d3.interpolateNumber(1976,2014);
    return function(t) { updateChart(year(t)); };
  }
    
  /*define state code as the key to match up existing binded data and new data to be bound to circles*/
  function key(data) { return data.stateCode; }

  /*define a function to update bubble charts during the transition*/
  function updateChart(year) {
  	label_b.text(Math.round(year)); /*update year label, since year could be a fraction of years, round it to the whole year number*/
  	circleGroup
      /*bind new data interpolated from the dataset based on the tween year, and use key to match up with existing bound data*/
  		.data(interpolateData(year),key) 
  		.attr("r", data=>radiusScale_b(data.population))
  		.attr("cx", data=>xScale_b(data.crimeRate))
  		.attr("cy", data=>yScale_b(data.unemploymentRate))
  		.attr("opacity",.8)
  		.style("fill", data=>colorScale_b(data.category))
  		.sort(order)
  }

  /*define a function to interpolate the dataset for the given (fractional) year*/
  function interpolateData(year) {
    return data.map(function(d) {
      return {
        stateCode: d.stateCode,
        stateName: d.stateName,
        category: d.category[yearList.indexOf(Math.round(year))],
        unemploymentRate: interpolateValues(d.unemploymentRate, year),
        population: interpolateValues(d.population, year),
        crimeRate: interpolateValues(d.crimeRate, year),
        murderRate: interpolateValues(d.murderRate, year),
        rapeRate: interpolateValues(d.rapeRate, year),
        robberyRate: interpolateValues(d.robberyRate, year),
        assaultRate: interpolateValues(d.assaultRate, year),
      };   
    });
  }

  /*define a function to interpolate values based on given year*/
  function interpolateValues(values, year) {
    /*use bisect function to determine the position of given year in the year list in ascending order*/
    var i = d3.bisectLeft(yearList,year);
    /*extract the data value at current position i*/
    var b = values[i];
    /*when given year is not the first year in the year list, interpolate the values between a and b*/
    if (i > 0) {
        /*extract the data value before position i*/
        var a = values[i - 1];
        /*if given year is a whole year number, return 1, otherwise return the delta(fraction)*/
        var t = (year == Math.floor(year)? 1 : year - Math.floor(year));
        return a + (b - a) * t;
    }
    /*when given year is the first year in the year list, extract the first year's data*/
    return b;
  }

  /*define a function so that after the transition finishes, users can mouseover to change the year.*/
  function enableInteraction() {
	var yearScale = d3.scaleLinear()
	.domain([1976, 2014])
	.range([box_b.x + 10, box_b.x + box_b.width - 10])
	.clamp(true); /*use clamp method so that cannot go out of the range boundary*/

  	/*cancel the current transition, if any.*/
  	bubbleChartGroup.transition().duration(0);

  	/*when mouse move over the overlay, change the year based on the mouse position, and update the bubble chart accordingly*/
    overlay_b.on("mousemove", mousemove)
    
    function mousemove() { updateChart(yearScale.invert(d3.mouse(this)[0])); }
  }	

  /*create a play button to start animation for demo*/
	d3.select("#title").on("click",animate);

});


  /*=======================================*/

	function extraChart(clickedYear, clickedState, clickedData) {
		/*define svg container dimensions for extra bar chart and pie chart*/
		
		if (document.querySelector("#barChart")) { 
			d3.select("#barChart").remove()
			createBar();
		} else if (document.querySelector("#pieChart")) { 
			d3.select("#pieChart").remove()
			createBar();
		} else {
			createBar();
		};	


		function createBar(){
		
			valueCount = clickedData.map(d=>d.value).length;

			var svgWidth_e = 500;
			var svgHeight_e = 300;

			/*define margins around extra chart area*/
			var margin_e = {
			  top: 60,
			  right: 80,
			  bottom: 150,
			  left: 100
			};

			/*calculate extra chart area dimensions*/
			var width_e = svgWidth_e - margin_e.left - margin_e.right;
			var height_e = svgHeight_e - margin_e.top - margin_e.bottom;

			/*create the SVG container and set the origin point of extra chart*/
			var svg_e = d3.select("#extraChartSection").append("svg")
			  .attr("id","barChart")
			  .attr("width", svgWidth_e)
			  .attr("height", svgHeight_e);


			var extraTitle = svg_e.append("g").append("text")
			  .attr("class", "extra title")
			  .attr("text-anchor", "middle")
			  .attr("x", (width_e + margin_e.left) / 2 + 50)
			  .attr("y", 20)
			  .style("font-weight", "bold")
			  .style("font-size", "20px")
			  .text("Breakdown of Violent Crimes");

			var extraTitle = svg_e.append("g").append("text")
			  .attr("class", "extra title")
			  .attr("text-anchor", "middle")
			  .attr("x", (width_e + margin_e.left) / 2 + 50)
			  .attr("y", 40)
			  .style("font-weight", "bold")
			  .style("font-size", "16px")
			  .text(`${clickedState}, Year ${clickedYear}`);
			  
			



			var extraChartGroup = svg_e.append("g")
			  .attr("transform", `translate(${margin_e.left}, ${margin_e.top})`)
			  .attr("class","extraChart");


			/*configure a band scale for the y axis with a padding of 0.1 (10%)*/
			var yBandScale_e = d3.scaleBand()
				.domain(clickedData.map(d => d.type).reverse())
				.range([height_e,0])
				.paddingInner(0.01);


			/*create a linear scale for the x axis*/
			var xLinearScale_e = d3.scaleLinear()
				.domain([0, d3.max(clickedData.map(d => d.value))])
				.range([0,width_e]);

			var leftAxis_e = d3.axisLeft(yBandScale_e);

			var pie = d3.pie()
		        .value(d => d.value)


		    var arc = d3.arc()
		    	.cornerRadius(3)
                /*.padAngle(.01);*/

			var color = d3.scaleOrdinal()
    			.range(["#98abc5", "#7b6888", "#a05d56", "#ff8c00"]);

			var bGroup = extraChartGroup.selectAll(".barGroup")
			  .data(function() {
		            return pie(clickedData);
		        })
			  .enter()
			  .append("g")
			  .attr("class", "barGroup");

			bGroup.append("rect")
			  .attr("width", 0)
			  .attr("height", yBandScale_e.bandwidth())
			  .attr("x", 0)
			  .attr("y", function(data,index) {
			  
			    return index * (yBandScale_e.bandwidth() + 1);
			  })
			  .attr("rx",5)
			  .attr("yx",5)
			  .style("fill",function(d) {
			            return color(d.data.type);
			        })
			  .attr("class","bar")
			  .on("mouseover",highlight)
			  .on("mouseout",unhighlight)
			  .transition()
			  	.duration(500)
			  	.attr("width", d => xLinearScale_e(d.data.value))
			  


			extraChartGroup.selectAll(".barGroup")
				.append("path")
		        .style("fill",function(d) {
			            return color(d.data.type);
			        })
		        

			



			addBarAxis();

			function addBarAxis () {
				extraChartGroup.append("g")
				  .attr("class", "barYAxis")
				  .call(leftAxis_e);
			}
			
			setTimeout(addBarValues, 500);

			function addBarValues () {
				extraChartGroup.append("g").selectAll("text")
				  .data(clickedData)
				  .enter()
				  .append("text")
				  .attr("class","barValues")
				  .attr("x",d => xLinearScale_e(d.value) + 5)
				  .attr("y",function(data,index) {
				    return index * height_e / valueCount + 5 + yBandScale_e.bandwidth() / 2;
				  })
				  .text(d=>d.value + " per 100K")
			}
			

			function toPie() {
				

				if (document.querySelector("#barChart")) {
					d3.selectAll(".bar").remove();
					d3.selectAll(".barYAxis").remove();
					d3.selectAll(".barValues").remove();
					extraChartGroup.selectAll("path")
				        .transition()
				        .duration(500)
				        .tween("arc", arcTween);

				    function arcTween(d) {
				      
				        var path = d3.select(this);
				        var y0 = d.index * yBandScale_e.bandwidth();
				     
				        return function(t) {
				            var a = Math.cos(t * Math.PI / 2);
				            var r = (1 + a) * height_e / Math.min(1, t + .005);
				            var yy = r + a * y0;
				            var xx = ((1 - a) * width_e / 2);
				            var f = {
				                    innerRadius: (1-a) * r * .5 + a * (r - yBandScale_e.bandwidth()),
				                    outerRadius: r,
				                    startAngle: (1 - a) * d.startAngle,
				                    endAngle: a * (Math.PI / 2) + (1 - a) * d.endAngle
				                };


				            path.attr("transform", `translate(${xx},${yy})`);
				            path.attr("d", arc(f));
				            path.on("mouseover",showSliceInfo);
				            path.on("mouseout",hideSliceInfo);

						    function showSliceInfo() {
								if(document.querySelector("#pieChart")) {
									var slice = d3.select(this)
										.attr("stroke","#fff")
			              				.attr("stroke-width","2px");
									var sliceIndex = (slice._groups[0][0].__data__.index);
									var sliceType = clickedData[sliceIndex].type;
									var slicePercent = clickedData[sliceIndex].percent;
									

									svg_e.append("g").append("text")
									  .attr("class", "crimeType")
									  .attr("text-anchor", "middle")
									  .attr("x", 260)
									  .attr("y", 145)
									  .text(`${sliceType}`);

									svg_e.append("g").append("text")
									  .attr("class", "crimePercent")
									  .attr("text-anchor", "middle")
									  .attr("x", 260)
									  .attr("y", 165)
									  .text(function () {
									  	return d3.format(".1%")(`${slicePercent}`);
									  });

								} else {
									var selection = d3.select(this);
									highlight(selection);
								}
							}

							function hideSliceInfo() {
								if(document.querySelector("#pieChart")) {
									var slice = d3.select(this)
										.attr("stroke","none");

			              			d3.select(".crimeType").remove();	
			              			d3.select(".crimePercent").remove();	
									
								} else {
									var selection = d3.select(this);
									unhighlight(selection);
								}
							}
				        };
				    }

					

					

				}
				d3.select("#extraChartSection").select("svg")
					.attr("id","pieChart");
			}


			function toBar() {
				

				if (document.querySelector("#pieChart")) {

					extraChartGroup.selectAll("path")
				        .transition()
				        .duration(500)
				        .tween("arc", arcTween);
				        

				    

				    function arcTween(d) {
				  
				        var path = d3.select(this);
				        var y0 = d.index * yBandScale_e.bandwidth();
				        var x0 = xLinearScale_e(d.data.value);
				        
				        return function(t) {
				           
				            t = 1 - t;
				            var a = Math.cos(t * Math.PI / 2);
				            var r = (1 + a) * height_e / Math.min(1, t + .005);
				            var yy = r + a * y0;
				            var xx = (1 - a) * width_e / 2;
				            var f = {
				                    innerRadius: r - yBandScale_e.bandwidth() + 1,
				                    outerRadius: r,
				                    startAngle: (1 - a) * d.startAngle,
				                    endAngle: a * (x0 / r) + (1 - a) * d.endAngle
				                };


				            path.attr("transform", `translate(${xx},${yy})`);
				            path.attr("d", arc(f));
				        };
				        
				    }

				    setTimeout(addBarAxis, 600);
				    setTimeout(addBarValues, 600);
				    d3.select("#extraChartSection").select("svg")
					.attr("id","barChart");

				}
			}
			d3.select("#barButton").on("click",toBar);
			d3.select("#pieButton").on("click",toPie);

		}



	var selectedChart = d3.select("#extraChartSection");
	selectedChart
		.on("mouseover", showButton)
		.on("mouseout", hideButton);
	

	
}

function showButton() {
	d3.select("#barButton")
		.classed("inactive",false)
		.classed("active", true);
	d3.select("#pieButton")
		.classed("inactive",false)
		.classed("active", true);
	} 

	function hideButton() {
	d3.select("#barButton")
		.classed("active",false)
		.classed("inactive", true);
	d3.select("#pieButton")
		.classed("active",false)
		.classed("inactive", true);
	} 

function highlight(selection) {

	if (!selection._groups) {
			var selection = d3.select(this);
		};

	selection
		.attr("stroke","#fff")
		.attr("stroke-width","2px");
	var selectionIndex = (selection._groups[0][0].__data__.index);
	d3.selectAll(".barYAxis>.tick>text").each(function(d, i){
    if (3 - i == selectionIndex) {
    	d3.select(this).style("font-size","15px");
    	d3.select(this).style("fill","red");
    }
  });
	d3.selectAll(".barValues").each(function(d, i){
    if (i == selectionIndex) {
    	d3.select(this).style("font-size","13px");
    	d3.select(this).style("fill","red");
    }
  });
	
}

function unhighlight(selection) {	
	if (!selection._groups) {
			var selection = d3.select(this);
		};				
	selection.attr("stroke","none");
	var selectionIndex = (selection._groups[0][0].__data__.index);
		d3.selectAll(".barYAxis>.tick>text").each(function(d, i){
	    if (3 - i == selectionIndex) {
	    	d3.select(this).style("font-size","13px");
	    	d3.select(this).style("fill","black");
	    }
	  });
		d3.selectAll(".barValues").each(function(d, i){
	    if (i == selectionIndex) {
	    	d3.select(this).style("font-size","11px");
	    	d3.select(this).style("fill","black");
	    }
	  });
}