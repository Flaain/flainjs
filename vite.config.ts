import { defineConfig } from "vite";

export default defineConfig({
    esbuild: {
        jsxFactory: "Fla.h",
        jsxInject: `import { Fla } from '../index'`,
        jsxFragment: "Fla.Fragment",
    },
});