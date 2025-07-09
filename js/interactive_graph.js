document.addEventListener('DOMContentLoaded', function() {
    // 直接调用 loadFSM() 来显示图形
    loadFSM();
    generateQRCode();
});

// Load FSM data and visualize
function loadFSM() {
    const data = {
        
            "agents": [
                {
                    "agent_id": "0",
                    "name": "RequirementDesigner",
                    "system_prompt": "You are RequirementDesigner. Your goal is to understand the software requirements and create a design or architecture for the software. Your responsibility is to gather and analyze the requirements for the software project and ensure that the design is robust and scalable.",
                    "tools": [
                        "search_engine"
                    ]
                },
                {
                    "agent_id": "1",
                    "name": "CodeDeveloper",
                    "system_prompt": "You are CodeDeveloper. Your goal is to write the actual code for the software based on the design provided by RequirementDesigner. You are also responsible for writing a README file for the user and saving the developed software to a local file system. Ensure that the code is clean, efficient, and functional.",
                    "tools": [
                        "file_writer"
                    ]
                },
                {
                    "agent_id": "2",
                    "name": "Tester",
                    "system_prompt": "You are Tester. Your goal is to test the software to ensure it works as intended. Your responsibility is to identify and report any bugs or issues in the software. You should also report the expected metrics  on the test dataset to the user.",
                    "tools": [
                        "code_interpreter"
                    ]
                }
            ],
            "states": {
                "states": [
                    {
                        "state_id": "1",
                        "agent_id": "0",
                        "instruction": "Gather and analyze software requirements and create a design or architecture based on the requirements.",
                        "is_initial": true,
                        "is_final": false,
                        "listener": [
                            "1"
                        ]
                    },
                    {
                        "state_id": "2",
                        "agent_id": "1",
                        "instruction": "Write the actual code based on the design, write a README file, and save the developed software to a local file system.",
                        "is_initial": false,
                        "is_final": false,
                        "listener": [
                            "2"
                        ]
                    },
                    {
                        "state_id": "3",
                        "agent_id": "2",
                        "instruction": "Test the software to ensure it works as intended. Report the expected metrics (like F-1 score, RMSE, etc.) on the test dataset to the user.",
                        "is_initial": false,
                        "is_final": false,
                        "listener": [
                            "0",
                            "1"
                        ]
                    },
                    {
                        "state_id": "4",
                        "agent_id": "0",
                        "instruction": "<|submit|> The a response to the user, example: <|submit|>The software is developed and the metrics on the test dataset are reported.",
                        "is_initial": false,
                        "is_final": true,
                        "listener": []
                    }
                ],
                "transitions": [
                    {
                        "from_state": "1",
                        "to_state": "2",
                        "condition": "If requirements are clear and complete and design is robust and scalable"
                    },
                    {
                        "from_state": "2",
                        "to_state": "3",
                        "condition": "If code is clean, efficient, and functional and README is clear, informative, and easy to understand"
                    },
                
                    {
                        "from_state": "3",
                        "to_state": "4",
                        "condition": "If software works as intended and metrics are reported"
                    },
                    {
                        "from_state": "3",
                        "to_state": "2",
                        "condition": "If the test is not passed"
                    }
        
                ]
            }
        
    };
    
    visualizeFSM(data);
}

let currentHighlightedNode = null;

// Visualize FSM
function visualizeFSM(data) {
    // Clear previous graph
    d3.select("#fsm-graph").selectAll("*").remove();

    // Set up SVG canvas
    const svg = d3.select("#fsm-graph")
                  .append("svg")
                  .attr("width", '100%')
                  .attr("height", '100%')
                  .style("background-color", "transparent");

    const width = document.getElementById('fsm-graph').clientWidth;
    const height = document.getElementById('fsm-graph').clientHeight;

    // Create a map of agents for easy lookup
    const agentsMap = {};
    data.agents.forEach(agent => {
        agentsMap[agent.agent_id] = agent;
    });

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

    // Process bidirectional edges
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

    // Initialize simulation
    const simulation = d3.forceSimulation(nodes)
                         .force("link", d3.forceLink(links).id(d => d.id).distance(200))
                         .force("charge", d3.forceManyBody().strength(-1000))
                         .force("center", d3.forceCenter(width / 2, height / 2));

    // Add SVG filters for glow
    svg.append("defs").html(`
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5"
            orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L10,5 L0,10" fill="#00fff7" />
        </marker>
    `);

    // Draw links
    const link = svg.append("g")
                    .attr("class", "links")
                    .selectAll("path")
                    .data(links)
                    .enter()
                    .append("path")
                    .attr("class", "link-path")
                    .attr("stroke", "#00fff7")
                    .attr("stroke-width", "1.5px")
                    .attr("fill", "none")
                    .attr("marker-end", "url(#arrow)")
                    .style("filter", "url(#glow)")
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
                              .text(`Transition Condition:`);

                        dialog.append("foreignObject")
                              .attr("x", 20)
                              .attr("y", 40)
                              .attr("width", 230)
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
                    .attr("fill", d => d.is_initial ? "#ff00cc" : d.is_final ? "#00fff7" : "#222")
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
                              .attr("y", 60)
                              .attr("font-size", "14px")
                              .attr("fill", "#fff")
                              .text(`Agent Name: ${agent ? agent.name : 'Unknown'}`);

                        dialog.append("text")
                              .attr("x", 20)
                              .attr("y", 90)
                              .attr("font-size", "14px")
                              .attr("fill", "#fff")
                              .text(`Instruction:`);

                        dialog.append("foreignObject")
                              .attr("x", 20)
                              .attr("y", 100)
                              .attr("width", 230)
                              .attr("height", 40)
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
                              .text(`Tools: ${agent && agent.tools ? agent.tools.join(', ') : 'None'}`)
                              .attr("dy", "0.35em");
                    });

    // Update positions
    simulation.on("tick", () => {
        link.attr("d", d => {
            if (d.source === d.target) {
                // Self-loop
                const x = d.source.x;
                const y = d.source.y;
                const loopRadius = 100;
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
                    // Calculate arrow start and end points at the circle's edge
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const sourceX = d.source.x + (dx * 40) / distance;
                    const sourceY = d.source.y + (dy * 40) / distance;
                    const targetX = d.target.x - (dx * 40) / distance;
                    const targetY = d.target.y - (dy * 40) / distance;
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

    // Add tooltip functionality
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(20, 20, 40, 0.98)")
        .style("color", "#00fff7")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Update node mouse events
    node.on("mouseover", function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 35);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`State ID: ${d.id}<br/>Agent: ${d.agent_id}`)
                   .style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 30);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
            svg.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Make SVG responsive
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // Add touch support for dialogs
    node.on("touchstart", function(event, d) {
        event.preventDefault();
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
              .attr("y", 60)
              .attr("font-size", "14px")
              .attr("fill", "#fff")
              .text(`Agent Name: ${agent ? agent.name : 'Unknown'}`);

        dialog.append("text")
              .attr("x", 20)
              .attr("y", 90)
              .attr("font-size", "14px")
              .attr("fill", "#fff")
              .text(`Instruction:`);

        dialog.append("foreignObject")
              .attr("x", 20)
              .attr("y", 100)
              .attr("width", 230)
              .attr("height", 40)
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
              .text(`Tools: ${agent && agent.tools ? agent.tools.join(', ') : 'None'}`)
              .attr("dy", "0.35em");
    });
}