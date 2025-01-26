import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    esbuild: {
        jsxFactory: "createElement",
        jsxInject: `import { createElement } from '/src/shared/lib/flact'`,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});