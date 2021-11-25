const path = require("path");
const puppeteer = require("puppeteer");

const implementations = [
  "emotion-v11",
  "styled-components-css-objects",
  "use-styles"
];

const tests = ["Mount deep tree", "Mount wide tree", "Update dynamic styles"];
const tracing = process.argv.some(arg => arg.indexOf("tracing") > -1);

if (tracing) {
  console.log(
    "\nTracing enabled. (note that this might impact benchmark results, we recommend leaving this turned off unless you need a trace)"
  );
}

(async () => {
  console.log("\nStarting headless browser...");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  console.log("Opening benchmark app...");
  await page.goto(`file://${path.resolve(__dirname, "./dist/index.html")}`);

  console.log(
    "Running benchmarks... (this may take a minute or two; do not use your machine while these are running!)"
  );

  await implementations.reduce(
    async (previousImplementation, implementation) => {
      await previousImplementation;

      await page.select('[data-testid="library-picker"]', implementation);
      await new Promise(resolve => setTimeout(resolve, 3000));

      await tests.reduce(async (previousTest, test) => {
        await previousTest;
        const traceFile = `${implementation}_${test
          .toLowerCase()
          .replace(/\s/g, "-")}_trace.json`;
        await page.select('[data-testid="benchmark-picker"]', test);
        await page.waitForSelector('[data-testid="run-button"]');
        if (tracing) await page.tracing.start({ path: traceFile });
        await page.click('[data-testid="run-button"]');
        await page.waitForSelector(`[data-testid="${test} results"]`);
        if (tracing) await page.tracing.stop();
        const result = await page.$eval(
          `[data-testid="${test} results"]`,
          node => node.innerText
        );
        console.log(`\n---${implementation}---${test}---`);
        console.log(result);
        if (tracing) {
          console.log("Trace written to", traceFile);
        }
      }, Promise.resolve());

      await page.reload();
    },
    Promise.resolve()
  );

  console.log("Done!");
  await browser.close();
})();
