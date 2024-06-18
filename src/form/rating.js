import styles from '../../dist/bundle.css';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Rating extends HTMLElement {
  static observedAttributes = ["data-error", "name", "value"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-row p-1">
        <div class="flex flex-col w-3/5 gap-2">
          <p class="text-md align-middle" id="title"><slot></slot></p>
        </div>
        <div class="flex items-center justify-end grow">
          <div class="rating rating-sm">
            <input type="radio" class="mask mask-star-2 bg-orange-400 rating-item">
            <input type="radio" class="mask mask-star-2 bg-orange-400 rating-item">
            <input type="radio" class="mask mask-star-2 bg-orange-400 rating-item">
            <input type="radio" class="mask mask-star-2 bg-orange-400 rating-item">
            <input type="radio" class="mask mask-star-2 bg-orange-400 rating-item">
          </div>
        </div>
      </div>
      <p class="text-error text-sm px-1 hidden" id="error-field"></p>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.rating_ele = this.shadowRoot.querySelectorAll(".rating-item");
    this.errorField = this.shadowRoot.querySelector("#error-field");

    this.bindEvents();
  }

  get value() {
    return this.getAttribute('value');
  }

  set value(newValue) {
    this.setAttribute('value', newValue);
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "name") {
      this.rating_ele.forEach((element) => element.name = `${newValue}-radio`);
    } else if (name === "value") {
      this.rating_ele.forEach((element, idx) => {
        if (idx !== +newValue - 1) return;
        element.checked = true;
      });

      this._internals.setFormValue(newValue);
    } else if (name === "data-error") {
      if (!newValue) this.errorField.style.display = "none";
      else this.errorField.style.display = "block";

      this.errorField.innerText = newValue;
    }
  }

  bindEvents() {
    this.rating_ele.forEach((element, idx) => {
      element.addEventListener("click", (_) => {
        this.setAttribute("value", +idx + 1);
      });
    });
  }
}
