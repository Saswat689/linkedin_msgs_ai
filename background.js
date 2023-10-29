let linkedinProfileUrl = "https://www.linkedin.com";

let linkedinTabId;
let gptTabId;

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(linkedinProfileUrl)) {
    console.log("tab changed ?");
    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === "ON" ? "OFF" : "ON";

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
});

async function sendMessageToActiveTab(msg, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    setTimeout(async () => {
      const res = await chrome.tabs.sendMessage(parseInt(gptTabId), msg);

      if (res) {
        console.log(linkedinTabId)
        chrome.tabs.get(parseInt(linkedinTabId), function (tab) {
          console.log("highlighted", tab.index);
          chrome.tabs.highlight({ tabs: tab.index }, function () {});
        });

        sendResponse(res);
      }
    }, 10000);
  } catch (e) {
    console.log(e);
  }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  linkedinTabId = sender?.tab?.id;
  if (msg.type == "data_save") {
    //gpt tab not defined(present)
    if (!gptTabId) {
      chrome.tabs.create({ url: `https://chat.openai.com`,active: false }, (tab) => {
        gptTabId = tab.id;
      });
    } else {
      //gpt tabid present but check if the tab is there
      chrome.tabs.get(parseInt(gptTabId)).catch((e) =>
        chrome.tabs.create({ url: `https://chat.openai.com`,active: false }, (tab) => {
          gptTabId = tab.id;
        })
      );
    }

    //send msg
    sendMessageToActiveTab(msg, sendResponse);
  } else if (msg.type == "getUser") {
    let user;

    chrome.storage.local.get((data) => {
      user = data[msg.key];
      !user ? sendResponse(undefined) : sendResponse(JSON.parse(user));
    });
  } else if (msg.type == "save_my_name") {
    //user input from popup, store that, don't ask again
    chrome.storage.local.set({ myname: msg.name }, function () {
      if (chrome.runtime.lastError) {
        console.error(
          "Error setting " +
            key +
            " to " +
            JSON.stringify(data) +
            ": " +
            chrome.runtime.lastError.message
        );
      }
    });

    sendResponse("user logged successfully");
  } else if (msg.type == "get_my_name") {
    //retrieve my name
    chrome.storage.local.get((d) => {
      let me = d.myname;
      if (!me) {
        return sendResponse(undefined);
      }
      chrome.storage.local.get((d) => sendResponse(d));
    });
  }
  return true;
});
