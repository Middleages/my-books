import { defineConfig } from "vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
export default defineConfig({
  base: "/my-books/",
  plugins: [mdx({ remarkPlugins: [remarkGfm] })],
});
