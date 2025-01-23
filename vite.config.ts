import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    // esbuild: {
    //     jsxFactory: "Didact.createElement",
    //     jsxInject: `import { Didact } from '/src/shared/lib/flact'`,
    // },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});