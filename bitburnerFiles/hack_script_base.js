/** @param {NS} ns */
export async function main(ns) {

  async function weakenServer(sn) {
    var base = ns.getServerBaseSecurityLevel(sn);
    var security_level = ns.getServerSecurityLevel(sn);

    while (((security_level - base) > 0)) {
      base = ns.getServerBaseSecurityLevel(sn);
      security_level = ns.getServerSecurityLevel(sn);
      await ns.weaken(sn);
    }
  }

  var servername = ns.getHostname();
  let count = 0;

  let order = [
    async () => await weakenServer(servername),
    async () => await ns.hack(servername),
    async () => await ns.hack(servername),
    async () => await ns.hack(servername),
    async () => await ns.hack(servername),
    async () => await ns.grow(servername)
  ]

  while (true) {

    await order[count]();

    count += 1;

    count = count % (order.length);
  }
}



