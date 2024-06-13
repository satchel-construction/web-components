import Input from "./form/input.js";
import TextArea from "./form/textarea.js";
import Rating from "./form/rating.js";
import Range from "./form/range.js";
import Select from "./form/select.js";
import TaggedSelect from "./form/tagged-select.js";

window.customElements.define("st-input", Input);
window.customElements.define("st-textarea", TextArea);
window.customElements.define("st-rating", Rating);
window.customElements.define("st-range", Range);
window.customElements.define("st-select", Select);
window.customElements.define("st-tagged-select", TaggedSelect);

export { Input, TextArea, Rating, Range, Select, TaggedSelect };
