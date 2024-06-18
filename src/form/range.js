import { z } from 'zod';
import styles from '../../dist/bundle.css';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Range extends HTMLElement {
  static observedAttributes = ["data-error", "start-name", "end-name"];
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
            <div class="range-intersect w-full h-3 rounded-full"></div>
            <input type="range" value="1" min="1" max="5" class="range range-xs no-slider range-start appearance-none w-full outline-none absolute m-auto top-0 bottom-0 bg-transparent pointer-events-none">
            <input type="range" value="5" min="1" max="5" class="range range-xs no-slider range-end appearance-none w-full outline-none absolute m-auto top-0 bottom-0 bg-transparent pointer-events-none">
          </div>
        </div>
        <div class="flex items-center justify-end grow">
          <p class="range-label"></p>
        </div>
      </div>
      <p id="error-field" class="text-error text-sm px-1 hidden"></p>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true))

    this.range_start = this.shadowRoot.querySelector("input.range-start");
    this.range_end = this.shadowRoot.querySelector("input.range-end");

    this.intersect = this.shadowRoot.querySelector("div.range-intersect");
    this.label = this.shadowRoot.querySelector("p.range-label");
    this.errorField = this.shadowRoot.querySelector("#error-field");

    this.range_start.setAttribute("name", this.getAttribute("start-name"));
    this.range_end.setAttribute("name", this.getAttribute("end-name"));

    this.label.innerText = `${this.range_start.value} - ${this.range_end.value}`;

    this.bindEvents();
    this.setGradient();
  }

  get value() {
    return [
      this.range_start.value,
      this.range_end.value
    ];
  }

  set value(newValue) {
    let schema = z.array(z.number()).length(2);
    let json = JSON.parse(newValue);

    let response = schema.safeParse(json);
    if (!response.data) return;

    this.range_start.value = response.data[0];
    this.range_end.value = response.data[1];
    this.update();
  }

  update() {
    const [start, end] = [this.range_start.value, this.range_end.value];
    if ((end - start) <= 0) {
      this.range_start.value = end;
      this.range_end.value = start;
    }

    this.label.innerText = `${start} - ${end}`;

    const data = new FormData();
    data.append(this.getAttribute("start-name"), start);
    data.append(this.getAttribute("end-name"), end);

    this._internals.setFormValue(data);
    this.setGradient();
  }

  bindEvents() {
    this.range_start.addEventListener("input", () => this.update());
    this.range_end.addEventListener("input", () => this.update());
  }

  setGradient() {
    this.intersect.style.background = `linear-gradient(
      to right,
      #0000 0%,
      #0000 ${((this.range_start.value - 1) / 4) * 100}%,
      var(--fallback-bc, oklch(var(--bc) / 1)) ${((this.range_start.value - 1) / 4) * 100}%,
      var(--fallback-bc, oklch(var(--bc) / 1)) ${((this.range_end.value - 1) / 4) * 100}%,
      #0000 ${((this.range_end.value - 1) / 4) * 100}%,
      #0000 100%)`;
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "data-error") {
      if (!newValue) this.errorField.style.display = "none";
      else this.errorField.style.display = "block";

      this.errorField.innerText = newValue;
    }
  }
}
