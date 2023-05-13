// ==UserScript==
// @name         Workflowy Journal
// @namespace    https://github.com/mivok/workflowy-userscripts
// @version      0.0.2
// @description  Quickly create/select a daily journal item
// @author       Mark Harrison
// @match        https://workflowy.com/*
// @match        https://beta.workflowy.com/*
// @updateUrl    https://github.com/mivok/workflowy-userscripts/raw/master/journal.user.js
// @downloadUrl  https://github.com/mivok/workflowy-userscripts/raw/master/journal.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';
    // Utility functions

    // Find and return the first item with the given tag
    //
    // Example: const item = findTaggedItem(WF.rootItem(), '#mytag');
    function findTaggedItem(item, tag) {
        const myItemTags = WF.getItemTags(item).concat(
            WF.getItemNoteTags(item));
        const myTags = myItemTags.map(t => t.tag);
        if (myTags.includes(tag)) {
            // We found a matching item
            return item
        }
        const tagCounts = item.isMainDocumentRoot() ?
            getRootDescendantTagCounts() :
            item.getTagManager().descendantTagCounts;
        const tagList = tagCounts ? tagCounts.getTagList().map(t => t.tag) : [];
        if (!tagList.includes(tag)) {
            // We don't have a matching tag underneath us
            return null
        }
        for (const child of item.getChildren()) {
            const match = findTaggedItem(child, tag);
            if (match) {
                return match
            }
        }
        // No match
        return null
    }

    // Find and returns all items tagged with a given
    //
    // Example: const items = findTaggedItems(WF.rootItem(), '#mytag');
    function findTaggedItems(item, tag) {
        let found = [];

        // Check the current item first
        const myTags = WF.getItemTags(item).concat(
            WF.getItemNoteTags(item)).map(t => t.tag);
        if (myTags.includes(tag)) {
            // We found a matching item
            found.push(item);
        }

        // Look at tag counts to quickly decide whether to descend into children
        const tagCounts = item.isMainDocumentRoot() ?
            getRootDescendantTagCounts() :
            item.getTagManager().descendantTagCounts;
        const tagList = tagCounts ? tagCounts.getTagList().map(t => t.tag) : [];

        if (tagList.includes(tag)) {
            // The tag counds say that we have some matching items, so go through
            // the chilren
            for (const child of item.getChildren()) {
                found.push(...findTaggedItems(child, tag));
            }
        }
        return found
    }

    // Find a child item matching the given name, or create it if one isn't found.
    //
    // Example: const newItem = findOrCreate(myItem, 'Some Title')
    function findOrCreateItem(parent, name) {
        for (const candidateItem of parent.getChildren()) {
            if (candidateItem.getName().indexOf(name.trim()) != -1) {
                return candidateItem;
            }
        }
        const newItem = WF.createItem(parent);
        WF.setItemName(newItem, name);
        return newItem;
    }

    // Wait until the document has finished loading and the workflowy header
    // is available
    //
    // Example: onHeaderAvailable((header) => { ... });
    function onHeaderAvailable(callback) {
        setTimeout(() => {
            const header = document.querySelector('.header');
            if (header) {
                callback(header);
            } else {
                // Try again until header is available
                onHeaderAvailable(callback)
            }
        }, 500);
    }

    // Add a button to the left of the gear menu
    //
    // Example: addButton('X', doTheThing);
    function addButton(icon, buttonCallback) {
        onHeaderAvailable((header) => {
            const button = document.createElement('div');
            button.innerHTML = icon

            // Style/Hover behavior like existing menu buttons
            button.className = 'extension_button';
            const buttonCss = `
            .extension_button:hover {
                background-color: rgb(66, 72, 75);
            }
            .extension_button {
                font-weight: bold;
                border-radius: 18px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            `;

            // Add the style element, if it's not already there
            if (!document.querySelector("#extension_button_style")) {
                const style = document.createElement('style');
                style.id = 'extension_button_style';
                style.appendChild(document.createTextNode(buttonCss));
                header.insertBefore(style, header.querySelector('.gearMenu'));
            }

            button.addEventListener('click', buttonCallback);
            header.insertBefore(button, header.querySelector('.gearMenu'));
        });
    }

    function getToday() {
        const todayDate = new Date();
        const offset = todayDate.getTimezoneOffset();
        return new Date(todayDate.getTime() - (offset * 60 * 1000));
    }

    // Get today's date in YYYY-MM-DD format
    //
    // Example: const todayStr = getTodayString(); // YYYY-MM-DD
    function getTodayString(date) {
        const dateStrings = date.toUTCString().split(' ');
        return dateStrings[0] + ' ' + dateStrings[2] + ' ' + date.getUTCDate() + ', ' + dateStrings[3] + ' ';
    }

    function getMonthString(date) {
        const monthStrings = date.toUTCString().split(' ');
        return monthStrings[2] + ' ' + monthStrings[3];
    }

    function getTimeString(date) {
        return ('0' + date.getUTCHours()).slice(-2) + ':' + ('0' + date.getUTCMinutes()).slice(-2);
    }

    function getWeekNum(date){
        const today = new Date();
        const year = today.getFullYear()
        const firstDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const firstDateDay = firstDate.getDay() == 0 ? 7 : firstDate.getDay();
        const firstWeekLastDate = 8 - firstDateDay;

        const NthDayToday = Math.floor((today.getTime() - firstDate.getTime())/(24 * 60 * 60 * 1000) + 1);
        const weekNum = Math.ceil((NthDayToday - firstWeekLastDate)/7) +1;

        return `${year} W${('0' + weekNum).slice(-2)}`;
    }

    // Set multiple styles at once
    function setStyle(elem, styles) {
        for (let style in styles) {
            elem.style[style] = styles[style]
        }
    }

    // Add a style element (to add actual CSS from JS)
    function addStylesheet(stylesheet) {
        const element = document.createElement('style')
        element.innerHTML = stylesheet;
        document.head.insertBefore(element, null);
    }

    // Main script

    // The tag to look for as the root of the journal
    const journalItemTag = '#journalroot';

    function createJournalItem() {
        const journalItem = findTaggedItem(WF.rootItem(), journalItemTag);
        if (!journalItem) {
            WF.showMessage(`Unable to find journal root item`, true);
            return;
        }
        const today = getToday();
        const todayStr = getTodayString(today);
       //  const monthStr = getMonthString(today);
        const wnStr = getWeekNum(today);
        // Create child item
        WF.editGroup(function () {
            // Find the month item
            const weekItem = findOrCreateItem(journalItem, wnStr);
            const todayItem = findOrCreateItem(weekItem, todayStr);
            // Select the item and put the cursor in the right place
            WF.zoomTo(todayItem);
            WF.editItemName(todayItem);
        });
    }

    function createInterstitialItem() {
        const journalItem = findTaggedItem(WF.rootItem(), journalItemTag);
        if (!journalItem) {
            WF.showMessage(`Unable to find journal root item`, true);
            return;
        }
        const today = getToday();
        const todayStr = getTodayString(today);
       //  const monthStr = getMonthString(today);
        const wnStr = getWeekNum(today);
        const timeStr = getTimeString(today);
        // Create child item
        WF.editGroup(function () {
            // Find the month item
            const weekItem = findOrCreateItem(journalItem, wnStr);
            const todayItem = findOrCreateItem(weekItem, todayStr);
            const timeItem = findOrCreateItem(todayItem, timeStr);
            const target = findOrCreateItem(timeItem, '');
            // Select the item and put the cursor in the right place
            WF.zoomTo(todayItem);
            WF.moveItems([timeItem], todayItem, 999);
            WF.expandItem(timeItem);
            WF.editItemName(timeItem);
        });
    }

    // Pencil symbol
    addButton('&#9998;', createJournalItem);
    // Add keyboard shortcut
    document.addEventListener("keydown", function (event) {
        if (!event.altKey && event.shiftKey &&
            event.ctrlKey && !event.metaKey && event.key === "J") {
            createJournalItem();
            event.preventDefault();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (!event.altKey && event.shiftKey &&
            event.ctrlKey && !event.metaKey && event.key === "I") {
            createInterstitialItem();
            event.preventDefault();
        }
    });
})();
