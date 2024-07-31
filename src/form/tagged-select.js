import Select from './select.js';

export default class TaggedSelect extends Select {
  static observedAttributes = ["data-options", "data-limit", "data-tagged", "data-accessible", "data-error", "placeholder"];

  constructor() {
    super();

    this.tagged = new Set();
    this.accessible = [];
    this._tagClick = () => {};

    this.tags = document.createElement("div");
    this.tags.className = "p-1 flex gap-1 flex-wrap";
    this.shadowRoot.insertBefore(this.tags, this.shadowRoot.querySelector("p#error-field"));
    this.renderChips();
  }

  /** @param {{ title: string, value: string, chip: string, active?: boolean }} option */
  select(option) {
    this.tagged.add(option.value);
    this.setAttribute("data-tagged", JSON.stringify(Array.from(this.tagged)));
  }

  get value() {
    return JSON.parse(this.getAttribute("data-tagged"));
  }

  get tagClick() {
    return this._tagClick;
  }

  set tagClick(cb) {
    if (typeof cb !== "function") return; 
    this._tagClick = cb;
  }

  sort() {
    const searchValue = this.search.value;
    if (!searchValue.length) return this.accessible; 

    return fuzzysort.go(searchValue, this.accessible, { keys: ["title", "value"] })
      .map((item) => item.obj);
  }

  renderChips() {
    this.tags.innerHTML = "";
    const options = this.option_values.filter(option => this.tagged.has(option.value));
    if (!options.length) this.tags.style.display = "none";
    else this.tags.style.display = "flex";

    options.forEach((tag) => {
      const tagElement = document.createElement("div");
      const remove = document.createElement("button");
      const text = document.createElement("p");

      remove.innerText = "x";
      remove.className = "pl-1 text-neutral-content font-bold cursor-pointer outline-none focus:text-error";
      remove.addEventListener("click", (event) => {
        event.preventDefault();
        const tagsWithoutCurr = Array.from(this.tagged).filter((curr) => curr !== tag.value);
        this.setAttribute("data-tagged", JSON.stringify(tagsWithoutCurr));
      });

      text.className = "truncate";
      text.innerText = tag.chip;

      tagElement.className = tag.active === false ? "badge badge-ghost" : "badge badge-neutral";
      tagElement.addEventListener("click", (event) => {
        console.log(event);
        this.tagClick(tag)
      });
      tagElement.appendChild(text);
      tagElement.appendChild(remove);

      this.tags.appendChild(tagElement); 
    });
  }

  setAccessible() {
    const filteredOptions = this.option_values.filter((opt) => !this.tagged.has(opt.value));
    this.setAttribute("data-accessible", JSON.stringify(filteredOptions));
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "data-options") {
      this.option_values = JSON.parse(newValue);
      this.accessible = JSON.parse(newValue);
      this.render("data-options");
    } else if (name === "data-limit") {
      this.limit = +newValue;
      this.render("data-limit");
    } else if (name === "data-tagged") {
      /** @type {Set<string>} */
      this.tagged = new Set(JSON.parse(newValue));
      this._internals.setFormValue(newValue);
      this.renderChips();

      this.setAccessible();
      this.render();
    } else if (name === "data-accessible") {
      this.accessible = JSON.parse(newValue);
    } else if (name === "data-error") {
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
    } else if (name === "placeholder") {
      this.search.placeholder = newValue;
    }
  }
}
