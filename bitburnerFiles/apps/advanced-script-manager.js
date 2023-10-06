import { ApplicationPortal, EventHandlerQueue } from '/GUI.js';
import { LIST_OF_SERVERS } from '/hack_script_automation.js';

/** @param {NS} ns */
export async function main(ns) {
  let eventHandler = new EventHandlerQueue();
  let app = ApplicationPortal.currentApp;

  app.onQuit(() => {
    eventHandler.addToQueue(() => ns.kill());
  });

  let servers = Array.from(LIST_OF_SERVERS, (e, i) => {
    return ({ serverName: e, scriptsRunning: ns.ps(e) });
  });


  let lastScriptsIncome = [];
  let scriptsIncome = [];


  scriptsIncome = Array.from(servers, (e) => {
    return (
      Array.from(e.scriptsRunning, (j, i) => {

        return ({
          hostServer: e.serverName,
          scriptName: e.scriptsRunning[i].filename,
          scriptIncome: ns.getScriptIncome(e.scriptsRunning[i].filename, e.serverName)
        })
      }))
  }
  );

  while (true) {

    eventHandler.addToQueue(() => {
      lastScriptsIncome = JSON.parse(JSON.stringify(scriptsIncome));

      scriptsIncome.forEach((e, i) => {
        e.forEach((j, l) => {
          scriptsIncome[i][l].scriptIncome = ns.getScriptIncome(j.scriptName, j.hostServer)
        });
      });

    });

    app.render(() => {
      return (
        `
          <div class="content-container">
            ${"servers"}
            ${scriptsIncome.map((e, i) => {
          return (
            `<div class="server-container">
                ${servers[i].serverName}
                ${e.map((j, l) => {

              var rateofchange = lastScriptsIncome && lastScriptsIncome.length > 0 ? ((j.scriptIncome - lastScriptsIncome[i][l].scriptIncome).toFixed(5)) : "0";
              var color = rateofchange > 0 ? "green" : "red";
              var toggleState = "Running";
              var toggleBtn = "Disable";

              return (
                `<div class="script-container">
                    <div>
                      <div>script name: ${j.scriptName}</div>
                      <div>Income: ${"$" + j.scriptIncome} <span style="color:${color};">${rateofchange}</span></div>
                    </div>
                    <div class="script-toggle-bar">
                      <span class="script-toggle-state">Running</span> <button class="script-toggle-btn hide-until-hover">Disable</button>
                    </div>
                   </div>`
              )
            })}
                <div class="script-bottom-row hide-until-hover">
                  <button class="server-bottom-row-add-script-btn">Add Script</button>
                </div>
              </div>`)
        })}


          </div>
          <div class="server-overview-container">
            <div class="server-overview">
            </div>
          </div>
        `
      )
    });

    await eventHandler.executeAll();
    await ns.sleep(500);

  }
}