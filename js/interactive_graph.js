document.addEventListener('DOMContentLoaded', function() {

    function loadFSM() {
        fetch('data/test_mas.json')
            .then(response => response.json())
            .then(data => {
                visualizeFSM(data);
            })
            .catch(error => console.error('Error loading FSM data:', error));
    }

    function visualizeFSM(data) {
        // Clear previous graph
        d3.select("#fsm-graph").selectAll("*").remove();

        // Set up SVG canvas
        const svg = d3.select("#fsm-graph")
                      .append("svg")
                      .attr("width", '100%')
                      .attr("height", '600px')
                      .style("background-color", "transparent");

        const width = document.getElementById('fsm-graph').clientWidth;
        const height = document.getElementById('fsm-graph').clientHeight;

        // Define arrow markers for links
        const defs = svg.append("defs");

        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
          .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#0ff');

        // Prepare nodes and links
        const nodes = data.states.states.map(state => ({
            id: state.state_id,
            name: state.state_id,
            instruction: state.instruction,
            agent_id: state.agent_id,
            is_initial: state.is_initial,
            is_final: state.is_final
        }));

        let links = data.states.transitions.map(transition => ({
            source: transition.from_state,
            target: transition.to_state,
            condition: transition.condition
        }));

        // Process bidirectional edges and self-loops
        const linkCounts = {};
        links.forEach(link => {
            const key = `${link.source}-${link.target}`;
            const reverseKey = `${link.target}-${link.source}`;
            if (link.source !== link.target) {
                if (linkCounts[key]) {
                    link.curve = Math.PI / 4;
                } else if (linkCounts[reverseKey]) {
                    link.curve = -Math.PI / 4;
                } else {
                    link.curve = 0;
                }
                linkCounts[key] = (linkCounts[key] || 0) + 1;
            }
        });

        // Create a map of agents for easy lookup
        const agentsMap = {};
        data.agents.forEach(agent => {
            agentsMap[agent.agent_id] = agent;
        });

        // Initialize simulation
        const simulation = d3.forceSimulation(nodes)
                             .force("link", d3.forceLink(links).id(d => d.id).distance(200))
                             .force("charge", d3.forceManyBody().strength(-1000))
                             .force("center", d3.forceCenter(width / 2, height / 2));

        // Draw links
        const link = svg.append("g")
                        .attr("class", "links")
                        .selectAll("path")
                        .data(links)
                        .enter()
                        .append("path")
                        .attr("class", "link-path")
                        .attr("stroke", "#0ff")
                        .attr("stroke-width", "1.5px")
                        .attr("fill", "none")
                        .attr("marker-end", "url(#arrow)")
                        .on("mouseover", function() {
                            d3.select(this)
                              .attr("stroke-width", "3px");
                        })
                        .on("mouseout", function() {
                            d3.select(this)
                              .attr("stroke-width", "1.5px");
                        })
                        .on("click", function(event, d) {
                            // Remove existing dialogs
                            d3.selectAll(".info-dialog").remove();

                            // Create dialog
                            const dialog = svg.append("g")
                                              .attr("class", "info-dialog")
                                              .attr("transform", `translate(${d3.pointer(event, svg.node())[0] + 20}, ${d3.pointer(event, svg.node())[1] - 20})`);

                            // Dialog background
                            dialog.append("rect")
                                  .attr("width", 250)
                                  .attr("height", 100)
                                  .attr("rx", 10)
                                  .attr("ry", 10)
                                  .attr("fill", "rgba(50, 50, 50, 0.95)")
                                  .attr("stroke", "#fff")
                                  .attr("stroke-width", 1.5);

                            // Close button
                            dialog.append("text")
                                  .attr("x", 230)
                                  .attr("y", 20)
                                  .attr("text-anchor", "end")
                                  .attr("font-size", "16px")
                                  .attr("fill", "#fff")
                                  .style("cursor", "pointer")
                                  .text("✖")
                                  .on("click", function() {
                                      dialog.remove();
                                  });

                            // Information content
                            dialog.append("text")
                                  .attr("x", 20)
                                  .attr("y", 40)
                                  .attr("font-size", "14px")
                                  .attr("fill", "#fff")
                                  .text(`Condition:`);

                            dialog.append("foreignObject")
                                  .attr("x", 20)
                                  .attr("y", 50)
                                  .attr("width", 210)
                                  .attr("height", 40)
                                  .append("xhtml:div")
                                  .style("font-size", "12px")
                                  .style("color", "#fff")
                                  .style("overflow-wrap", "break-word")
                                  .html(d.condition);
                        });

        // Draw nodes
        const node = svg.append("g")
                        .attr("class", "nodes")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                        .append("circle")
                        .attr("class", "node-circle")
                        .attr("r", 30)
                        .attr("fill", d => {
                            if (d.is_initial) {
                                return "#4CAF50"; // Green for initial nodes
                            } else if (d.is_final) {
                                return "#F44336"; // Red for final nodes
                            } else {
                                return "#2196F3"; // Blue for standard nodes
                            }
                        })
                        .attr("stroke", "#0ff")
                        .attr("stroke-width", 2)
                        .attr("id", d => `node-${d.id}`)
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended))
                        .on("mouseover", function() {
                            d3.select(this)
                              .transition()
                              .duration(200)
                              .attr("r", 35);
                        })
                        .on("mouseout", function() {
                            d3.select(this)
                              .transition()
                              .duration(200)
                              .attr("r", 30);
                        })
                        .on("click", function(event, d) {
                            // Remove existing dialogs
                            d3.selectAll(".info-dialog").remove();

                            // Get node position
                            const [x, y] = [d.x, d.y];

                            // Create dialog
                            const dialog = svg.append("g")
                                              .attr("class", "info-dialog")
                                              .attr("transform", `translate(${x + 50}, ${y - 60})`);

                            // Dialog background
                            dialog.append("rect")
                                  .attr("width", 250)
                                  .attr("height", 150)
                                  .attr("rx", 10)
                                  .attr("ry", 10)
                                  .attr("fill", "rgba(50, 50, 50, 0.95)")
                                  .attr("stroke", "#fff")
                                  .attr("stroke-width", 1.5);

                            // Close button
                            dialog.append("text")
                                  .attr("x", 230)
                                  .attr("y", 20)
                                  .attr("text-anchor", "end")
                                  .attr("font-size", "16px")
                                  .attr("fill", "#fff")
                                  .style("cursor", "pointer")
                                  .text("✖")
                                  .on("click", function() {
                                      dialog.remove();
                                  });

                            // Information content
                            dialog.append("text")
                                  .attr("x", 20)
                                  .attr("y", 30)
                                  .attr("font-size", "14px")
                                  .attr("fill", "#fff")
                                  .text(`State ID: ${d.id}`);

                            const agent = agentsMap[d.agent_id];

                            dialog.append("text")
                                  .attr("x", 20)
                                  .attr("y", 50)
                                  .attr("font-size", "14px")
                                  .attr("fill", "#fff")
                                  .text(`Agent Name: ${agent ? agent.name : 'Unknown'}`);

                            dialog.append("text")
                                  .attr("x", 20)
                                  .attr("y", 70)
                                  .attr("font-size", "14px")
                                  .attr("fill", "#fff")
                                  .text(`Instruction:`);

                            dialog.append("foreignObject")
                                  .attr("x", 20)
                                  .attr("y", 80)
                                  .attr("width", 210)
                                  .attr("height", 50)
                                  .append("xhtml:div")
                                  .style("font-size", "12px")
                                  .style("color", "#fff")
                                  .style("overflow-wrap", "break-word")
                                  .html(d.instruction);

                            dialog.append("text")
                                  .attr("x", 20)
                                  .attr("y", 140)
                                  .attr("font-size", "14px")
                                  .attr("fill", "#fff")
                                  .text(`Tools: ${agent && agent.tools ? agent.tools.join(', ') : 'None'}`);
                        });

        // Update positions
        simulation.on("tick", () => {
            link.attr("d", d => {
                if (d.source === d.target) {
                    // Self-loop
                    const x = d.source.x;
                    const y = d.source.y;
                    const loopRadius = 30;
                    return `M${x},${y}
                            C${x + loopRadius},${y - loopRadius}
                             ${x + loopRadius},${y + loopRadius}
                             ${x},${y}`;
                } else {
                    if (d.curve !== undefined) {
                        const dx = d.target.x - d.source.x;
                        const dy = d.target.y - d.source.y;
                        const dr = Math.sqrt(dx * dx + dy * dy);
                        return `M${d.source.x},${d.source.y}
                                A${dr},${dr} 0 0,${d.curve > 0 ? 1 : 0}
                                ${d.target.x},${d.target.y}`;
                    } else {
                        const dx = d.target.x - d.source.x;
                        const dy = d.target.y - d.source.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const offsetX = (dx * 30) / distance;
                        const offsetY = (dy * 30) / distance;
                        const sourceX = d.source.x + offsetX;
                        const sourceY = d.source.y + offsetY;
                        const targetX = d.target.x - offsetX;
                        const targetY = d.target.y - offsetY;
                        return `M${sourceX},${sourceY}
                                L${targetX},${targetY}`;
                    }
                }
            });

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }

    // Load and visualize FSM
    loadFSM();

});