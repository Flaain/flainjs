import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    esbuild: {
        jsxFactory: "h",
        jsxInject: `import { h, Fragment } from '/src/shared/lib/flact'`,
        jsxFragment: 'Fragment'
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});