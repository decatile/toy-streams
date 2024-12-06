import { existsSync, rmSync } from "fs";

existsSync("dist") && rmSync("dist", { recursive: true, force: true });
