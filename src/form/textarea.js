import styles from '../../dist/bundle.css';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class TextArea extends HTMLElement {
  static observedAttributes = ["placeholder", "name", "value"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="input input-bordered h-full p-0">
        <p id="title" class="text-xs px-2 pt-2 title"><slot></slot></p>
        <div class="divider !m-0 w-full title"></div>
        <textarea class="w-full px-2 pb-2 outline-none bg-transparent min-h-10 -mb-[6px] placeholder:text-base placeholder:opacity-25" autocomplete="off"></textarea>
      </div>
    `;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.innerInput = this.shadowRoot.querySelector("textarea");
    this.innerTitle = this.shadowRoot.querySelector("p#title");

    this.titleElements = this.shadowRoot.querySelectorAll(".title");
    this.titleElements.forEach((element) => element.style.display = "none");
    this.innerInput.style.paddingTop = "8px";
  }

  get value() {
    return this.getAttribute('value');
  }

  set value(newValue) {
    this.setAttribute('value', newValue);
  }

  connectedCallback() {
    this._internals.setFormValue('');
    this.innerInput.addEventListener("focus", () => {
      this.innerInput.style.paddingTop = "0";
      this.titleElements.forEach((element) => element.style.display = "flex");
    });

    this.innerInput.addEventListener("focusout", () => {
      this.innerInput.style.paddingTop = "8px";
      this.titleElements.forEach((element) => element.style.display = "none");
    });

    this.innerInput.addEventListener("input", (event) => {
      this._internals.setFormValue(event.target.value);
    });
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "placeholder") {
      this.innerInput.placeholder = newValue;
    } else if (name === "name") {
      this.innerInput.name = newValue;
      this._internals.setFormValue(newValue);
    } else if (name === "value") {
      this.innerInput.value = newValue;
    }
  }
}
