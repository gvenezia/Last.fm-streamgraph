import * as d3 from 'd3';

var artists = ["Tera Melos", "The Fall of Troy", "Led Zeppelin", "The Number Twelve Looks Like You", "Iron & Wine", "Maps & Atlases", "Igor Stravinsky", "Over the Rhine", "This Town Needs Guns", "Hiatus Kaiyote"]
var years = ["2015", "2016", "2017", "2018"]

var parseFullDate = d3.timeParse("%d %b %Y %H:%M")
var yearF = d3.timeFormat("%Y")

var dateString = "06 Feb 2019 19:37";

console.log(yearF(parseFullDate(dateString)));

// ==============================================================================

var n = artists.length, // number of layers
    m = years.length, // number of samples per layer
    stack = d3.stack()
              .keys( artists )
              .offset( d3.stackOffsetWiggle );

// Create empty data structures
// var matrix0 = years.map( d => {return {year:d}} );
// var matrix1 = years.map( d => {return {year:d}} );

// console.log((function(){var n = 20, // number of layers
//     m = 200, // number of samples per layer
//     stack = d3.stack().keys(d3.range(n).map(function (d) { return "layer"+d; })).offset(d3.stackOffsetWiggle);

//     // Create empty data structures
//     var matrix0 = d3.range(m).map(function (d) { return { x:d }; });
//     var matrix1 = d3.range(m).map(function (d) { return { x:d }; });

//     console.log(d3.range(m).map(function (d) { return { x:d }; }));

//     // Fill them with random data
//     d3.range(n).map(function(d) { bumpLayer(m, matrix0, d); });
//     d3.range(n).map(function(d) { bumpLayer(m, matrix1, d); });

//     console.log(matrix0);
// })());

// ==============================================================================
let calculatedData = [];
let stackedData = []

var graph = d3.csv("data/grrtano-last-fm.csv", data => {
  data.forEach( d => {
    d.date = parseFullDate(d.date);
  });

  years.forEach(year => {
    let artistObj = {year}
    
    artists.forEach(artist => {
      
      let filteredData = data.filter(d => artist === d.artist && yearF(d.date) === year);

      artistObj[artist] = filteredData.length;
    });

    calculatedData.push(artistObj)
  })

  console.log(calculatedData);

stackedData = stack(calculatedData)
  //, nextStackedData = stack(matrix1);

console.log('stackedData',stackedData);

var width = window.innerWidth,
    height = window.innerHeight - 20;

var xAxis = d3.axisBottom();

var x = d3.scaleLinear()
    .domain([0, m - 1])
    .range([0, width]);

var y = d3.scaleLinear()
    .domain([
      d3.min(stackedData/*.concat(nextStackedData)*/, layer => d3.min(layer, d => d[0] ) ),
      d3.max(stackedData/*.concat(nextStackedData)*/, layer => d3.max(layer, d => d[1] ) )
    ])
    .range([height, 0]);

console.log(d3.min(stackedData, layer => d3.min(layer, d => d[0] ) ),
      );

// Colors generated at http://tools.medialab.sciences-po.fr/iwanthue/
var color = d3.scaleOrdinal([
  "#5bca77",
  "#d64936",
  "#91c441",
  "#cf526c",
  "#6db9a7",
  "#d67e39",
  "#6e8b4d",
  "#d5a08d",
  "#d0b148",
  "#966b43"]);

var area = d3.area()
    .curve( d3.curveCardinal.tension(.6) )
    .x( (d,i) => x(i*2) )
    .y0( d => y(d[0]) )
    .y1( d => y(d[1]) );

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.selectAll("path")
    .data(stackedData)
  .enter().append("path")
    .attr("d", area)
    .style("fill", (d,i) => color(i) );

svg.append('g')
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

  // let filteredData = data.filter(d => artists.find(artist => artist === d.artist))

  // console.log(filteredData);
  // var series = stack(nest.entries(data));
  // console.log(stack(nest.entries(data)));

  // let filteredYear = filteredData.filter(d => yearF(d.date) === "2012")
  // console.log(filteredYear);

});
// ==============================================================================

// OLD LOGIC FOR TESTING 
// Fill them with random data
// years.map(d => bumpLayer(m, matrix0, d) );
// years.map(d => bumpLayer(m, matrix1, d) );

// console.log(matrix0);






// function transition() {
//   d3.selectAll("path")
//       .data(function() {
//         var d = nextStackedData;
//         nextStackedData = stackedData;
//         return stackedData = d;
//       })
//     .transition()
//       .duration(2500)
//       .attr("d", area);
// }

// Inspired by Lee Byron's test data generator.
// function bumpLayer(n, matrix, layer) {

//   function bump(a) {
//     var x = 1 / (.1 + Math.random()),
//         y = 2 * Math.random() - .5,
//         z = 10 / (.1 + Math.random());
//     for (var i = 0; i < n; i++) {
//       var w = (i / n - y) * z;
//       a[i] += x * Math.exp(-w * w);
//     }
//   }

//   var a = [], i;
//   var i;

//   for (i = 0; i < n; ++i) a[i] = 0;
//   for (i = 0; i < 5; ++i) bump(a);

//   return a.forEach(function(d, i) {
//     matrix[i]["layer" + layer] = Math.max(0, d) + 1; 
//   });
// }