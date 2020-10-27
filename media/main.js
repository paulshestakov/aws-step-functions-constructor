(function(window) {
  const vscode = acquireVsCodeApi();

  function makeId() {
    return `${Math.random()}`;
  }

  window.f = function(id, stateName, statePropertyName) {
    const statePropertyValue = document.getElementById(id).value;

    vscode.postMessage({
      command: "STATE_UPDATE",
      data: {
        stateName,
        statePropertyValue,
        statePropertyName
      }
    });
  };

  console.log("JS code is included!");

  function renderObject(data, object) {
    const rows = Object.keys(object).map(key => {
      const value = object[key];
      const id = makeId();
      return `
        <tr class="tooltipTableRow">
          <td>${key}</td>
          <td><input id="${id}" value="${value}" oninput="f('${id}', '${data}', '${key}')"/></td>
        </tr>
      `;
    });
    return `<table>
      ${rows.join("")}
    </table>`;
  }

  window.addEventListener("message", event => {
    console.log("Message arrived");

    const message = event.data;

    switch (message.command) {
      case "UPDATE":
        const { serializedGraph, states } = message.data;

        console.log(serializedGraph);

        const g = new dagreD3.graphlib.json.read(JSON.parse(serializedGraph));

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
        try {
          g.graph().transition = function(selection) {
            return selection.transition().duration(500);
          };

          let isTooltipOpened = false;

          var tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("backgroung-color", "green")
            .attr("class", "tooltip");

          render(inner, g);

          inner.selectAll("g.node").on("click", function(data) {
            if (isTooltipOpened) {
              tooltip.style("visibility", "hidden");

              isTooltipOpened = false;
            } else {
              tooltip
                .style("visibility", "visible")
                .style("top", d3.event.pageY - 10 + "px")
                .style("left", d3.event.pageX + 10 + "px")
                .html(renderObject(data, states[data]));

              isTooltipOpened = true;
            }
          });

          // Center the graph
          var initialScale = 1;

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
        } catch (error) {
          console.log(error);
        }

        break;
    }
  });
})(window);
