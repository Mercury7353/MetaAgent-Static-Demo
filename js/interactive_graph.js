document.addEventListener('DOMContentLoaded', function() {
    const designForm = document.getElementById('design-form');
    const designResponse = document.getElementById('design-response');
    const deployForm = document.getElementById('deploy-form');
    const deployResponse = document.getElementById('deploy-response');
    const runLog = document.getElementById('run-log');

    // Handle design form submission
    const designSpinner = document.getElementById('design-spinner');
    designForm.addEventListener('submit', function(event) {
        event.preventDefault();
        designSpinner.style.display = 'inline-block'; // Show loading animation
        // Disable button to prevent duplicate submissions
        const designButton = designForm.querySelector('button[type="submit"]');
        designButton.disabled = true;
        designButton.textContent = 'Processing...';

        const taskDescription = document.getElementById('task_description').value;

        fetch('/design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `task_description=${encodeURIComponent(taskDescription)}`
        })
        .then(response => response.json())
        .then(data => {
            designResponse.innerText = data.message;
            if(data.status === 'success') {
                loadFSM();
            }
            // Hide loading animation after processing
            designSpinner.style.display = 'none';
            designButton.disabled = false;
            designButton.textContent = 'Design Multi-Agent System';
        });
    });

    // Handle deploy form submission
    const deploySpinner = document.getElementById('deploy-spinner');
    deployForm.addEventListener('submit', function(event) {
        event.preventDefault();
        deploySpinner.style.display = 'inline-block'; // Show loading animation
        // Disable button to prevent duplicate submissions
        const deployButton = deployForm.querySelector('button[type="submit"]');
        deployButton.disabled = true;
        deployButton.textContent = 'Processing...';

        const caseInput = document.getElementById('case_input').value;

        fetch('/deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `case_input=${encodeURIComponent(caseInput)}`
        })
        .then(response => response.json())
        .then(data => {
            deployResponse.innerText = data.message;
            if(data.status === 'success') {
                loadLog();
                loadFSM(); // Update FSM state
            }
            // Hide loading animation after processing
            deploySpinner.style.display = 'none';
            deployButton.disabled = false;
            deployButton.textContent = 'Run Test';
        });
    });

    // Load FSM data and visualize
    function loadFSM() {
        // 直接使用静态数据
        const data = {
            {
                "agents": [
                    {
                        "agent_id": "0",
                        "name": "DataProcessor",
                        "system_prompt": "Responsible for processing the given dataset for training and testing the machine learning model. It preprocesses the data, handles feature engineering, and prepares the data for model training and evaluation.",
                        "tools": [
                            "code_interpreter"
                        ]
                    },
                    {
                        "agent_id": "1",
                        "name": "ModelTrainer",
                        "system_prompt": "Responsible for training the machine learning model on the processed dataset. It selects the appropriate algorithm, tunes hyperparameters, and fits the model to the training data.",
                        "tools": []
                    },
                    {
                        "agent_id": "2",
                        "name": "Evaluator",
                        "system_prompt": "Responsible for evaluating the trained model on the test dataset and reporting the expected metrics (e.g., F-1 score, RMSE) to the user. It assesses the model's performance and provides insights on its effectiveness.",
                        "tools": [
                            "search_engine"
                        ]
                    }
                ],
                "states": {
                    "states": [
                        {
                            "state_id": "1",
                            "agent_id": "0",
                            "instruction": "Process the given dataset for training and testing the machine learning model. Perform data preprocessing and feature engineering.",
                            "is_initial": true,
                            "is_final": false,
                            "listener": [
                                "1"
                            ]
                        },
                        {
                            "state_id": "2",
                            "agent_id": "1",
                            "instruction": "Train the machine learning model on the processed dataset. Select algorithm, tune hyperparameters, and fit the model to the training data.",
                            "is_initial": false,
                            "is_final": false,
                            "listener": [
                                "2"
                            ]
                        },
                        {
                            "state_id": "3",
                            "agent_id": "2",
                            "instruction": "Evaluate the trained model on the test dataset. Report expected metrics (e.g., F-1 score, RMSE) to the user.",
                            "is_initial": false,
                            "is_final": false,
                            "listener": []
                        },
                        {
                            "state_id": "4",
                            "agent_id": "2",
                            "instruction": "Submit the final metrics to the user.",
                            "is_initial": false,
                            "is_final": true,
                            "listener": []
                        }
                    ],
                    "transitions": [
                        {
                            "from_state": "1",
                            "to_state": "2",
                            "condition": "If dataset processing is completed successfully"
                        },
                        {
                            "from_state": "2",
                            "to_state": "3",
                            "condition": "If model training is successful"
                        },
                        {
                            "from_state": "3",
                            "to_state": "4",
                            "condition": "If model evaluation is completed and metrics are ready to report"
                        }
                    ]
                }
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

        // Define glow filter
        const defs = svg.append("defs");

        const glowFilter = defs.append("filter")
                               .attr("id", "glow");

        glowFilter.append("feGaussianBlur")
                  .attr("stdDeviation", "3.5")
                  .attr("result", "coloredBlur");

        const feMerge = glowFilter.append("feMerge");
        feMerge.append("feMergeNode")
               .attr("in", "coloredBlur");
        feMerge.append("feMergeNode")
               .attr("in", "SourceGraphic");

        // Arrow markers for links
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
            .attr('fill', '#0ff')
            .style('filter', 'url(#glow)');

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
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#0ff")
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
    }

    // Load and visualize FSM
    loadFSM();

    // Load running log
    loadLog();
    setInterval(loadLog, 5000);

    // Load current state and highlight node
    function loadCurrentState() {
        fetch('/current_state')
            .then(response => response.json())
            .then(data => {
                const currentState = data.current_state;
                if (currentState && currentHighlightedNode !== currentState) {
                    // Remove highlight from previous node
                    if (currentHighlightedNode) {
                        d3.select(`#node-${currentHighlightedNode}`)
                          .attr("stroke", "#0ff")
                          .attr("stroke-width", 2);
                    }

                    // Highlight current node
                    d3.select(`#node-${currentState}`)
                      .attr("stroke", "yellow")
                      .attr("stroke-width", 4);

                    currentHighlightedNode = currentState;
                }
            });
    }

    setInterval(loadCurrentState, 5000);

    const generateCasesButton = document.getElementById('generate-cases-button');
    const casesResponse = document.getElementById('cases-response');
    const testCasesDisplay = document.getElementById('test-cases');
    const casesSpinner = document.getElementById('cases-spinner');

    generateCasesButton.addEventListener('click', function() {
        casesSpinner.style.display = 'inline-block';
        generateCasesButton.disabled = true;
        generateCasesButton.textContent = 'Processing...';

        fetch('/generate_cases', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            casesResponse.innerText = data.message;
            if(data.status === 'success') {
                loadTestCases();
            }
            casesSpinner.style.display = 'none';
            generateCasesButton.disabled = false;
            generateCasesButton.textContent = 'Generate Test Cases';
        });
    });

    const evolveButton = document.getElementById('evolve-button');
    const evolveResponse = document.getElementById('evolve-response');
    const evolveSpinner = document.getElementById('evolve-spinner');

    evolveButton.addEventListener('click', function() {
        evolveSpinner.style.display = 'inline-block';
        evolveButton.disabled = true;
        evolveButton.textContent = 'Processing...';

        fetch('/evolve', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            evolveResponse.innerText = data.message;
            if(data.status === 'success') {
                loadFSM(); // Reload updated MAS
            }
            evolveSpinner.style.display = 'none';
            evolveButton.disabled = false;
            evolveButton.textContent = 'Evolve Multi-Agent System';
        });
    });

    function loadTestCases() {
        fetch('/get_test_cases')
            .then(response => response.json())
            .then(data => {
                if(data.status === 'error') {
                    testCasesDisplay.innerText = data.message;
                    return;
                }
                testCasesDisplay.innerText = JSON.stringify(data.test_cases, null, 2);
            });
    }

    // Toggle Deploy Section
    const deployToggleButton = document.getElementById('deploy-toggle-button');
    const deploySection = document.getElementById('deploy-section');

    deployToggleButton.addEventListener('click', function() {
        if (deploySection.style.display === 'none' || deploySection.style.display === '') {
            deploySection.style.display = 'block';
            deployToggleButton.textContent = 'Hide Test Runner';
        } else {
            deploySection.style.display = 'none';
            deployToggleButton.textContent = 'Run Test';
        }
    });

    // Similar toggling for other sections like 'Generate Test Cases' and 'Evolve Multi-Agent System'
});

async function loadRunningLog() {
    try {
        const response = await fetch('data/running_log.txt');
        const text = await response.text();
        const logContainer = document.getElementById('running-log');
        logContainer.innerHTML = marked.parse(text);
    } catch (error) {
        console.error('Error loading running log:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadRunningLog);