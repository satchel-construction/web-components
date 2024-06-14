import Select from './select.js';

export default class TaggedSelect extends Select {
  static observedAttributes = ["data-options", "data-limit", "data-tagged", "data-accessible", "placeholder"];

  constructor() {
    super();

    this.tagged = [];
    this.accessible = [];

    this.tags = document.createElement("div");
    this.tags.className = "p-1 flex gap-1 flex-wrap";
    this.shadowRoot.appendChild(this.tags);
  }

  /** @param {{ title: string, value: string, chip: string }} option */
  select(option) {
    this.tagged.push(option.value);
    this.setAttribute("data-tagged", JSON.stringify(this.tagged));
  }

  sort() {
    const searchValue = this.search.value;
    if (!searchValue.length) return this.accessible; 

    return fuzzysort.go(searchValue, this.accessible, { keys: ["title", "value"] })
      .map((item) => item.obj);
  }

  renderChips() {
    this.tags.innerHTML = "";
    this.tagged.forEach((tag) => {
      const tagElement = document.createElement("div");
      const remove = document.createElement("button");

      remove.innerText = "x";
      remove.className = "pl-1 text-neutral-content font-bold cursor-pointer outline-none focus:text-error";
      remove.onclick = () => {
        const tagsWithoutCurr = this.tagged.filter((item) => item !== tag);
        this.setAttribute("data-tagged", JSON.stringify(tagsWithoutCurr));
      }

      tagElement.className = "badge badge-neutral";
      tagElement.innerText = tag.chip;
      tagElement.appendChild(remove);

      this.tags.appendChild(tagElement); 
    });
  }

  setAccessible() {
    const taggedSet = new Set(this.tagged);
    const filteredOptions = this.option_values.filter((opt) => !taggedSet.has(opt.value));
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
      /** @type {string[]} */
      this.tagged = JSON.parse(newValue);  
      this.renderChips();

      this.setAccessible();
      this.render();
    } else if (name === "data-accessible") {
      this.accessible = JSON.parse(newValue);
    } else if (name === "placeholder") {
      this.search.placeholder = newValue;
    }
  }
}
