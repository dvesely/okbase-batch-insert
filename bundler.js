import esbuild from "esbuild";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("watch", {
    alias: "w",
    type: "boolean",
  })
  .help()
  .alias("help", "h").argv;

const bundles = [];

const contentScripts = [
  "fill-form.js",
  "load-interrupts.js",
];

contentScripts.forEach(fileName => bundles.push({
  entryPoints: ["src/content-scripts/" + fileName ],
    bundle: true,
    watch: argv.watch,
    outfile: "dist/" + fileName,
}));

Promise.all(bundles.map((x) => esbuild.build(x)));
