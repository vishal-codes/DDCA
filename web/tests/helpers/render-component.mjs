import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);

export function loadComponent(path, name) {
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const loadedModule = { exports: {} };
    modules.set(filename, loadedModule);
    const javascript = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const require = (specifier) => {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return nativeRequire(specifier);
      const base = specifier.startsWith("@/") ? resolve("src", specifier.slice(2)) : resolve(dirname(filename), specifier);
      const target = [base + ".ts", base + ".tsx"].find(existsSync);
      if (!target) throw new Error(`Missing test module: ${specifier}`);
      return load(target);
    };
    runInNewContext(javascript, { module: loadedModule, exports: loadedModule.exports, require, process, Date, URL, URLSearchParams }, { filename });
    return loadedModule.exports;
  }
  return load(resolve(path))[name];
}

export function renderComponent(path, name, props) {
  return renderToStaticMarkup(createElement(loadComponent(path, name), props));
}
