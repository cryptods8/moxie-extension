import dotenv from "dotenv";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";

import data from "../public/moxie_resolve.json" assert { type: "json" };

dotenv.config({ path: ".env.local" });

if (!process.env.AIRSTACK_API_KEY) {
  console.error("AIRSTACK_API_KEY is not set in the environment variables");
  process.exit(1);
} else {
  console.log("API KEY successfully loaded");
}

const BATCH_SIZE = 50;

async function run() {
  const allFids = data.reduce(
    (acc, f) => {
      if (!acc.map[f.fid]) {
        acc.map[f.fid] = true;
        acc.list.push({ fid: f.fid, profileName: f.profileName });
      }
      return acc;
    },
    { list: [], map: {} }
  ).list;

  const updatedNames = [];
  for (let i = 0; i < allFids.length; i += BATCH_SIZE) {
    const batch = allFids.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (item) => {
      const { fid } = item;
      try {
        const {
          data: {
            userDataBody: { value },
          },
        } = await fetch(
          `https://hubs.airstack.xyz/v1/userDataByFid?fid=${fid}&user_data_type=6`,
          {
            method: "GET",
            headers: {
              "x-airstack-hubs": process.env.AIRSTACK_API_KEY,
            },
          }
        ).then((r) => r.json());
        const nameChanged = item.profileName !== value;
        const nameColor = nameChanged ? chalk.red : chalk.green;
        if (nameChanged) {
          updatedNames.push({ fid, profileName: value });
          console.debug(
            `[${new Date().toISOString()}] FID: ${fid}, Current Name: ${nameColor(item.profileName)}, Fetched Name: ${nameColor(value)}`
          );
        }
      } catch (e) {
        // ignore
      }
    });
    console.debug(`[${new Date().toISOString()}] Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(allFids.length / BATCH_SIZE)}`);
    await Promise.all(promises);
  }

  if (updatedNames.length > 0) {
    const outputPath = path.resolve("./public/updated_names.json");

    try {
      await fs.writeFile(outputPath, JSON.stringify(updatedNames, null, 2));
      console.log(`Updated names written to ${outputPath}`);
    } catch (error) {
      console.error(`Error writing updated names to file: ${error.message}`);
    }
  } else {
    console.log("No names were updated.");
  }
}

run();
