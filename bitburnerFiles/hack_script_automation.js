export const LIST_OF_SERVERS = [
    "n00dles",
    "foodnstuff",
    "sigma-cosmetics",
    "joesguns",
    "hong-fang-tea",
    "iron-gym"
  ]

/** @param {NS} ns */
export async function main(ns) {

  function getFindableServersByDepth(depth) {

  }

  LIST_OF_SERVERS.forEach((e) => {
    if (!ns.fileExists("hack_script_base.js", e)) {
      ns.scp("hack_script_base.js", e);
    } else {
      ns.scriptKill("hack_script_base.js", e); // kills all scripts first
      ns.rm("hack_script_base.js", e); // delete script
      ns.scp("hack_script_base.js", e); // create script
    }

    if (!ns.isRunning("home_script_base.js", e)) {
      var script_ram = ns.getScriptRam("hack_script_base.js");
      var diff_ram = ns.getServerMaxRam(e) - ns.getServerUsedRam(e);

      var num_of_threads = parseInt(Math.floor(diff_ram / script_ram), 10);

      ns.exec("hack_script_base.js", e, num_of_threads); // run script on 3 threads
    }

  })


}