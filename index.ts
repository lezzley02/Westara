import express from "express";
import path from "node:path";
import { createApp } from "./server/_core/app";

// Vercel's Express framework detector requires Express to be imported and
// instantiated in the root entrypoint. The shared factory attaches all APIs.
const app = createApp(express());
const indexHtml = path.resolve(process.cwd(), "public", "index.html");

// Preserve the starter's hard 404 response while returning the SPA shell so
// the client can render its branded not-found screen.
app.get("/404", (_req, res, next) => {
  res.status(404).sendFile(indexHtml, (error) => {
    if (error) next(error);
  });
});

// Vercel serves existing public/ assets from its CDN. Serve the SPA shell for
// extensionless page routes; never turn API, OAuth, platform, or file requests
// into HTML responses.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const reservedPrefixes = [
    "/api",
    "/manus-oauth",
    "/manus-storage",
    "/__manus__",
    "/__system__",
    "/.well-known",
  ];
  const isReservedPath = reservedPrefixes.some(
    (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`)
  );
  if (isReservedPath || path.extname(req.path)) return next();

  res.sendFile(indexHtml, (error) => {
    if (error) next(error);
  });
});

export default app;
