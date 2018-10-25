<template>
    <div id="app">
        <router-view></router-view>
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="manifest" href="/manifest.json">
        <meta name="msapplication-TileColor" content="#ffffff">
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
        <meta name="theme-color" content="#ffffff">
    </div>
</template>

<script>
    /*    require('materialize-css/dist/css/materialize.css');*/
    export default {
        name: 'memosyne',
        components: {},
        methods: {},
        mounted() {
        }
    }
</script>

<style lang="scss">
    $primary-color: #90a4ae;
    $primary-color-light: #c1d5e0;
    $primary-color-dark: #62757f;

    $secondary-color: #a1887f;
    $secondary-color-light: #d3b8ae;
    $secondary-color-dark: #725b53;

    .button-row {
        display: flex;
        align-items: flex-end;
    }
    .button-row > * {
    }

    .SMALL_NODE {
        width: 10vw;
    }

    .MEDIUM_NODE {
        width: 30vw;
    }

    .LARGE_NODE {
        width: 50vw;
    }

    @import '../../node_modules/materialize-css/dist/css/materialize.css';

    .material-icons {
        color: $secondary-color-dark;
    }

    button:focus {
        background-color: transparent;
    }

    .source-node:hover {
        -webkit-box-shadow: 1px 1px;
        -moz-box-shadow: 1px 1px;
        box-shadow: 1px 1px;
    }

    .navbar {
        background-color: $primary-color-dark;
        color: white;
    }

    .navbar > * {
        margin: 5px;
    }

    .btn, .btn-floating {
        transition: background-color .25s;
        background-color: $secondary-color-dark;
    }

    .btn:hover, .btn-floating:hover {
        background-color: $secondary-color;
    }

    #email:focus, #password:focus {
        border-bottom: $secondary-color;
        box-shadow: 0 1px 0 0 $secondary-color;
    }

    .collection {
        /*        background-color: $secondary-color;*/
        flex: 1;
    }

    .collection > li.collection-item {
        background-color: $secondary-color;
        color: black;
        line-height: 0;
        padding: 10px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom: 1px solid !important;
    }

    /* CSS */
    *, *:focus {
        outline: none;
    }

    .nucleus {
        border: solid black;
        height: fit-content;
        display: flex;
        flex-flow: column nowrap;
        align-self: center;
        /* Let's see if hardcoding the width like this is beneficial */
        min-width: 300px;
        width: auto;

    }

    .nucleus.persisted {
        border-color: $primary-color;
    }

    .nucleus:not(.persisted) {
        border-color: $secondary-color;
    }

    .node-textarea {
        min-height: 20px;
    }

    .node-markdown {
        flex: 1;
    }

    @import url(http://fonts.googleapis.com/css?family=Inconsolata);
    @import url(http://fonts.googleapis.com/css?family=PT+Sans);
    @import url(http://fonts.googleapis.com/css?family=PT+Sans+Narrow:400,700);
    article,
    aside,
    details,
    figcaption,
    figure,
    footer,
    header,
    hgroup,
    nav,
    section,
    summary {
        display: block;
    }

    audio,
    canvas,
    video {
        display: inline-block;
    }

    audio:not([controls]) {
        display: none;
        height: 0;
    }

    [hidden] {
        display: none;
    }

    html {
        font-family: sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
    }

    body {
        margin: 0;
    }

    a:focus {
        outline: thin dotted;
    }

    a:active,
    a:hover {
        outline: 0;
    }

    h1 {
        font-size: 2em;
    }

    abbr[title] {
        border-bottom: 1px dotted;
    }

    b,
    strong {
        font-weight: bold;
    }

    dfn {
        font-style: italic;
    }

    mark {
        background: #ff0;
        color: #000;
    }

    code,
    kbd,
    pre,
    samp {
        font-family: monospace, serif;
        font-size: 1em;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    q {
        quotes: "\201C" "\201D" "\2018" "\2019";
    }

    small {
        font-size: 80%;
    }

    sub,
    sup {
        font-size: 75%;
        line-height: 0;
        position: relative;
        vertical-align: baseline;
    }

    sup {
        top: -0.5em;
    }

    sub {
        bottom: -0.25em;
    }

    img {
        border: 0;
    }

    svg:not(:root) {
        overflow: hidden;
    }

    figure {
        margin: 0;
    }

    fieldset {
        border: 1px solid #c0c0c0;
        margin: 0 2px;
        padding: 0.35em 0.625em 0.75em;
    }

    legend {
        border: 0;
        padding: 0;
    }

    button,
    input,
    select,
    textarea {
        font-family: inherit;
        font-size: 100%;
        margin: 0;
    }

    button,
    input {
        line-height: normal;
    }

    button,
    html input[type="button"],
    input[type="reset"],
    input[type="submit"] {
        -webkit-appearance: button;
        cursor: pointer;
    }

    button[disabled],
    input[disabled] {
        cursor: default;
    }

    input[type="checkbox"],
    input[type="radio"] {
        box-sizing: border-box;
        padding: 0;
    }

    input[type="search"] {
        -webkit-appearance: textfield;
        -moz-box-sizing: content-box;
        -webkit-box-sizing: content-box;
        box-sizing: content-box;
    }

    input[type="search"]::-webkit-search-cancel-button,
    input[type="search"]::-webkit-search-decoration {
        -webkit-appearance: none;
    }

    button::-moz-focus-inner,
    input::-moz-focus-inner {
        border: 0;
        padding: 0;
    }

    textarea {
        overflow: auto;
        vertical-align: top;
    }

    table {
        border-collapse: collapse;
        border-spacing: 0;
    }

    html {
        font-family: 'PT Sans', sans-serif;
    }

    pre,
    code {
        font-family: 'Inconsolata', sans-serif;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        font-family: 'PT Sans Narrow', sans-serif;
        font-weight: 700;
    }

    html {
        background-color: #eee8d5 !important;
        color: #657b83;
        /*        margin: 1em;*/
    }

    body {
        background-color: #fdf6e3 !important;
        margin: 0 auto;
        /*        max-width: 23cm;*/
        border: 1pt solid #93a1a1;
        /*        padding: 1em;*/
    }

    .card-panel {
        background-color: #fdf6e3 !important;
    }

    code {
        background-color: #eee8d5 !important;
        padding: 2px;
    }

    a {
        color: #b58900;
    }

    a:visited {
        color: #cb4b16;
    }

    a:hover {
        color: #cb4b16;
    }

    h1 {
        color: #d33682;
    }

    h2,
    h3,
    h4,
    h5,
    h6 {
        color: #859900;
    }

    pre {
        background-color: #fdf6e3 !important;
        color: #657b83;
        border: 1pt solid #93a1a1;
        padding: 1em;
        box-shadow: 5pt 5pt 8pt #eee8d5;
    }

    pre code {
        background-color: #fdf6e3 !important;
    }

    h1 {
        font-size: 2.8em;
    }

    h2 {
        font-size: 2.4em;
    }

    h3 {
        font-size: 1.8em;
    }

    h4 {
        font-size: 1.4em;
    }

    h5 {
        font-size: 1.3em;
    }

    h6 {
        font-size: 1.15em;
    }

    .tag {
        background-color: #eee8d5;
        color: #d33682;
        padding: 0 0.2em;
    }

    .todo,
    .next,
    .done {
        color: #fdf6e3;
        background-color: #dc322f;
        padding: 0 0.2em;
    }

    .tag {
        -webkit-border-radius: 0.35em;
        -moz-border-radius: 0.35em;
        border-radius: 0.35em;
    }

    .TODO {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #2aa198;
    }

    .NEXT {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #268bd2;
    }

    .ACTIVE {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #268bd2;
    }

    .DONE {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #859900;
    }

    .WAITING {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #cb4b16;
    }

    .HOLD {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #d33682;
    }

    .NOTE {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #d33682;
    }

    .CANCELLED {
        -webkit-border-radius: 0.2em;
        -moz-border-radius: 0.2em;
        border-radius: 0.2em;
        background-color: #859900;
    }

    /**
    BEGIN ANIMATIONS
     */
    .cbutton {
        position: relative;
        padding: 0;
        border: none;
        background: none;
        color: $secondary-color-dark;
        font-size: 1.4em;
        overflow: visible;
        -webkit-transition: color 0.7s;
        transition: color 0.7s;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    }

    .cbutton.cbutton--click,
    .cbutton:focus {
        outline: none;
        color: $secondary-color-dark;
    }

    .cbutton__icon {
        display: block;
    }

    .cbutton__text {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .cbutton::after {
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -35px 0 0 -35px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        content: '';
        opacity: 0;
        pointer-events: none;
    }

    /* Simo */
    .cbutton--effect-simo::before {
        position: absolute;
        top: 50%;
        left: -20px;
        margin: -4px 0 0 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(111, 148, 182, 0.3);
        content: '';
        opacity: 0;
        -webkit-transform-origin: 35px 50%;
        transform-origin: 35px 50%;
    }

    .cbutton--effect-simo::after {
        border: 8px solid rgba(111, 148, 182, 0.1);
    }

    .cbutton--effect-simo.cbutton--click::after {
        -webkit-animation: anim-effect-simo-1 5s forwards;
        animation: anim-effect-simo-1 5s forwards;
    }

    .cbutton--effect-simo.cbutton--click::before {
        -webkit-animation-name: anim-effect-simo-2, anim-effect-simo-3;
        animation-name: anim-effect-simo-2, anim-effect-simo-3;
        -webkit-animation-duration: 5s, 0.4s;
        animation-duration: 5s, 0.4s;
        -webkit-animation-iteration-count: 1, infinite;
        animation-iteration-count: 1, infinite;
        -webkit-animation-timing-function: ease, linear;
        animation-timing-function: ease, linear;
        -webkit-animation-fill-mode: forwards;
        animation-fill-mode: forwards;
    }

    @-webkit-keyframes anim-effect-simo-1 {
        0%, 100% {
            -webkit-transform: scale3d(0, 0, 1);
            transform: scale3d(0, 0, 1);
            opacity: 0;
        }
        5%, 95% {
            opacity: 1;
            -webkit-transform: scale3d(1, 1, 1);
            transform: scale3d(1, 1, 1);
        }
    }

    @keyframes anim-effect-simo-1 {
        0%, 100% {
            -webkit-transform: scale3d(0, 0, 1);
            transform: scale3d(0, 0, 1);
            opacity: 0;
        }
        5%, 95% {
            opacity: 1;
            -webkit-transform: scale3d(1, 1, 1);
            transform: scale3d(1, 1, 1);
        }
    }

    @-webkit-keyframes anim-effect-simo-2 {
        0%, 5%, 95%, 100% {
            opacity: 0;
        }
        10%, 90% {
            opacity: 1;
        }
    }

    @keyframes anim-effect-simo-2 {
        0%, 5%, 95%, 100% {
            opacity: 0;
        }
        10%, 90% {
            opacity: 1;
        }
    }

    @-webkit-keyframes anim-effect-simo-3 {
        100% {
            -webkit-transform: rotate3d(0, 0, 1, 360deg);
            transform: rotate3d(0, 0, 1, 360deg);
        }
    }

    @keyframes anim-effect-simo-3 {
        100% {
            -webkit-transform: rotate3d(0, 0, 1, 360deg);
            transform: rotate3d(0, 0, 1, 360deg);
        }
    }
</style>














