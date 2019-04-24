import * as d3 from 'd3';
import axios from 'axios';

const drawButton = d3.select('#draw-button');

// Axios constants
const axiosLastfm = axios.create({
    baseURL: `http://ws.audioscrobbler.com/2.0/`
  });
const lastfmKeyAndConfig = `&api_key=${process.env.LASTM_KEY}&format=json`;

// Add button click event to get data and call
window.onload = function(){
  drawButton.on('click', axiosCall);
  document.addEventListener("keydown", event => {
    if (event.key === 'Enter')
      axiosCall();
  });
} 

//  AXIOS CALL AND DATA =============================================
function axiosCall(){
  // Show loading button
  drawButton.attr('class', 'ui loading button');

  // Declare variables using html menu options
  let user = d3.select('#user').node().value,
      userMethod = '&user=' + encodeURIComponent(user);

  // Get the data with the variables
  axiosLastfm.get(`?method=user.gettopartists&limit=25${userMethod}${lastfmKeyAndConfig}`)
    // Extract just the artist names from the response
    .then(response => response.data.topartists.artist.map(d => d.name) )
    // Use artist names in d3 chart
    .then(axiosArtists => {drawChart(axiosArtists)})
    .catch(err => {
      console.log(err);
      drawButton.attr('class', 'ui yellow button');
    })
}

// =============================================
function drawChart(axiosArtists){
  let margin = {top: 20, right: 0, bottom: 0, left: 0}

  let width = window.innerWidth,
      height = window.innerHeight;

  // Margin convention
  let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(0,${margin.top})`);

  // Set the years ==============
  // Date parsing and formatting functions
  let parseFullDate = d3.timeParse("%d %b %Y %H:%M"),
      yearF = d3.timeFormat("%Y");

  let startYear = 2012,
      endYear = 2019;
  
  let years = d3.timeYear.range(new Date(startYear,0), new Date(endYear,0), 1)

  years = years.map( d => yearF(d) );

  // Set the artists ==============
  let defaultArtists = ["Tera Melos", "The Fall of Troy", "Led Zeppelin", "The Number Twelve Looks Like You", "Iron & Wine", "Maps & Atlases", "Igor Stravinsky", "Over the Rhine", "This Town Needs Guns", "Hiatus Kaiyote"]
  let artists = axiosArtists ? axiosArtists : defaultArtists;

  let calculatedData = [];
  let stackedData = []

  const n = artists.length, // number of layers
        m = years.length; // number of samples per layer
  
  const stack = d3.stack()
        .keys( artists )
        .offset( d3.stackOffsetWiggle );

  d3.csv("data/grrtano-last-fm_4-14-19.csv").then(data => {
    // Format the date
    data.forEach( d => {
      d.date = parseFullDate(d.date);
    });

    // Find playcount per artist and year
    years.forEach(year => {
      let artistObj = {year}
      
      artists.forEach(artist => {
        
        let filteredData = data.filter(d => artist === d.artist && yearF(d.date) === year);

        artistObj[artist] = filteredData.length;
      });

      calculatedData.push(artistObj)
    });

    // Stack the data for streamgraph configuration
    stackedData = stack(calculatedData);

    let x = d3.scaleLinear()
        .domain([0, m - 1])
        .range([0, width]);

    let y = d3.scaleLinear()
        .domain([
          d3.min(stackedData, layers => d3.min(layers, currLayer => currLayer[0] ) ),
          d3.max(stackedData, layers => d3.max(layers, currLayer => currLayer[1] ) )
        ])
        .range([height, 0]);

    let xAxis = d3.axisBottom()
        .ticks( years.length )
        .tickFormat( (d,i) => years[i] )
        .scale(x);

    let maxArr = [];

    stackedData.forEach(d => {
      let max = d3.max(calculatedData, yearObj => yearObj[d.key])
      let maxIndex = -1;

      for (let i = 0; i < m; i++){
        if (calculatedData[i][d.key] === max)
          maxArr.push(i);
      }
    });

    // Colors generated at http://tools.medialab.sciences-po.fr/iwanthue/
    // 20 colors
    const color = d3.scaleOrdinal(["#a38575","#354f9e","#e5d072","#4d77cb","#838f32","#81abff","#784e00","#48e2fd","#6f3100","#019bb8","#f59c68","#0272ad","#bc7b39","#01a294","#8f70a1","#87b45e","#a091a8","#4b7d2c","#bdd3e4","#353618","#e4ce8f","#005351","#c7d6a4","#006a4c","#3fab70"]);
    // 10 colors ["#5bca77","#d64936","#91c441","#cf526c","#6db9a7","#d67e39","#6e8b4d","#d5a08d","#d0b148","#966b43"]

    let area = d3.area()
        .curve( d3.curveCardinal.tension(.1) )
        .x( (d,i) => x(i) )
        .y0( d => y(d[0]) )
        .y1( d => y(d[1]) );

    // Add the paths and area for artists' playcounts
    svg.selectAll("path")
        .data(stackedData)
      .enter().append("path")
        .attr("class", 'layer')
        .attr("d", area)
        .style("fill", (d,i) => color(i) );

    // Add artist's text labels
    svg.selectAll('text')
        .data(stackedData)
      .enter()
      .append("text")
        .attr('class', 'artist-text')
        .attr('x', (d,i) => x( maxArr[i] )) // Place the artist's text in the year where they had the most plays (thus the most area to display the name)
        .attr('y', (d,i) => {
          let j = maxArr[i];
          return y( (d[j][0] + d[j][1]) /2 ) 
        }) // Center the text vertically in the middle of the stream bounds
        .attr('dy', '.31em') // text anchor offset
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('text-anchor', (d,i) => {
          return maxArr[i] === 0 ? 'start' :
            maxArr[i] === years.length - 1 ? 'end' :
              'middle';
        })
        .text( d => d.key)

    // Add timeline text at the top
    svg.append('g')
      .attr("transform", "translate(0," + height -20 + ")")
      .call(xAxis);

  }) // End d3.csv()
  .then( () => {
    drawButton.attr('class', 'ui button')
  });
} // End drawChart();

// ========================== vertical grid line on mousemove ====================================================
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