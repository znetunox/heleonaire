import { parseJobStats } from "./parsers/jobStatsParser";

function main() {
  const result = parseJobStats();

  console.log("");
  console.log("========================================");
  console.log("       JOB STATS RAW AUDIT");
  console.log("========================================");
  console.log("");

  console.log("Result keys:");
  console.log(Object.keys(result));

  console.log("");

  const groups = result.groups;

  console.log("Groups type:", typeof groups);
  console.log("Is array:", Array.isArray(groups));
  console.log("Groups:", groups?.length);

  console.log("");
  console.log("----------------------------------------");
  console.log("FIRST 10 GROUPS");
  console.log("----------------------------------------");
  console.log("");

  groups.slice(0, 10).forEach((group, index) => {
    console.log(`GROUP ${index + 1}`);
    console.log("jobs:", group.jobs);
    console.log("jobs type:", typeof group.jobs);
    console.log("");
  });
}

main();