chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log(sender, "hit");
  const textArea = document.getElementById("prompt-textarea");

  if (!msg.full_name) {
    sendResponse("error");
    return true
  }

  textArea.value = `Create a hello linkedin message for a person named"${
    msg.full_name
  }" ${
    msg.about ? `who describes himself/herself as "${msg.about}",` : "."
  } has a position/work of ${msg.position} in his/her industry and lives in ${
    msg.location
  }. Don't generate a subject. Use all the information and keep it engaging so that we receive a high response rate.Ask questions at the end for engageement. Talk more about their business and needs than trying to highlight our web design agency's benefits. Use my website link for contact information https://singhwebdesign.in and email saswat@singhwebdesign.in`;

  const event = new KeyboardEvent("input", { bubbles: true });

  textArea.dispatchEvent(event);

  const sendBtn = document.querySelector("button[data-testid=send-button]");

  sendBtn.click();

  setTimeout(() => {

    let latest_msg = Array.from(
      document.getElementsByClassName(
        "markdown prose w-full break-words dark:prose-invert dark"
      )
    ).slice(-1)[0].innerHTML;

    msg.connection_msg = latest_msg;

    chrome.storage.local.set(
      { [msg.full_name]: JSON.stringify(msg) },
      function () {
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
      }
    );

    sendResponse(latest_msg);
  }, 10000);

  return true;
});
