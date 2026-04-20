import { Config } from "@remotion/cli/config";
import path from "path";

Config.setEntryPoint("./src/Root.tsx");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Serve from the project's public/ so symlinks to external drive files resolve correctly
Config.setPublicDir(path.resolve("./public"));
