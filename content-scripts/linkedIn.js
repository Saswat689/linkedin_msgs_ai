let userIndex = 0;
let connNo = 0;
let paused = false;

let scraping = false;

//create and inject loader
let loadergif = `<img src="https://media.tenor.com/hlKEXPvlX48AAAAi/loading-loader.gif" style="width: 100px; height: 50px;"/>`;

//control these loading elems
let loadingContainer = document.createElement("div");
let loadText = document.createElement("p");

loadText.innerText = "Loading scripts";
loadText.style.fontWeight = "bold";

loadingContainer.style.padding = "10px 40px 20px 20px";
loadingContainer.style.position = "fixed";
loadingContainer.style.top = "10px";
loadingContainer.style.right = "10px";
loadingContainer.style.display = "none";
loadingContainer.style.backgroundColor = "#efecec";
loadingContainer.style.zIndex = "100000";

loadingContainer.innerHTML =
  `<p style="font-size: 12px; margin-bottom: 15px;">Extension running...</p>` +
  loadergif;
loadingContainer.appendChild(loadText);

document.querySelector("body").appendChild(loadingContainer);

//update pause/play variable and control execution
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case "pauseExecution":
      paused = true;
      break;
    case "continueExecution":
      paused = false;
      init();
      break;
  }
});

async function init(userdata) {
  console.log("init called", userIndex);
  if (paused) return;

  if (userIndex >= 10) return;

  let full_name = document.getElementsByClassName(
    "entity-result__title-text t-16"
  )[userIndex]?.children[0]?.children[0]?.children[0]?.innerText;

  //err
  if (full_name == undefined) {
    userIndex++;
    return init();
  }

  console.log(full_name);

  user = await chrome.runtime.sendMessage({
    type: "getUser",
    key: full_name,
  });

  console.log(user);

  //no user
  if (!user) {
    scraping=true
    startScraping();
  } else {
    console.log(user.first_name);
    messageProfile(user?.connection_msg, user.first_name);
  }
}

let startScraping = () => {
  if (userIndex >= 9) {
    return alert("Finished execution for this page");
  }

  console.log("scraping func called");
  let full_name = document.getElementsByClassName(
    "entity-result__title-text t-16"
  )[userIndex]?.children[0]?.children[0]?.children[0]?.innerText;
  let first_name = full_name.split(" ")[0];

  let about = document.getElementsByClassName(
    "entity-result__summary entity-result__summary--2-lines t-12 t-black--light mb1"
  )[userIndex]?.innerText;

  let position = document.getElementsByClassName(
    "entity-result__primary-subtitle t-14 t-black t-normal"
  )[userIndex]?.innerText;

  let location = document.getElementsByClassName(
    "entity-result__secondary-subtitle t-14 t-normal"
  )[userIndex]?.innerText;

  let url = document.getElementsByClassName("entity-result__title-text t-16")[
    userIndex
  ]?.children[0]?.href;

  loadText.innerText = `Scraping ${first_name}...`;
  loadingContainer.style.display = "block";

  console.log(about,'about');

  if (!full_name || !position || !about) {
    console.log("fields missin");
    alert("Important fields missing. Unoptimised profile");
    loadingContainer.style.display = "none";
    userIndex++;
    return init();
  }

  chrome.runtime.sendMessage(
    {
      type: "data_save",
      full_name,
      first_name,
      position,
      about,
      location,
      url,
    },
    async function (response) {
      //res contains msg
      console.log("saved person");
      loadingContainer.style.display = "none";
      scraping=false;
      messageProfile(response, first_name);
    }
  );

  //console.log(about, full_name, first_name, position, location);
};

let messageProfile = (msg, name) => {
  console.log("message profile func called", userIndex);

  if (userIndex >= 9) {
    return alert("Finished execution for this page");
  }

  console.log(userIndex, "msg btn index");
  //click on msg btn and msg
  let msgBtn = document.querySelectorAll('button[aria-label="Message "]')[
    userIndex
  ];

  console.log(msgBtn, "msgBtn");

  if (!msgBtn) {
    //move to next user
    console.log("no msgbtn");
    userIndex++;
    return init();
  }

  msgBtn.click();

  setTimeout(() => {
    let subjectInput = document.querySelector('input[name="subject"]');
    let msgInput = document.querySelector('div[role="textbox"]');
    let sendBtn = document.getElementsByClassName(
      "msg-form__send-button artdeco-button artdeco-button--1"
    )[0];

    let closeBtn = document.getElementsByClassName(
      "msg-overlay-bubble-header__controls display-flex align-items-center"
    )[0]?.children[3];

    //two variations of closeBtn
    !closeBtn &&
      (closeBtn = document.getElementsByClassName(
        "msg-overlay-bubble-header__controls display-flex align-items-center"
      )[0]?.children[1]);

    //either a premium user or connection profile
    console.log(closeBtn, "closeBtn");
    console.log(msgBtn, "msgBtn");
    console.log(subjectInput, "subject");

    if (!closeBtn) {
      console.log("premium/conn");

      //close premium popup
      document.querySelector('[aria-label="Dismiss"]').click();

      //move to next user
      userIndex++;
      return init();
    }

    //listen when user closes msg
    closeBtn.addEventListener("click", () => {
      console.log("clicked close");

      //change index and repeat process for next user
      console.log("msg", msg);

      //prevent another popup from opening if one if currently
      if (scraping) return;

      userIndex++;
      init();
    });

    //already dmed the person probs
    //let user close the popup
    if (!subjectInput || !msgInput) {
      console.log("already msged this person");
      return;
    }

    //input generated msg
    subjectInput.value = `Just a quick Hello ${name}`;
    msgInput.innerHTML = msg;

    //listen when user hits send msg
    sendBtn.addEventListener("click", () => {
      //change index and repeat process for next user
      console.log("msg", msg);
      userIndex++;
      init();
    });
  }, 5000);
};

function cleanup() {
  //cleanup/remove all elemns that have a connection btn or those who don't have an about section
  //we want to msg only serious,active businesses
  let list = document.getElementsByClassName(
    "reusable-search__entity-result-list list-style-none"
  )[0].children
  let index = 0;

  let elemsToRemove = []

  for (let elem of list) {

    let isConn = document
      .getElementsByClassName("entity-result__actions entity-result__divider")
      [index]?.children[0]?.children[0]?.ariaLabel?.startsWith("Invite");

      let isAbout = document.getElementsByClassName(
        "entity-result__content entity-result__divider pt3 pb3 t-12 t-black--light"
      )[index].children

    if (isConn || isAbout.length == 2) {
      connNo++;
      elemsToRemove.push(elem)
    }

    index++;
  };

  for (let elem of elemsToRemove) {
    elem.remove()
  }

  init();
}

setTimeout(cleanup, 10000);

var currentPath = window.location.href;
function watchPathChanges() {
  if (window.location.href !== currentPath) {
    currentPath = window.location.href;
    //url changed
    connNo = 0;
    userIndex = 0;
    setTimeout(cleanup, 5000);
  }
}
setInterval(watchPathChanges, 200);
// AIconnection()
