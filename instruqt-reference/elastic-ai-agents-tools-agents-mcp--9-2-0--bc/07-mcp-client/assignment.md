---
slug: mcp-client
id: qo7hqrjwcebk
type: challenge
title: Connecting to Elastic Agent with an MCP Client
teaser: Use a simple MCP client to learn how Elastic Agent exposes tools as an MCP
  Server
tabs:
- id: yjg5fr67mmia
  title: Terminal 1
  type: terminal
  hostname: host-1
- id: bbpne8zwf6uc
  title: Terminal 2
  type: terminal
  hostname: host-1
- id: gndtqnaw1l2g
  title: Simple MCP Client
  type: service
  hostname: host-1
  port: 5173
- id: faymctvfxgmc
  title: VSCode
  type: service
  hostname: host-1
  port: 8080
difficulty: ""
timelimit: 0
enhanced_loading: null
---

![simple-mcp-chat_robots_half_sized.png](../assets/simple-mcp-chat_robots_half_sized.png)
In this chapter, we'll connect to the 1Chat MCP server that's built right into Kibana.

To do this, we'll use a command-line tool called the Simple MCP Client (SMC). This will let us talk to our 1Chat agents directly from our terminal.


1. Starting the Simple MCP Client
===
> [!NOTE]
> We'll be working on the commandline. You can either copy / paste commands into the terminal
> or, simply click the `>run` button to run the command in the active terminal window
> ![CleanShot 2025-08-19 at 15.38.46@2x.png](../assets/CleanShot%202025-08-19%20at%2015.38.46%402x.png)

First, navigate to the directory where we've already cloned the [SMC repo](https://github.com/jeffvestal/simple-mcp-client).

1.   You should have the **[button label="Terminal 1"](tab-0)** already open.
2.   We've already cloned the [SMC repo](https://github.com/jeffvestal/simple-mcp-client). Run the command below to change into the directory:
```run,bash
cd /workspace/workshop/simple-mcp-client
```
3. Run the setup script to install the dependencies:
```run,bash
./setup.sh
````
3. Next we need to activate the python virtual environment and run the start script:
````run,bash
source backend/venv/bin/activate
./start-dev.sh proxy
````
4. You should see output saying both frontend and backend services are running. Similar to below (the PIDs will be different)
    ![CleanShot 2025-08-20 at 13.49.13@2x.png](../assets/CleanShot%202025-08-20%20at%2013.49.13%402x.png)


Configure the LLM and MCP Server Connections
===
# LLM Configuration
We need to cofifure a Chat LLM for the MCP Client to talk to. We are going to use the Elastic Proxy to talk to a `gpt-4o` model in Elastic's Azure OpenAI tennant.
> [!IMPORTANT]
> While Elastic is not "training" on any of the chat conversations you have, anything you enter into the chat app may be logged.

1. Open the [button label="Simple MCP Client"](tab-2) Tab
2. Click the gear icon in the upper right to open the settings page
![CleanShot 2025-08-20 at 13.50.52@2x.png](../assets/CleanShot%202025-08-20%20at%2013.50.52%402x.png)
3. In the LLM Configuration section fill out the following fields:
    - `Name`:
        ```
        Elastic Proxy
        ```
    - `Provider`:
        ```nocopy
        OpenAI Compatible
        ```
    - `URL`:
        ```
        [[ Instruqt-Var key="LLM_CHAT_URL" hostname="kubernetes-vm" ]]
        ```
    - `Model`:
        ```
        gpt-4o
        ```
    - `API Key`:
        ```
        [[ Instruqt-Var key="LLM_KEY" hostname="kubernetes-vm" ]]
        ```
    - `Max Tokens` leave at 16,000:
        ```
        16000
        ```


4. Click `Add Configuration`

You should now see the `Elastic Proxy` listed with a 🟢 indicating connection was successful
![CleanShot 2025-08-20 at 13.57.57@2x.png](../assets/CleanShot%202025-08-20%20at%2013.57.57%402x.png)

---
# MCP Server Connection

Next we need to connet our Elastic MCP Server.

To do this we will connect to the `/api/chat/mcp` endpoint of our Kibana server.

1. If you aren't still in the Settings page, click the gear icon in the upper right to open the settings page
![CleanShot 2025-08-20 at 13.50.52@2x.png](../assets/CleanShot%202025-08-20%20at%2013.50.52%402x.png)
2.  In the MCP Server Connections section fill out the following fields:
     - `Name`:
        ```
        Elastic MCP Server
        ```
     - `Server Type`:
        ```nocopy
        remote (HTTP)
        ```
     - `URL`:
        ```
        [[ Instruqt-Var key="KIBANA_URL_UI" hostname="host-1" ]]/api/agent_builder/mcp
        ```
     - `API Key (Optional)`:
        ```
        [[ Instruqt-Var key="ELASTICSEARCH_API_KEY" hostname="host-1" ]]
        ```


3. Click "Connect Server"
- You should see the MCP Server Connected

---
### Tool List
In addition to the `Connected` and 🟢 status markers on the server line, you can also expand the row by clicking the ">" icon to view a list of tools.

The SMC automatically requests a tools list when it successfully connects to an MCP Server
![CleanShot 2025-08-20 at 13.59.46@2x.png](../assets/CleanShot%202025-08-20%20at%2013.59.46%402x.png)

Let's Chat!
===
Switch back to the Chat page and let's start asking some questions
![CleanShot 2025-08-20 at 13.55.26@2x.png](../assets/CleanShot%202025-08-20%20at%2013.55.26%402x.png)

- We saw the tool list in the settings page, but let's ensure the LLM really knows about them. Paste the following in the chat box:
    ```
    What tools do you know about?
    ```
    You should see a nicely formatted list of tools similar to the screenshot below:
![CleanShot 2025-08-20 at 14.00.25@2x.png](../assets/CleanShot%202025-08-20%20at%2014.00.25%402x.png)

- Next lets ask a more complex question that will use some of the tools:
    ````
    Can you tell me what each index could be used for? What type of data is in each one?
    ````
- Next lets ask a more complex question that will use some of the tools:
    ````
    Who has the highest account value and what is their highest valued individual asset?
    ````

> [!NOTE]
> This last query can trip up the LLM, sometimes you may have to tell it to continue the task if it doesn't complete.




.
