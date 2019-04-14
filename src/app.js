import * as d3 from 'd3';
import axios from 'axios';

//  AXIOS CALL AND DATA =============================================
let user = 'grrtano';

const axiosLastfm = axios.create({
  baseURL: `http://ws.audioscrobbler.com/2.0/`
});

const lastfmKeyAndConfig = `&api_key=${process.env.REACT_APP_LASTM_KEY}&format=json`;

let URIEncodedUser = encodeURIComponent(user);


axiosLastfm.get(`?method=user.getrecenttracks&user=${URIEncodedUser}&limit=17${lastfmKeyAndConfig}`)
  .then(response => {console.log(response)})

// console.log(response);
// =============================================


var artists = ["Tera Melos", "The Fall of Troy", "Led Zeppelin", "The Number Twelve Looks Like You", "Iron & Wine", "Maps & Atlases", "Igor Stravinsky", "Over the Rhine", "This Town Needs Guns", "Hiatus Kaiyote"]
var years = [
// "2009",
'2010','2011', '2012','2013', "2014", "2015", "2016", "2017", "2018", '2019']

var parseFullDate = d3.timeParse("%d %b %Y %H:%M")
var yearF = d3.timeFormat("%Y")

var dateString = "06 Feb 2019 19:37";

// ==============================================================================

var n = artists.length, // number of layers
    m = years.length, // number of samples per layer
    stack = d3.stack()
              .keys( artists )
              .offset( d3.stackOffsetWiggle );

let calculatedData = [];
let stackedData = []

var graph = d3.csv("data/grrtano-last-fm_4-14-19.csv", data => {
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
  });

  console.log(calculatedData);

  stackedData = stack(calculatedData);

  console.log('stackedData',stackedData);

  var width = window.innerWidth,
      height = window.innerHeight;

  var x = d3.scaleLinear()
      .domain([0, m - 1])
      .range([0, width]);

  var y = d3.scaleLinear()
      .domain([
        d3.min(stackedData, layers => d3.min(layers, currLayer => currLayer[0] ) ),
        d3.max(stackedData, layers => d3.max(layers, currLayer => currLayer[1] ) )
      ])
      .range([height, 0]);

  var xAxis = d3.axisBottom()
    .tickFormat( (d,i) => years[i] )
    .scale(x);

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
      .x( (d,i) => x(i) )
      .y0( d => y(d[0]) )
      .y1( d => y(d[1]) );

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.selectAll("path")
      .data(stackedData)
    .enter().append("path")
      .attr("class", 'layer')
      .attr("d", area)
      .style("fill", (d,i) => color(i) );

  let maxArr = [];

  stackedData.forEach(d => {
    let max = d3.max(calculatedData, yearObj => yearObj[d.key])
    let maxIndex = -1;

    for (let i = 0; i < m; i++){
      if (calculatedData[i][d.key] === max)
        maxArr.push(i);
    }
  });

  svg
  .selectAll('text')
      .data(stackedData)
    .enter()
    .append("text")
      .attr('x', (d,i) => x( maxArr[i] ))
      .attr('y', (d,i) => {
        let j = maxArr[i];
        return y( (d[j][0] + d[j][1]) /2 ) 
      })
      .attr('dy', '.31em') // text anchor offset
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('text-anchor', (d,i) => {
        return maxArr[i] === 0 ? 'start' :
          maxArr[i] === years.length - 1 ? 'end' :
            'middle';
      })
      .text( d => d.key)

  svg.append('g')
    .attr("transform", "translate(0," + 300 + ")")
    .call(xAxis);

}); // End d3.csv()

// svg.selectAll(".layer")
//     .attr("opacity", 1)
//     .on("mouseover", function(d, i) {
//       svg.selectAll(".layer").transition()
//       .duration(250)
//       .attr("opacity", (d, j) => j != i ? 0.6 : 1 )
//     })
//     .on("mousemove", function(d, i) {
//       mousex = d3.mouse(this)[0];

//       var invertedx = x.invert(mousex);

//       invertedx = invertedx.getMonth() + invertedx.getDate();

//       var selected = (d.values);

//       for (var k = 0; k < selected.length; k++) {
//         datearray[k] = selected[k].date
//         datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
//       }

//       mousedate = datearray.indexOf(invertedx);
//       pro = d.values[mousedate].value;

//       d3.select(this)
//       .classed("hover", true)
//       .attr("stroke", strokecolor)
//       .attr("stroke-width", "0.5px"), 
//       tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "visible");
      
//     })
//     .on("mouseout", function(d, i) {
//      svg.selectAll(".layer")
//       .transition()
//       .duration(250)
//       .attr("opacity", "1");
//       d3.select(this)
//       .classed("hover", false)
//       .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "hidden");
//   })

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