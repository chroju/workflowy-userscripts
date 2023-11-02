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
