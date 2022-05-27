import { render, html } from 'lit';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

import { runBenchmarkIfRequested } from '../../lib/benchmark.js';

const firstVisibleResult = document.querySelector("#first-visible");
const lastVisibleResult = document.querySelector("#last-visible");
const handleVisibilityChange = (e) => {
    firstVisibleResult.innerHTML = e.first;
    lastVisibleResult.innerHTML = e.last;
}

const example = (contacts) => html`
    <section @visibilityChanged=${handleVisibilityChange}>
        ${virtualize({
            items: contacts,
            renderItem: ({ mediumText, index }) =>
                html`<div style="border-top: 3px solid blue; border-bottom: 3px dashed red; width: 100%;">${index}) ${mediumText}</div>`
        })}
    </section>
`;

(async function go() {
    const contacts = await(await fetch('../shared/contacts.json')).json();
    const container = document.querySelector("#container");
    render(example(contacts), container);
    runBenchmarkIfRequested(container.querySelector('section'));
})();