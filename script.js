
d3.json("airports.json", d3.autoType).then(airports => {
    d3.json("world-110m.json", d3.autoType).then(world => {

        worldmap = topojson.feature(world, world.objects.countries)

        console.log(airports)
        console.log(worldmap)

        // Create SVG
        let outerWidth = 650
        let outerHeight = 500
        let margin = {top: 30, bottom: 30, left: 30, right: 30}
        let width = outerWidth - margin.left - margin.right
        let height = outerHeight - margin.top - margin.bottom

        const svg = d3.select(".container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.right})`)

        // Construct projection
        const projection = d3.geoMercator()
            .fitExtent([[0, 0], [width, height]], worldmap)

        // Create path generator
        const path = d3.geoPath()
            .projection(projection)

        // Draw map
        const map = svg.selectAll("path")
            .append("g")
            .data(worldmap.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("opacity", 0)

        // Draw border lines
        svg.append("path")
            .datum(topojson.mesh(world, world.objects.countries))
            .attr("d", path)
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr("class", "subunit-boundary")

        // Scale for sizing the circles
        const rScale = d3.scaleLinear()
            .domain(d3.extent(airports.nodes, d => d.passengers))
            .range([5, 11])

        // Create force simulation
        const simulation = d3.forceSimulation(airports.nodes)
            .force("link", d3.forceLink(airports.links))
            .force("charge", d3.forceManyBody().strength(-40))
            .force("xAxis", d3.forceX(width / 2))
            .force("yAxis", d3.forceY(height / 2))

        // Create links
        const link = svg.selectAll("line")
            .data(airports.links)
            .join("line")
            .attr("stroke", "gray")

        // Create nodes and titles
        const node = svg.selectAll("circle")
            .data(airports.nodes)
            .join("circle")
            .attr("r", d => rScale(d.passengers))
            .attr("fill", "orange")
            .call(drag(simulation))

        node.append("title")
            .text(d => d.name)

        simulation.on("tick", () => {

            console.log("tick")

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y)

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
        })

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            
            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            
            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            
            return d3.drag()
                .filter(event => visType === "force")
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        let visType = "force"

        function switchLayout() {
            if (visType === "map") {
                simulation.stop()

                node.transition()
                    .attr("cx", d => projection([d.longitude, d.latitude])[0])
                    .attr("cy", d => projection([d.longitude, d.latitude])[1])

                link.transition()
                    .attr("x1", d => projection([d.source.longitude, d.source.latitude])[0])
                    .attr("y1", d => projection([d.source.longitude, d.source.latitude])[1])
                    .attr("x2", d => projection([d.target.longitude, d.target.latitude])[0])
                    .attr("y2", d => projection([d.target.longitude, d.target.latitude])[1])

                map.transition()
                    .duration(100)
                    .attr("opacity", 1)
            }
            else {
                
                node.transition()
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)

                link.transition()
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y)

                simulation.restart()

                map.transition()
                    .duration(100)
                    .attr("opacity", 0)
            }
        }

        d3.selectAll("input[name=type]").on("change", event => {
            visType = event.target.value
            switchLayout()
        })
    })
})

