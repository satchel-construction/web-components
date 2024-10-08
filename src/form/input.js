import styles from '../../dist/bundle.css';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Input extends HTMLElement {
  static observedAttributes = ["placeholder", "name"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="input input-bordered h-full p-0">
        <input autocomplete="off" class="h-10 w-full px-2 py-2 placeholder:opacity-25" autocomplete="off">
      </div>
      <p class="text-error text-sm py-1 hidden" id="error-message"></p>
    `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.inputContainer = this.shadowRoot.querySelector(".input");
    this.inputField = this.shadowRoot.querySelector("input");
    this.errorMessage = this.shadowRoot.querySelector("#error-message");

    this.shadowRoot.querySelectorAll(".input :not(input)").forEach((element) => {
      element.style.display = "none";
    });

    this.bindEvents();
  }

  get value() { return this.inputField.value; }
  set value(newValue) {
    this.inputField.value = newValue;
    this._internals.setFormValue(newValue);
  }

  get error() { return this.errorMessage.innerText || null; }
  set error(newValue) {
    if (!newValue) return this.clearErrors();

    this.errorMessage.style.display = "block";
    this.errorMessage.innerText = newValue;
    this.inputContainer.className += " input-error";
  }

  clearErrors() {
    this.errorMessage.style.display = "none";
    this.inputContainer.className = this.inputContainer.className
      .split(" ").filter((className) => className !== "input-error").join(" ");
  }

  bindEvents() {
    this.inputField.addEventListener("focus", () => {
      this.shadowRoot.querySelectorAll(".input :not(input)")
        .forEach((element) => {
          element.style.display = "flex"
        });
    });

    this.inputField.addEventListener("focusout", () => {
      this.shadowRoot.querySelectorAll(".input :not(input)")
        .forEach((element) => element.style.display = "none");
    });

    this.inputField.addEventListener("input", (event) => {
      this._internals.setFormValue(event.target.value);
    });
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "placeholder") { this.inputField.setAttribute("placeholder", newValue); }
    else if (name === "name") { this.inputField.setAttribute("name", newValue); }
  }
}
