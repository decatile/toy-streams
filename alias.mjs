import { replaceTscAliasPaths } from "tsc-alias";
import fs from "fs/promises";

replaceTscAliasPaths({
  configFile: "tsconfig.cjs.json",
});

replaceTscAliasPaths({
  configFile: "tsconfig.mjs.json",
});

fs.writeFile("./dist/cjs/package.json", '{"type":"commonjs"}');

fs.writeFile("./dist/mjs/package.json", '{"type":"module"}');
