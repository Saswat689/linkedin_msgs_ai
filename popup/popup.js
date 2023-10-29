const startContainer = document.getElementById('start')
const infoContainer = document.getElementById('info')
const helloContainer = document.getElementById('hello')
const d_name = document.getElementById('d_name')
const savedUsersContainer = document.getElementById('savedusers')

chrome.runtime.sendMessage({
    type: "get_my_name"
})
.then(n => {
    if (!n) {
        return;
    }
    //show logged in stuff
    startContainer.style.display = 'none'
    infoContainer.style.display = 'block'

    //get all saved users and display here
    helloContainer.style.display = 'block'
    d_name.innerText = n.myname

    for (const key in n) {
        if (key == "myname") {
            continue
        }
        if (n.hasOwnProperty(key)) {
            savedUsersContainer.innerHTML += `
                <hr/>
                <p><span style="font-weight: bold; display: block;">Full name</span>${JSON.parse(n[key]).full_name}</p>
                <p><span style="font-weight: bold; display: block;">Position</span>${JSON.parse(n[key]).position}</p>
                <p><span style="font-weight: bold; display: block;">About</span>${JSON.parse(n[key]).about}</p>
                <p><span style="font-weight: bold; display: block;">Location</span>${JSON.parse(n[key]).location}</p>
                <p><a href="${JSON.parse(n[key]).url}" target="_blank">LinkedinUrl</a></p>
                `
        }
    }
})

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // if (request.msg === "user_saved") {
        //     //  To do something
        //     alert(request.data.user)
        // }
    }
);

document.getElementById('form_name').onsubmit = (e) => {
    e.preventDefault()
    const name = document.getElementById('user_name').value
    chrome.runtime.sendMessage({
        type: "save_my_name",
        name
    })
    .then(() => {
        startContainer.style.display = 'none'
        infoContainer.style.display = 'block'

        document.getElementById('loginpopup').style.display = 'block'
    })
}

let pauseBtn = document.getElementById('pause')
let continueBtn = document.getElementById('continue')

pauseBtn.addEventListener('click',() => {
    //send pause event to linkedin CS
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type:"pauseExecution"}, () => {
            alert('Paused successfully')
        });
    });
})

continueBtn.addEventListener('click',() => {
    //send pause event to linkedin CS
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type:"continueExecution"}, () => {
            alert('Execution started')
        });
    });
})
