import styles from '../../dist/bundle.css';
import fuzzysort from 'fuzzysort';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Select extends HTMLElement {
  static observedAttributes = ["data-options", "data-limit", "placeholder"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-col gap-y-1 select-box">
        <label class="input input-bordered flex flex-col items-center w-full label h-fit !p-0">
          <p id="title" class="text-xs px-2 pt-2 title text-start w-full hidden"><slot></slot></p>
          <div id="divider" class="divider hidden !m-0 title"></div>
          <input id="search" class="w-full self-start px-4 py-2 placeholder:opacity-25" size="1" />
          <input class="hidden" />
          <div id="divider" class="divider hidden !m-0"></div>
          <ul id="options" class="dropdown-content z-[1] menu p-2 bg-base-100 w-full hidden max-h-72 overflow-scroll flex-nowrap options !p-0 bg-transparent rounded-lg"></ul>
        </label>
        <div class="label !p-0 hidden"><span class="label-text-alt text-error !select-text error-message"></span></div>
      </div>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.search  = this.shadowRoot.querySelector("#search");
    this.options = this.shadowRoot.querySelector("#options");
    this.dividers = this.shadowRoot.querySelectorAll(".divider");
    this.titleElement = this.shadowRoot.querySelector("#title");

    /** @type {{ title: string, value: string, chip: string }[]} */
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
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "data-options") {
      this.option_values = JSON.parse(newValue);
    } else if (name === "data-limit") {
      this.limit = +newValue;
    } else if (name === "placeholder") {
      this.search.placeholder = newValue;
    }

    this.render();
  }

  bindEvents() {
    this.search.addEventListener("keyup", () => this.render());

    this.search.addEventListener("focus", () => {
      this.options.style.display = 'flex';
      this.titleElement.style.display = 'flex';
      this.dividers.forEach(divider => divider.style.display = 'flex');
      this.search.style.paddingBottom = '0';
      this.search.style.paddingTop = '0';
    });

    this.addEventListener("blur", () => {
      this.options.style.display = 'none';
      this.titleElement.style.display = 'none';
      this.dividers.forEach(divider => divider.style.display = 'none');
      this.search.style.paddingBottom = '0.5rem';
      this.search.style.paddingTop = '0.5rem';
    });

    document.addEventListener('mousedown', ({ target }) => {
      if (!this.contains(target) && this.options.style.display !== 'none') {
        this.options.style.display = 'none';
        this.titleElement.style.display = 'none';
        this.dividers.forEach(divider => divider.style.display = 'none');
        this.search.style.paddingBottom = '0.5rem';
        this.search.style.paddingTop = '0.5rem';
      }
    });
  }
}
