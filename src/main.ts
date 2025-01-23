import { _INTERNAL_STATE, createElement, render } from "./shared/lib/flact";

render(
    createElement(
        "div",
        { test: "test" },
        createElement("h1", null, "hello"),
        createElement("h1", null, createElement('span', null, "one more"))
    ),
    document.getElementById("app")!
);