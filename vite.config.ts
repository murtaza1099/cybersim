import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "node:fs/promises";
import { componentTagger } from "lovable-tagger";

function cybersimEditorSavePlugin() {
  return {
    name: "cybersim-editor-save",
    configureServer(server) {
      server.middlewares.use("/editor/save-config", async (req, res) => {
        if (req.method !== "POST" || process.env.NODE_ENV !== "development") {
          res.statusCode = 404;
          res.end();
          return;
        }

        let body = "";
        req.on("data", chunk => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body);
            const json = JSON.stringify(payload.config, null, 2) + "\n";
            const rootConfigPath = path.resolve(__dirname, "src/config/sceneConfig.json");
            const levelConfigPath = path.resolve(__dirname, "src/pages/Level1/config/sceneConfig.json");
            await fs.mkdir(path.dirname(rootConfigPath), { recursive: true });
            await fs.mkdir(path.dirname(levelConfigPath), { recursive: true });
            await fs.writeFile(rootConfigPath, json, "utf8");
            await fs.writeFile(levelConfigPath, json, "utf8");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: String(error) }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "development" && cybersimEditorSavePlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
