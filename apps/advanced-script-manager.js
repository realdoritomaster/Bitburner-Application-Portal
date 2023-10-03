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
    return ({serverName: e, scriptsRunning: ns.ps(e)});
  });

  let lastScriptsIncome = null;
  let scriptsIncome = [];
  while (true) {
    
    eventHandler.addToQueue(() => {

        scriptsIncome = Array.from(servers, (e) => { 
          return (
          Array.from(e.scriptsRunning, (j, i) => {
          
          return ({
          scriptName: e.scriptsRunning[i].filename, 
          scriptIncome: ns.getScriptIncome(e.scriptsRunning[i].filename, e.serverName)
          })
        }))}
        );

    });

    app.render(() => {
      return(
        `
          <div class="content-container">
            ${"scripts"}
            ${scriptsIncome.map((e, i) => {
              return (
              `<div class="server-container">
                ${servers[i].serverName}
                ${e.map((j, l) => {
                  var rateofchange = lastScriptsIncome && lastScriptsIncome.length > 0 ? ((j.scriptIncome - lastScriptsIncome[i][l].scriptIncome).toFixed(5)) : "0";
                  var color = rateofchange > 0 ? "green" : "red";

                  return(
                  `<div class="script-container">
                      script name: ${j.scriptName} <br/> Income: ${"$" + j.scriptIncome} <span style="color:${color};">${rateofchange}</span>
                   </div>`
                  )
                  })}
              </div>`)
            })}
          </div>
        `
      )
    });

    lastScriptsIncome = scriptsIncome;
    

    await eventHandler.executeAll();
    await ns.sleep(500);
  }
}