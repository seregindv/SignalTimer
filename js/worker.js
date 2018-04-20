function timedCount() {
    postMessage(0);                     //send data   
    setTimeout("timedCount()",1000);    // set vibration interval (or use specific time)
}

timedCount();