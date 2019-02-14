(function() {
  const vscode = acquireVsCodeApi();

  console.log("JS code is included!");

  window.addEventListener("message", event => {
    const contentHolderNode = document.getElementById("content");
    console.log("Message arrived");

    const message = event.data;

    // console.log(JSON.stringify(message));

    switch (message.command) {
      case "UPDATE":
        contentHolderNode.innerHTML = message.data;
        break;
    }
  });
})();
