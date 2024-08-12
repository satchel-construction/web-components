import styles from '../../dist/bundle.css';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Range extends HTMLElement {
  static observedAttributes = ["data-left-name", "data-right-name"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-row p-1">
        <div class="flex flex-col w-3/5 gap-2">
          <p class="text-md pb-2"><slot></slot></p>
          <div class="relative">
            <div id="intersection" class="w-full h-3 rounded-full"></div>
            <input class="range range-xs no-slider appearance-none w-full outline-none absolute m-auto top-0 bottom-0 bg-transparent pointer-events-none" type="range" id="left-range" value="1" min="1" max="5">
            <input class="range range-xs no-slider appearance-none w-full outline-none absolute m-auto top-0 bottom-0 bg-transparent pointer-events-none" type="range" id="right-range" value="5" min="1" max="5">
          </div>
        </div>
        <div class="flex items-center justify-end grow">
          <p id="range-label"></p>
        </div>
      </div>
      <p id="error-message" class="text-error text-sm px-1 hidden"></p>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true))

    this.leftRange = this.shadowRoot.querySelector("#left-range");
    this.rightRange = this.shadowRoot.querySelector("#right-range");
    this.intersection = this.shadowRoot.querySelector("#intersection");
    this.label = this.shadowRoot.querySelector("#range-label");
    this.errorMessage = this.shadowRoot.querySelector("#error-message");

    this.label.innerText = `${this.leftRange.value} - ${this.rightRange.value}`;

    this.bindEvents();
    this.render();
  }

  get error() { return this.errorMessage.innerText; }
  set error(newValue) {
    if (!newValue) this.errorMessage.style.display = "none";
    else this.errorMessage.style.display = "block";

    this.errorMessage.innerText = newValue;
  }

  get value() {
    return [
      +this.leftRange.value,
      +this.rightRange.value
    ];
  }

  set value(newValue) {
    if (!(newValue instanceof Array)) throw "st-range: value must be an array";
    if (newValue.length !== 2) throw "st-range: length of value must be 2";

    this.leftRange.value = +newValue[0];
    this.rightRange.value = +newValue[1];

    this.render();
  }

  render() {
    const diff = this.rightRange.value - this.leftRange.value;
    if (diff <= 0) {
      const initialLeft = this.leftRange.value;
      this.leftRange.value = this.rightRange.value;
      this.rightRange.value = initialLeft;
    }

    this.label.innerText = `${this.leftRange.value} - ${this.rightRange.value}`;

    const data = new FormData();
    data.append(this.leftRange.getAttribute("name"), this.leftRange.value);
    data.append(this.rightRange.getAttribute("name"), this.rightRange.value);

    this._internals.setFormValue(data);
    this.setGradient();
  }

  setGradient() {
    this.intersection.style.background = `linear-gradient(
      to right,
      #0000 0%,
      #0000 ${((this.leftRange.value - 1) / 4) * 100}%,
      var(--fallback-bc, oklch(var(--bc) / 1)) ${((this.leftRange.value - 1) / 4) * 100}%,
      var(--fallback-bc, oklch(var(--bc) / 1)) ${((this.rightRange.value - 1) / 4) * 100}%,
      #0000 ${((this.rightRange.value - 1) / 4) * 100}%,
      #0000 100%)`;
  }

  bindEvents() {
    this.leftRange.addEventListener("input", () => this.render());
    this.rightRange.addEventListener("input", () => this.render());
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "data-left-name") { this.leftRange.setAttribute("name", newValue); } 
    else if (name === "data-right-name") { this.rightRange.setAttribute("name", newValue); }
  }
}
