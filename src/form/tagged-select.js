import Select from './select.js';

/**
 * @typedef {Object} Option
 * @property {string} title
 * @property {string} value
 * @property {string} chip
 * @property {boolean|undefined} active
 */

export default class TaggedSelect extends Select {
  constructor() {
    super();

    /** @type {Set<string>} */
    this._tagged = new Set();
    this._tagClick = null;

    this.tagContainer = document.createElement('div');
    this.tagContainer.className = "p-1 flex gap-1 flex-wrap hidden";
    this.shadowRoot.insertBefore(this.tagContainer, this.errorMessage);
  }

  get value() { return this._tagged; }
  set value(newValue) {
    if (!(newValue instanceof Set)) {
      throw "New value is not an instance of `Set`.";
    }

    this._tagged = newValue;
    this._internals.setFormValue(JSON.stringify(Array.from(newValue)));

    this.renderChips();
    this.render();
  }

  get tagClick() { return this._tagClick; }
  set tagClick(newValue) {
    if (typeof newValue !== "function") return;
    this._tagClick = newValue;
  }

  /** @param {Option} option */
  select(option) {
    if (!this._tagged) return;
    this._tagged.add(option.value);
    this.value = this._tagged;
  }

  sort() {
    const accessibleOptions = this._options
      .filter(({ value }) => !this._tagged.has(value));

    if (!this.searchField?.value?.length) return accessibleOptions;

    return fuzzysort.go(
      this.searchField.value,
      accessibleOptions,
      { keys: ["title", "value"] }
    ).map((item) => item.obj);
  }

  /**
   * @param {Option[]} options 
   * @returns {Node[]}
   */
  generateTags(options) {
    return options.map((tag) => {
      const tagElement = document.createElement("div");
      const remove = document.createElement("button");
      const text = document.createElement("p");

      remove.innerText = "x";
      remove.className = "pl-1 text-neutral-content font-bold cursor-pointer outline-none focus:text-error";
      remove.addEventListener("click", (event) => {
        event.stopImmediatePropagation();

        // Remove the chosen tag from the tag list
        const current = Array.from(this._tagged)
          .filter((curr) => curr !== tag.value);

        this.value = new Set(current);
      });

      text.className = "truncate";
      text.innerText = tag.chip;

      tagElement.className = tag.active === false ? "badge badge-ghost max-w-full" : "badge badge-neutral max-w-full";
      tagElement.addEventListener("click", () => this.tagClick(tag));
      tagElement.appendChild(text);
      tagElement.appendChild(remove);

      return tagElement;
    });
  }

  renderChips() {
    // Step 1: Clear the tag container
    this.tagContainer.innerHTML = "";

    // Step 2: Filter the options
    const options = this._options
      .filter(({ value }) => {
        return this._tagged.has(value);
      });

    // Step 3: Hide/Show the tag container
    if (!options.length) this.tagContainer.style.display = "none";
    else this.tagContainer.style.display = "flex";

    // Step 4: Generate tag elements
    const elements = this.generateTags(options);

    // Step 5: Append the elements
    elements.forEach((element) => {
      this.tagContainer.appendChild(element);
    });
  }
}
