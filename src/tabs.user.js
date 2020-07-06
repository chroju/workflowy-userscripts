var currentTab = null;

function createHeaderDiv(title) {
    const outerDiv = document.createElement('div');
    const newButton = document.createElement('span');
    setStyle(outerDiv, {
        // From ._182tlv7
        'position': 'relative',
        'text-transform': 'uppercase',
        'font-size': '13px',
        'padding-left': '23px',
        'display': 'flex',
        'align-items': 'center',
        '-webkit-box-align': 'center',
        'margin-bottom': '6px',
        'font-weight': 'bold',
        'color': 'rgb(75, 81, 85)',
    })
    outerDiv.appendChild(document.createTextNode(title));

    newButton.innerHTML = '&#65291;'
    newButton.style.marginLeft = '1em';
    newButton.addEventListener('click', () => {
        // Note: if I ever change behavior to have the new tab not duplicate
        // the current one, then we'll also need to navigate to the root when
        // we make a new tab.
        setCurrentTab(createTab());
    });
    outerDiv.appendChild(newButton);
    return outerDiv;
}

// Sets the current tab, and sets styles appropriately
function setCurrentTab(t) {
    if (currentTab) {
        // Reset color of the tab before switching
        currentTab.firstChild.style.color = 'rgb(134, 140, 144)';
    }

    currentTab = t;
    currentTab.firstChild.style.color = 'rgb(0,0,0)';
}

// Adds a new tab
function createTab() {
    const tabContainer = document.querySelector('#tabcontainer');
    const outerDiv = document.createElement('div');
    const innerDiv = document.createElement('div');
    const linkDiv = document.createElement('div');
    const closeTabButton = document.createElement('div');
    const link = document.createElement('a');

    // Styles
    setStyle(outerDiv, {
        'display': 'flex',
        'justify-content': 'center',
        '-webkit-box-pack': 'center',
        'flex-direction': 'column',
        'padding': '0px 24px 0px 12px',
    });
    setStyle(innerDiv, {
        'position': 'relative',
        'white-space': 'nowrap',
        'display': 'flex',
        'align-items': 'center',
        '-webkit-box-align': 'center',
        'height': '32px',
        'color': 'rgb(134, 140, 144)',
        'font-weight': '400',
        'padding-left': '4px',
        'overflow': 'hidden',
    });
    // Arrow (plus/X)
    setStyle(closeTabButton, {
        'flex-shrink': '0',
        'display': 'flex',
        'align-items': 'center',
        '-webkit-box-align': 'center',
        'justify-content': 'center',
        '-webkit-box-pack': 'center',
        'opacity': '0.45',
        'width': '20px',
        'height': '20px',
    });
    // Text
    setStyle(linkDiv, {
        'flex-grow': '1',
        '-webkit-box-flex': '1',
        'width': '0px',
    });

    closeTabButton.innerHTML = 'X';

    linkDiv.appendChild(link);
    innerDiv.appendChild(closeTabButton);
    innerDiv.appendChild(linkDiv);
    outerDiv.appendChild(innerDiv);

    link.addEventListener('click', () => {
        setCurrentTab(outerDiv);
    })

    closeTabButton.addEventListener('click', () => {
        // Don't close the last tab
        if (tabContainer.childElementCount > 1) {
            if (currentTab == outerDiv) {
                setCurrentTab(outerDiv.previousSibling || outerDiv.nextSibling);
                // Select the new current tab
                currentTab.querySelector('a').dispatchEvent(
                    new MouseEvent('click'));
            }
            tabContainer.removeChild(outerDiv);
        }
        saveTabs();
    });

    updateTabDiv(outerDiv);
    tabContainer.appendChild(outerDiv);
    saveTabs();

    return outerDiv;
}

// Sets the link and title of a tab to the given values, or current workflowy
// item if not specified (url and title are optional)
function updateTabDiv(div, url, title) {
    if (div) {
        const link = div.querySelector('a');
        link.href = url || window.location.hash || "#";
        link.innerText = title || WF.currentItem().getNameInPlainText();
    }
}

// Adds the event handler to update tab information
function addTabEventHandler() {
    // Note - onhashchange doesn't work, presumably because workflowy uses
    // history.pushState instead of changing the hash. Instead, we have to
    // poll for changes. This lets us update the title when we make a new item
    // too.
    let previousState = window.history.state;
    let previousTitle = document.title;
    setInterval(() => {
        if (previousState != window.history.state ||
                previousTitle != document.title) {
            previousState = window.history.state;
            previousTitle = document.title;
            // The URL changed
            updateTabDiv(currentTab);
            saveTabs();
        }
    }, 500);
}

// Add a spacer
function createSpacer() {
    const spacerDiv = document.createElement('div');
    spacerDiv.style.marginBottom = '20px';
    return spacerDiv;
}

// Restore tabs from localStorage
function restoreTabs() {
    const savedTabsJSON = localStorage.getItem("tabs");
    if (savedTabsJSON) {
        const savedTabs = JSON.parse(savedTabsJSON);
        let tabs = [];
        for (const savedTab of savedTabs) {
            const tab = createTab();
            updateTabDiv(tab, savedTab['url'], savedTab['title']);
            tabs.push(tab);
        }
        setCurrentTab(tabs[0]);
    } else {
        // There aren't any saved tabs, so just create a blank one
        setCurrentTab(createTab());
    }
}

// Save tabs to localStorage
function saveTabs() {
    let tabs = document.querySelectorAll("#tabcontainer>div a");
    let savedTabs = []
    for (const tab of tabs) {
        savedTabs.push({
            url: tab.href,
            title: tab.innerText
        });
    }
    localStorage.setItem("tabs", JSON.stringify(savedTabs));
}

// Set up the tab bar
function createTabBar(_) {
    const sidebar = document.querySelector('.scroller');
    const tabContainer = document.createElement('div');
    setStyle(tabContainer, {
        'margin': '0',
        'padding': '0',
    });
    tabContainer.id = 'tabcontainer';
    sidebar.insertBefore(createSpacer(), sidebar.firstChild);
    sidebar.insertBefore(tabContainer, sidebar.firstChild);
    sidebar.insertBefore(createHeaderDiv("Tabs"), sidebar.firstChild);
    restoreTabs();
    addTabEventHandler();
}

onHeaderAvailable(createTabBar);
