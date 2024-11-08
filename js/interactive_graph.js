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
        // 清空之前的图形
        d3.select("#fsm-graph").selectAll("*").remove();

        // 设置SVG画布
        const svg = d3.select("#fsm-graph")
                      .append("svg")
                      .attr("width", '100%')
                      .attr("height", '600px')
                      .style("background-color", "transparent");

        const width = document.getElementById('fsm-graph').clientWidth;
        const height = document.getElementById('fsm-graph').clientHeight;

        // 定义力模拟
        const simulation = d3.forceSimulation()
                             .force("link", d3.forceLink().id(d => d.id).distance(200))
                             .force("charge", d3.forceManyBody().strength(-1000))
                             .force("center", d3.forceCenter(width / 2, height / 2));

        // 准备节点和链接数据
        const nodes = data.states.states.map(state => ({
            id: state.state_id,
            agent_id: state.agent_id,
            instruction: state.instruction,
            is_initial: state.is_initial,
            is_final: state.is_final
        }));

        const links = data.states.transitions.map(transition => ({
            source: transition.from_state,
            target: transition.to_state,
            condition: transition.condition
        }));

        // 为节点创建索引，方便查找agent信息
        const agentsMap = {};
        data.agents.forEach(agent => {
            agentsMap[agent.agent_id] = agent;
        });

        // 绘制链接
        const link = svg.append("g")
                        .attr("class", "links")
                        .selectAll("line")
                        .data(links)
                        .enter()
                        .append("line")
                        .attr("stroke-width", 2)
                        .attr("stroke", "#999");

        // 绘制节点
        const node = svg.append("g")
                        .attr("class", "nodes")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                        .append("circle")
                        .attr("r", 20)
                        .attr("fill", d => {
                            if (d.is_initial) {
                                return "#4CAF50"; // 初始状态为绿色
                            } else if (d.is_final) {
                                return "#F44336"; // 结束状态为红色
                            } else {
                                return "#2196F3"; // 中间状态为蓝色
                            }
                        })
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended))
                        .on("mouseover", function(event, d) {
                            d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);

                            // 显示提示框
                            tooltip.transition()
                                   .duration(200)
                                   .style("opacity", .9);
                            tooltip.html(`State ID: ${d.id}<br/>Agent: ${agentsMap[d.agent_id].name}`)
                                   .style("left", (event.pageX + 10) + "px")
                                   .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseout", function() {
                            d3.select(this).attr("stroke", null);

                            // 隐藏提示框
                            tooltip.transition()
                                   .duration(500)
                                   .style("opacity", 0);
                        });

        // 绘制节点标签
        const label = svg.append("g")
                         .attr("class", "labels")
                         .selectAll("text")
                         .data(nodes)
                         .enter()
                         .append("text")
                         .attr("dy", -25)
                         .attr("text-anchor", "middle")
                         .text(d => d.id)
                         .attr("font-size", 12)
                         .attr("fill", "#333");

        // 定义提示框
        const tooltip = d3.select("body").append("div")
                          .attr("class", "tooltip")
                          .style("position", "absolute")
                          .style("padding", "8px")
                          .style("background", "rgba(0, 0, 0, 0.8)")
                          .style("color", "#fff")
                          .style("border-radius", "4px")
                          .style("pointer-events", "none")
                          .style("opacity", 0);

        // 力模拟
        simulation
            .nodes(nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

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

    // 加载并可视化FSM
    loadFSM();

});