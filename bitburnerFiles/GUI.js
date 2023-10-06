
/** @param {NS} ns */
export async function main(ns) {
  ApplicationPortal.init(ns);
  await ApplicationPortal.startRunTime(ns);
}

export class EventHandlerQueue {
  constructor() {
    this.queue = [];
    this.blockNew = false;
  }

  // Adds function to the beginning of the event queue
  addToQueue(func) {
    if (!this.blockNew) {
      this.queue.push(func);
    }
  }

  // Blocks any new functions from being added to queue
  blockQueue() {
    blockNew = true;
  }

  // Unblocks any new functions from being added to queue
  unblockQueue() {
    blockNew = false;
  }

  getQueue() {
    return this.queue;
  }

  // executes all functions in queue
  async executeAll() {
    if (this.queue.length > 0)
      await new Promise(async(resolve) => {
        for (const func of this.queue) {
          await func();
        }

        this.queue = [];
        resolve();
        
      });
  }
}

class App {
  constructor(name, dir, ns, eventHandler) {
    this.name = name;
    this.dir = dir;
    this.ns = ns;
    this.eventHandler = eventHandler;
    this.dom = null;
  }

  // returns dom elements from callback function call from any app script
  render(callback) {
    let element = callback();
    this.dom = element;
  }

  // runs the app script
  runApp() {
    this.eventHandler.addToQueue(() => {
      this.ns.run(this.dir);
    });
  }

  quit = () => {}

  // returns quit function from app script and sets the this.quit function
  onQuit(callback) {
    this.quit = () => callback();
  }
  
}

export class ApplicationPortal {

  static appList = [];
  static currentApp = null;
  
  // Begins run-time for the application portal and wraps run-time for all other apps
  static async startRunTime(ns) {
    while (true) {
      await this.eventHandler.executeAll();
      this.renderCurrentApp();
      await ns.sleep(500);
    }
  }

  // renders the current opened app
  static renderCurrentApp() {
    if (this.currentApp) {
      const domNode = document.getElementById('app-container');
      domNode.innerHTML = this.currentApp.dom;
    }    
  }

  // Runs the selected app
  static runApp(app) {
    this.eventHandler.addToQueue(() => {
      app.runApp();
      this.currentApp = app;
    }); 
  }

  // Initialization of the application portal
  static init(ns) {
    this.eventHandler = new EventHandlerQueue();

    let container = null;
    let header = null;
    let minimized = false;

    function deleteGUI() {
      if (document.getElementById("terminal-gui")) {
        let elem = document.getElementById("terminal-gui");
        elem.parentNode.removeChild(elem);
      }
    }

    function initGUI() {
      var elemDiv = document.createElement('div');
      var root = document.getElementById("root");

      elemDiv.setAttribute("id", "terminal-gui");
      root.insertBefore(elemDiv, root.firstChild);
      container = document.getElementById("terminal-gui");
    }

    // Gets all available application scripts in 'apps/' directory
    var getApps = () => {
      var apps = ns.ls("home");
      apps = apps.filter((e) => {return e.includes('.js')&&e.includes('apps/')});
      return apps;
    }

    // Retrieves app list from getApps function and creates DOM elements and sets innerHTML
    var createAppList = () => {
      var appListContainer = document.getElementById("app-list");
      var apps = getApps();

      var appsHTML = Array.from(apps, (e, i)=>{
        let app = new App(e.slice(5), e, ns, this.eventHandler); // Create new app object and push to app list
        this.appList.push(app); 

        this.eventHandler.addToQueue(() => {
          document.getElementById(`app-${i}`).addEventListener("mouseup", () => {
            this.runApp(app);
          }); 
        });

        return(
          `<div class='application' id=app-${i}>${app.name}</div>`
        )
      });
      appsHTML = appsHTML.join("");

      appListContainer.innerHTML = appsHTML;
    }

    // renders the portal page by resetting the applications-container DOM and calling createAppList function
    function renderPortalPage() {
      const domNode = document.getElementById('app-container');

      const domElement = `
          <div id="app-list" class="applications-container">
          </div>
      `;

      domNode.innerHTML = domElement;
      createAppList();
    }

    // sets innerHTML of GUI by retrieving DOM elements and CSS from GUI_html.txt
    function initHTML() {
      var data = ns.read("GUI_html.txt");
      document.getElementById("terminal-gui").innerHTML = data; // Use innerHTML to get or set the html content.
      renderPortalPage();
      header = document.getElementById("draggable");
    }

    // Initialize GUI
    deleteGUI();
    initGUI();
    initHTML();

    // Closes the GUI
    let onQuit = () => {
      container.style.opacity = "0";
      container.style.height = "0%";

      this.eventHandler.addToQueue(()=>ns.sleep(200));

      if (this.currentApp)
        this.eventHandler.addToQueue(() => {this.currentApp.quit();  this.currentApp = null;} );

      this.eventHandler.addToQueue(() => {
        deleteGUI();
        ns.kill();
        });

    }

    // Minimizes the GUI
    function onMinimize() {
      minimized = minimized ? false : true;
      container.style.height = minimized ? "25px" : "50%";
      container.style.width = minimized ? "auto" : "50%";
      header.style.padding = minimized ? "0px" : "1.5rem";
    }

    // Quits the current application if applicable
    let onQuitApp = () => {
      if (this.currentApp) 
        this.eventHandler.addToQueue(() => { this.currentApp.quit(); this.currentApp = null; renderPortalPage(); });
    }

    // Allows the user to drag and move the GUI
    function dragFunction() {
      
      var offset = [window.innerWidth/4, window.innerHeight/4]; // Starts offset at middle of the screen.
      var divOverlay = document.getElementById("draggable");
      var parentOverlay = divOverlay.parentElement.parentElement;
      var isDown = false;

      divOverlay.addEventListener('mousedown', function (e) {
        isDown = true;
        offset = [
          offset[0] - e.clientX,
          offset[1] - e.clientY
        ];
      }, true);

      document.addEventListener('mouseup', function (e) {
        if (isDown)
          offset = [
            e.clientX + offset[0],
            e.clientY + offset[1]
          ]

        isDown = false;

      }, true);

      document.addEventListener('mousemove', function (e) {
        e.preventDefault();
        if (isDown) {
          parentOverlay.style.transform = `translate(${(e.clientX + offset[0])}px, ${(e.clientY + offset[1])}px)`;
        }
      }, true);
    }

    // Listens for when the user wants to close the GUI
    function quitFunction() {
      var quit = document.getElementById("quit");

      quit.addEventListener("mouseup", onQuit);
    }

    // Listens for when the user wants to minimize the GUI
    function minimizeFunction() {
      var minimize = document.getElementById("minimize");

      minimize.addEventListener("mouseup", onMinimize);
    }

    // Listens for when the user wants to quit the current application
    function quitAppFunction() {
      var quit = document.getElementById("quit-app");

      quit.addEventListener("mouseup", onQuitApp);
    }

    // Apply mouse up even listeners and functions to GUI header toolbar
    quitAppFunction();
    dragFunction();
    minimizeFunction();
    quitFunction();
  }
}

