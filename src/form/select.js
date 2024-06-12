import styles from '../../dist/bundle.css';
import { z } from 'zod';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);

export default class Select extends HTMLElement {
  static observedAttributes = ["options"];

  constructor() {
    super();

    const template = document.createElement("template");
    template.innerHTML = `
      <div class="flex flex-col gap-y-1 select-box">
        <label class="input input-bordered flex flex-col items-center w-full label h-fit !p-0">
          <input id="search" class="w-full self-start px-4 py-2" size="1" />
          <input class="hidden" />
          <div id="divider" class="divider hidden !m-0"></div>
          <ul id="options" class="dropdown-content z-[1] menu p-2 bg-base-100 w-full hidden max-h-72 overflow-scroll flex-nowrap options !p-0 bg-transparent"><slot></slot></ul>
        </label>
        <div class="label !p-0"><span class="label-text-alt text-error !select-text error-message"></span></div>
      </div>`;

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.search  = this.shadowRoot.querySelector("#search");
    this.options = this.shadowRoot.querySelector("#options");
    this.divider = this.shadowRoot.querySelector("#divider");

    /** @type {{ title: string, value: string }[]} */
    this.option_values = [];

    this.bindEvents();
  }

  sort() {
    const searchValue = this.searchInput.value;
    const data = this.retrieve();

    if (!!searchValue.length) {
      return fuzzysort.go(searchValue, data, { keys: ["title", "value"] })
        .map((item) => item.obj)
        .slice(0, this.limit);
    }

    return data.slice(0, this.limit); 
  }


  loadOptions() {
    
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === "options") {
      let option_schema = z.array(z.object({ title: z.string(), value: z.string() }));
      let options_parsed = option_schema.safeParse(JSON.parse(newValue));
      
      if (!options_parsed.data) throw "Invalid options";
      this.option_values = options_parsed.data;
    }
  }

  bindEvents() {
    this.search.addEventListener("keyup", () => this.search());

    this.search.addEventListener("focus", () => {
      this.options.style.display = 'flex';
      this.divider.style.display = 'flex';
      this.search.style.paddingBottom = '0';
    });

    document.addEventListener('mousedown', ({ target }) => {
      if (!this.contains(target) && this.options.style.display !== 'none') {
        this.options.style.display = 'none';
        this.divider.style.display = 'none';
        this.search.style.paddingBottom = '0.5rem';
      }
    });
  }
}
