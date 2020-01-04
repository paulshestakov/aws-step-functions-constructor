(function() {
  const vscode = acquireVsCodeApi();

  console.log("JS code is included!");

  window.addEventListener("message", event => {
    console.log("Message arrived");

    const message = event.data;

    switch (message.command) {
      case "UPDATE":
        const g = new dagreD3.graphlib.json.read(JSON.parse(message.data));

        console.log(message.data);

        var svg = d3.select("svg"),
          inner = svg.select("g");
        // Set up zoom support
        var zoom = d3.zoom().on("zoom", function() {
          inner.attr("transform", d3.event.transform);
        });
        svg.call(zoom);
        // Create the renderer
        var render = new dagreD3.render();
        // Run the renderer. This is what draws the final graph.
        render(inner, g);
        // Center the graph
        var initialScale = 1;

        // svg.attr("width", g.graph().width * initialScale + 40);
        // svg.attr("height", g.graph().height * initialScale + 40);

        var body = document.getElementById("body");

        const svgWidth = +svg.style("width").slice(0, -2);
        const svgHeight = +svg.style("height").slice(0, -2);

        svg.call(
          zoom.transform,
          d3.zoomIdentity
            .translate(
              (svgWidth - g.graph().width * initialScale) / 2,
              (svgHeight - g.graph().height * initialScale) / 2
            )
            .scale(initialScale)
        );
        bre;
        break;
    }
  });
})();
