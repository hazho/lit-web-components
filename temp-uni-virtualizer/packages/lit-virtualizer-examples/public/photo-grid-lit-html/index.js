import {html, render} from 'lit';
import {virtualize} from '@lit-labs/virtualizer/virtualize.js';
import {virtualizerRef} from '@lit-labs/virtualizer/Virtualizer.js';
import {GridLayout} from '@lit-labs/virtualizer/layouts/grid.js';
import {FlexWrapLayout} from '@lit-labs/virtualizer/layouts/flexWrap.js';
import {getUrl, getPhotos} from '../../lib/flickr.js';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-slider';
import '@material/mwc-textfield';
import '@material/mwc-formfield';
import '@material/mwc-radio';

///

const renderPhoto = photo => {
    const url = photo.id === 'TEMP' ? '' : getUrl(photo);
    return html`<img src=${url} style="width: 200px; height: 200px;" />`;
}

///

const renderBox = (item, idx) => {
    return html`<div class="box">${idx}</div>`;
}

///

const state = {
    open: false,
    showRange: false,
    items: [],
    direction: 'vertical',
    idealSize: 300,
    gap: 8,
    query: 'sunset',
    Layout: /*GridLayout,*/FlexWrapLayout,
    layout: null,
    first: 0,
    last: 0,
    firstVisible: 0,
    lastVisible: 0
}

function setState(changes) {
    let changed;
    for (let prop in changes) {
        if (changes[prop] !== state[prop]) {
            changed = true;
            break;
        }
    }
    if (changed) {
        Object.assign(state, changes);
        render(renderExample(), document.body);    
    }
    // especially hacky
    // if (changes.Layout) {
    //     updateItemSizes(state.items);
    // }
    
}

