class Title extends HTMLElement {
  constructor() {
    super();

    const element = document.createElement("h1");
    element.innerText = "Hello World!";

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(element);
  }
}

window.customElements.define("st-title", Title);
