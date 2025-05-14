d3.csv("Eco_clean.csv").then(data => {
  const svg = d3.select("svg");
  const width = +svg.node().clientWidth;
  const height = +svg.attr("height");
  const zoomG = svg.append("g");

  svg.call(d3.zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", (event) => zoomG.attr("transform", event.transform))
  );

  // Step 1: Set up radio button event listener
  document.querySelectorAll('input[name="viewMode"]').forEach(input => {
    input.addEventListener("change", updateVisualization);
  });

  // Initial render with "Collaborations"
  updateVisualization();

  function updateVisualization() {
    const selectedOption = document.querySelector('input[name="viewMode"]:checked').value;

    // Step 2: Extract nodes based on selected option (Collaborations or Themes)
    const orgMap = new Map(); // store category per org
    data.forEach(row => {
      const org = row["Organization.Name"]?.trim();
      if (org) {
        orgMap.set(org, row["Category"]?.trim() || "Unknown");
      }
      const column = selectedOption === "theme" ? "THEMES" : "Collaborations";
      if (row[column]) {
        row[column]
          .split(/;\s*/)
          .map(name => name.trim())
          .forEach(item => {
            if (item && !orgMap.has(item)) {
              orgMap.set(item, "Unknown");
            }
          });
      }
    });

    const nodes = Array.from(orgMap.entries()).map(([name, category]) => ({
      id: name,
      category: category
    }));

    // Step 3: Create edges based on selected option
    const edges = [];
    data.forEach(row => {
      const source = row["Organization.Name"]?.trim();
      if (source) {
        const column = selectedOption === "theme" ? "THEMES" : "Collaborations";
        if (row[column]) {
          const collaborators = row[column]
            .split(/;\s*/)
            .map(name => name.trim())
            .filter(name => name && name !== source);

          collaborators.forEach(target => {
            edges.push({ source, target });
          });
        }
      }
    });

    // Step 4: Color scale by category
    const colorScale = d3.scaleOrdinal()
      .domain([
        "Health and Education",
        "NGO",
        "Union",
        "Alternative Education",
        "External Contractor",
        "Yukon Government",
        "Post-Secondary Institution",
        "Yukon FN Entities",
        "Yukon Government - FNSB",
        "Yukon Government - Education",
        "Unknown"
      ])
      .range([
        "#1f77b4", // Health and Education - blue
        "#ff7f0e", // NGO - orange
        "#000", // Union - black
        "#2ca02c", // Alternative Education - green
        "#d62728", // External Contractor - red
        "#9467bd", // Yukon Government - purple
        "#8c564b", // Post-Secondary Institution - brown
        "#e377c2", // Yukon FN Entities - pink
        "#17becf", // Yukon Government - FNSB - cyan
        "#bcbd22", // Yukon Government - Education - yellow-green
        "#7f7f7f"  // Unknown - grey
      ]);

    // Step 5: Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(1300))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(100))
      .on("tick", ticked);

    // Clear previous SVG content
    zoomG.selectAll("*").remove();

    // Draw links
const link = zoomG.append("g")
  .attr("fill", "none")
  .attr("stroke", "#aaa")
  .attr("stroke-opacity", 0.6)
  .selectAll("path")
  .data(edges)
  .enter().append("path")
  .attr("stroke-width", 1.8); // Thin arc lines

    // Draw nodes
    const circle = zoomG.selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", d => d.category === "Unknown" ? 20 : 95)
      .attr("fill", d => colorScale(d.category))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add labels
// Add labels (skip grey "Unknown" nodes)
const label = zoomG.selectAll("text")
  .data(nodes.filter(d => d.category !== "Unknown")) // Only non-grey nodes
  .enter()
  .append("text")
  .text(d => d.id)
  .attr("text-anchor", "middle")
  .attr("dy", 4)
  .style("font-size", "20px")
  .attr("fill", "#fff")
  .attr("pointer-events", "none");
function ticked() {
  // Use SVG arc paths for curves
  link.attr("d", d => {
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const dr = Math.sqrt(dx * dx + dy * dy); // arc radius
    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
  });

  circle
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
});


