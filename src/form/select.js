import styles from '../../dist/bundle.css';
import fuzzysort from 'fuzzysort';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

/**
 * @typedef {Object} Option
 * @property {string} title
 * @property {string} value
 * @property {string} chip
 * @property {boolean|undefined} active
 */

function removeClass(original, className) {
  return original
    .split(" ")
    .filter((c) => c !== className)
    .join(" ");
}

export default class Select extends HTMLElement {
  static observedAttributes = ["placeholder", "name"];
  static formAssociated = true;

  constructor() {
    super();

    this._internals = this.attachInternals();
    this._value = null;

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-col gap-y-1 select-box">
        <label id="input-container" class="input input-bordered flex flex-col items-center w-full label h-fit !p-0">
          <p id="title" class="text-xs px-2 pt-2 title text-start w-full hidden"><slot></slot></p>
          <div class="divider hidden !m-0 title"></div>
          <input id="search" class="w-full self-start px-4 py-2 placeholder:opacity-25" size="1" />
          <div class="divider hidden !m-0"></div>
          <ul id="options" class="dropdown-content z-[1] menu p-2 bg-base-100 w-full hidden max-h-72 overflow-scroll flex-nowrap options !p-0 bg-transparent rounded-lg"></ul>
        </label>
        <div class="label !p-0 hidden"><span class="label-text-alt text-error !select-text error-message"></span></div>
      </div>
      <p class="text-error text-sm py-1 hidden" id="error-field"></p>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.searchField = this.shadowRoot.querySelector("input#search");
    this.optionsContainer = this.shadowRoot.querySelector("ul#options");
    this.titleElement = this.shadowRoot.querySelector("p#title");
    this.errorMessage = this.shadowRoot.querySelector("p#error-field");
    this.inputContainer = this.shadowRoot.querySelector("label#input-container");
    this.dropdownContent = this.inputContainer.querySelectorAll(".input :not(input)");

    /** @type {Option[]} */
    this._options = [];
    this._limit = 50;
  }

  get error() { return this.errorMessage.innerText || null; }

  /** @param {string} newValue */
  set error(newValue) {
    if (!newValue) return this.clearErrors();

    this.errorMessage.style.display = "block";
    this.errorMessage.innerText = newValue;
    this.inputContainer.className += " input-error";
    this.titleElement.className += " text-error";

    this.render();
  }

  clearErrors() {
    this.errorMessage.style.display = "none";
    this.inputContainer.className = removeClass(this.inputContainer.className, "input-error");
    this.titleElement.className = removeClass(this.titleElement.className, "text-error");

    this.render();
  }

  /** @param {Option[]} newValue */
  set options(newValue) { 
    this._options = newValue; 
    this.render();
  }

  get limit() { return this._limit; }

  /** @param {number} newValue */
  set limit(newValue) { 
    this._limit = newValue; 
    this.render();
  }

  /** @returns {string} */
  get value() { return this._value; }

  /** @param {string} newValue */
  set value(newValue) {
    if (!newValue) {
      this.searchField.value = ""; 
      this._internals.setFormValue("");
      this._value = "";

      this.render();

      return;
    }

    const option = this._options.find((opt) => opt.value === newValue);
    if (!!option) this.select(option);
  }

  sort() {
    if (!this.searchField.value) return this._options; 

    return fuzzysort.go(
      this.searchField.value, 
      this._options,
      { keys: ["title", "value"] }
    ).map(({ obj }) => obj);
  }

  /**
   * @param {Option[]} value 
   * @returns {Node[]}
   */
  generateOptions(value) {
    /** @type {Node[]} */
    const options = [];
    if (!value?.length) {
      const li = document.createElement("li");

      li.className = "p-2 pb-3 text-center";
      li.innerText = "No results found...";
      options.push(li);

      return options;
    }

    value.slice(0, this.limit).forEach((option) => {
      const li = document.createElement("li");
      const anchor = document.createElement("button");

      anchor.innerText = option.title;
      anchor.tabIndex = 0;
      anchor.onclick = () => this.select(option);

      li.appendChild(anchor);
      options.push(li);
    });

    return options;
  }

  /** @param {Option} option */
  select(option) {
    this.searchField.value = option.title; 
    this._internals.setFormValue(option.value);
    this._value = option.value;

    this.render();
  }

  render() {
    // Step 1: Clear options container
    this.optionsContainer.innerHTML = "";

    // Step 2: Gather sorted options
    const sorted = this.sort();
    
    // Step 3: Create option elements
    const elements = this.generateOptions(sorted);
    
    // Step 4: Insert option elements
    elements.forEach((option) => {
      this.optionsContainer.appendChild(option);
    });
  }

  unravel() {
    this.dropdownContent.forEach((element) => {
      element.style.display = 'flex'
    });

    this.searchField.style.paddingBottom = '0';
    this.searchField.style.paddingTop = '0';
  }

  ravel(event) {
    if (this.contains(event.target)) return;
    if (this.optionsContainer.style.display === "none") return;

    this.dropdownContent.forEach((element) => {
      element.style.display = 'none'
    });

    this.searchField.style.paddingBottom = '0.5rem';
    this.searchField.style.paddingTop = '0.5rem';
  }

  connectedCallback() {
    this.searchField.addEventListener("keyup", () => this.render());
    this.searchField.addEventListener("focus", () => this.unravel());
    this.addEventListener("focusout", (e) => this.ravel(e));
    document.addEventListener('mousedown', (e) => this.ravel(e));
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "placeholder") {
      this.searchField.setAttribute("placeholder", newValue);
    } else if (name === "name") {
      this.searchField.setAttribute("name", newValue);
    }
  }
}
