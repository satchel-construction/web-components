import styles from '../../dist/bundle.css';
import fuzzysort from 'fuzzysort';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Select extends HTMLElement {
  static observedAttributes = ["data-error", "data-options", "data-limit", "placeholder"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();
    this.currentValue;

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-col gap-y-1 select-box">
        <label id="input-field" class="input input-bordered flex flex-col items-center w-full label h-fit !p-0">
          <p id="title" class="text-xs px-2 pt-2 title text-start w-full hidden"><slot></slot></p>
          <div id="divider" class="divider hidden !m-0 title"></div>
          <input id="search" class="w-full self-start px-4 py-2 placeholder:opacity-25" size="1" />
          <div id="divider" class="divider hidden !m-0"></div>
          <ul id="options" class="dropdown-content z-[1] menu p-2 bg-base-100 w-full hidden max-h-72 overflow-scroll flex-nowrap options !p-0 bg-transparent rounded-lg"></ul>
        </label>
        <div class="label !p-0 hidden"><span class="label-text-alt text-error !select-text error-message"></span></div>
      </div>
      <p class="text-error text-sm py-1 hidden" id="error-field"></p>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.search = this.shadowRoot.querySelector("#search");
    this.options = this.shadowRoot.querySelector("#options");
    this.titleElement = this.shadowRoot.querySelector("#title");
    this.errorField = this.shadowRoot.querySelector("#error-field");

    this.inputField = this.shadowRoot.querySelector("#input-field");
    this.hiddenDropdownContent = this.inputField.querySelectorAll(":not(input)");

    /** @type {{ title: string, value: string, chip: string, active?: boolean }[]} */
    this.option_values = [];

    /** @type {number} */
    this.limit = 0;

    this.bindEvents();
  }

  sort() {
    const searchValue = this.search.value;
    if (!searchValue.length) return this.option_values; 

    return fuzzysort.go(searchValue, this.option_values, { keys: ["title", "value"] })
      .map((item) => item.obj);
  }

  render() {
    this.options.innerHTML = "";

    let sorted = this.sort();
    if (!sorted.length) {
      const li = document.createElement("li");

      li.className = "p-2 pb-3 text-center";
      li.innerText = "No results found...";
      this.options.appendChild(li);
    }

    sorted.slice(0, this.limit).forEach((option) => {
      const li = document.createElement("li");
      const anchor = document.createElement("button");

      anchor.innerText = option.title;
      anchor.tabIndex = 0;
      anchor.onclick = () => this.select(option);

      li.appendChild(anchor);
      this.options.appendChild(li);
    });
  }

  /** @param {{ title: string, value: string, chip: string }} option */
  select(option) {
    this.search.value = option.title; 
    this.render();
    this._internals.setFormValue(option.value);
    this.currentValue = option.value;
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "data-error") {
      if (!newValue) {
        this.errorField.style.display = "none";
        this.shadowRoot.querySelector(".input").className = this.shadowRoot.querySelector(".input").className.split(" ").filter((className) => className !== "input-error").join(" ");
        this.titleElement.className = this.titleElement.className.split(" ").filter((className) => className !== "text-error").join(" ");
      } else {
        this.errorField.style.display = "block";
        this.errorField.innerText = newValue;
        this.shadowRoot.querySelector(".input").className += " input-error";
        this.titleElement.className += " text-error";
      }
    } else if (name === "data-options") {
      this.option_values = JSON.parse(newValue);
    } else if (name === "data-limit") {
      this.limit = +newValue;
    } else if (name === "placeholder") {
      this.search.placeholder = newValue;
    }

    this.render();
  }

  get value() {
    return this.currentValue;
  }

  set value(newValue) {
    let option = this.option_values
      .find(o => o.value === newValue);
    if (!option) return;

    this.select(option);
  }

  bindEvents() {
    this.search.addEventListener("keyup", () => this.render());

    this.search.addEventListener("focus", () => {
      this.hiddenDropdownContent.forEach(content => content.style.display = 'flex');
      this.search.style.paddingBottom = '0';
      this.search.style.paddingTop = '0';
    });

    this.addEventListener("focusout", ({ target }) => {
      if (!this.contains(target) && this.options.style.display !== 'none') {
        this.hiddenDropdownContent.forEach(content => content.style.display = 'none');
        this.search.style.paddingBottom = '0.5rem';
        this.search.style.paddingTop = '0.5rem';
      }
    });

    document.addEventListener('mousedown', ({ target }) => {
      if (!this.contains(target) && this.options.style.display !== 'none') {
        this.hiddenDropdownContent.forEach(content => content.style.display = 'none');
        this.search.style.paddingBottom = '0.5rem';
        this.search.style.paddingTop = '0.5rem';
      }
    });
  }
}