function renderExample() {
    let {open, showRange, items, direction, idealSize, gap, query, Layout, layout, first, last, firstVisible, lastVisible} = state;
    return html`
<style>
    body {margin: 0; height: 100vh;}
    .appLayout {height: 100%; display: flex; flex-direction: column;}
    .appBody {flex: 1; display: flex;}
    .sheet {width: 0; border-right: 1px solid #DDD; transition: width 0.25s ease-out;}
    .controls {display: flex; flex-direction: column; width: 256px; transform: translateX(-256px); transition: transform 0.25s ease-out;}
    .controls > * {display: block; margin: 8px;}
    .virtualizer {flex: 1;}
    .virtualizer > * {transition: all 0.25s;}
    .virtualizer img {object-fit: cover;}
    .open .controls {transform: translateX(0);}
    .open .sheet {width: 256px;}
    .box {background: #DDD;}
    .sheet {font-family: Roboto, sans-serif; font-size: 0.75rem; font-weight: 400; color: rgba(0, 0, 0, 0.6);}
    mwc-formfield {display: block;}
</style>
<div class="appLayout${open ? ' open' : ''}">
    <mwc-top-app-bar>
        <mwc-icon-button slot="navigationIcon" @click=${() => setState({open: !open})}>
            <svg slot="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><use xlink:href="#settings"></use></svg>
        </mwc-icon-button>
        <div slot="title">lit-virtualizer grid layouts</div>
    </mwc-top-app-bar>
    <div class="appBody">
        <div class="sheet">
            <div class="controls">
                <mwc-textfield label="Ideal Size" type="number" min="50" max="500" step="5" .value=${idealSize} @input=${(e) => setState({idealSize: e.target.value})}></mwc-textfield>
                <mwc-textfield label="Gap" type="number" min="0" max="100" step="1" .value=${gap} @input=${(e) => setState({gap: e.target.value})}></mwc-textfield>
                <mwc-textfield label="Search Query" .value=${query} @change=${(e) => search(e.target.value)}></mwc-textfield>
                <fieldset @change=${e => setState({direction: e.target.value})}>
                    <legend>Direction</legend>
                    <mwc-formfield label="vertical">
                        <mwc-radio name="direction" value="vertical" ?checked=${direction === 'vertical'}></mwc-radio>
                    </mwc-formfield>
                    <mwc-formfield label="horizontal">
                        <mwc-radio name="direction" value="horizontal" ?checked=${direction === 'horizontal'}></mwc-radio>
                    </mwc-formfield>
                </fieldset>
                <fieldset @change=${e => setState({Layout: e.target.value})}>
                    <legend>Layout</legend>
                    <mwc-formfield label="Fixed aspect grid">
                        <mwc-radio name="layout" .value=${GridLayout} ?checked=${Layout === GridLayout}></mwc-radio>
                    </mwc-formfield>
                    <mwc-formfield label="Flex wrap">
                        <mwc-radio name="layout" .value=${FlexWrapLayout} ?checked=${Layout === FlexWrapLayout}></mwc-radio>
                    </mwc-formfield>
                </fieldset>
                <details ?open=${showRange} @toggle=${e => setState({showRange: e.target.open})}>
                    <summary>Range</summary>
                    ${showRange ? html`
                        <p>Physical: ${first} to ${last}</p>
                        <p>Visible: ${firstVisible} to ${lastVisible}</p>` : ''
                    }
                </details>
            </div>
        </div>
        <div class="virtualizer"
            @rangeChanged=${(e) => {
                if (showRange) {
                    const {first, last} = e;
                    setState({first, last});
                }
            }}
            @visibilityChanged=${(e) => {
                if (showRange) {
                    const {first, last} = e;
                    setState({firstVisible: first, lastVisible: last});
                }
            }}
        >
            ${virtualize({items, renderItem, scroller: true, layout: {
                type: Layout,
                itemSize: { width: `${idealSize}px`, height: `${Math.round(4/4*idealSize)}px`},
                flex: { preserve: 'aspect-ratio' },
                justify: 'space-around',
                padding: '0',
                gap: Layout === GridLayout && false
                    ? direction === 'vertical'
                        ? `auto ${gap}px`
                        : `${gap}px auto`
                    : `${gap}px`,
                direction
            }})}
        </div>
    </div>
</div>


<svg width="0" height="0" class="screen-reader">
    <defs>
        <path id="settings" d="M19.14 12.936c.036-.3.06-.612.06-.936s-.024-.636-.072-.936l2.028-1.584a.496.496 0 0 0 .12-.612l-1.92-3.324c-.12-.216-.372-.288-.588-.216l-2.388.96a7.03 7.03 0 0 0-1.62-.936l-.36-2.544a.48.48 0 0 0-.48-.408h-3.84a.467.467 0 0 0-.468.408l-.36 2.544a7.219 7.219 0 0 0-1.62.936l-2.388-.96a.475.475 0 0 0-.588.216l-1.92 3.324a.465.465 0 0 0 .12.612l2.028 1.584c-.048.3-.084.624-.084.936s.024.636.072.936L2.844 14.52a.496.496 0 0 0-.12.612l1.92 3.324c.12.216.372.288.588.216l2.388-.96a7.03 7.03 0 0 0 1.62.936l.36 2.544c.048.24.24.408.48.408h3.84c.24 0 .444-.168.468-.408l.36-2.544a7.219 7.219 0 0 0 1.62-.936l2.388.96c.216.084.468 0 .588-.216l1.92-3.324a.465.465 0 0 0-.12-.612l-2.004-1.584zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6z"/>
    </defs>
</svg>

`};


///

const offline = false;
const mock = offline;
const renderItem = offline ? renderBox : renderPhoto;

function itemSizes(items) {
    return items.reduce((obj, item, idx) => { obj[idx] = { width: item.width_o, height: item.height_o }; return obj; }, {});
}

function updateItemSizes(items) {
    const layout = document.querySelector('.virtualizer')[virtualizerRef].layout;
    if (layout && typeof layout.updateItemSizes === 'function') {
       layout.updateItemSizes(itemSizes(items));
    }
}

const placeholder = () => {
    return {id: "TEMP"};
}

const callback = items => {
    setState({ items });
}

async function search(query) {
    const items = await getPhotos(query, placeholder, callback, mock);
    // for (let i = 0; i < items.length; i++) {
    //     console.log(items[i]);
    // }
    setState({items});
    // updateItemSizes(items);
}

render(renderExample(), document.body);
search(state.query);

// <!-- ${renderPhotos(items)} -->
// <!-- ${renderBoxes(items)} -->
// <!-- ${renderGridStyles()} -->
// <!-- ${renderFlexWrapStyles()} -->