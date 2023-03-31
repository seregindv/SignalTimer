var currentTime, timeLeft, targetTime, worker;
var currentDate, targetDate, minutesLeft;
var working = false;
var dash = 300, dot = 100, pause = 300;

window.onload = function () {
    currentTime = document.querySelector("#currentTime");
    timeLeft = document.querySelector("#timeLeft");
    targetTime = document.querySelector("#targetTime")

    // add eventListener for tizenhwkey
    document.addEventListener('tizenhwkey', function (e) {
        if (e.keyName == "back")
            try {
                tizen.power.release("SCREEN");
                tizen.application.getCurrentApplication().exit();
            } catch (ignore) {
            }
    });

    worker = new Worker("js/worker.js");    //load from directory
    worker.onmessage = run;
};

function run(e) {
    currentDate = new Date();
    showCurrentTime(currentDate);
    var vibratePattern;

    if (!working)
        return;

    tizen.power.turnScreenOn();        // forcefully turn the screen on
    tizen.power.request("SCREEN", "SCREEN_DIM")

    var seconds = getSecondsTill(targetDate);
    var minutes = getMinutes(seconds);
    if (seconds < 60) {
        switch (seconds) {
            case 15:
                vibratePattern = [dot, pause, dot, pause, dot, pause];
                break;
            case 30:
                vibratePattern = [dot, pause, dot];
                break;
            case 45:
                vibratePattern = [dot];
                break;
        }
    }
    else if (minutes !== minutesLeft) {
        minutesLeft = minutes;
        vibratePattern = getBin(minutesLeft, dash, dot, pause)
    }
    timeLeft.innerHTML = getTimeLeftString(minutes, seconds);
    if (seconds === 0) {
        stop();
    }
    if (vibratePattern)
        setTimeout(function () {
            navigator.vibrate(vibratePattern);
        }, 500);                          // just being safe (vibrate after screen is on)
}

function getTimeLeftString(minutes, seconds) {
    var actualMinutes = minutes - 1;
    var actualSeconds = seconds - actualMinutes * 60;
    if (actualSeconds === 60) {
        ++actualMinutes;
        actualSeconds = 0;
    }
    return format2Digits(actualMinutes) + ":" + format2Digits(actualSeconds);
}

function showCurrentTime(now) {
    currentTime.innerHTML = format2Digits(now.getHours()) + ":" + format2Digits(now.getMinutes()) + ":" + format2Digits(now.getSeconds());
}

function format2Digits(value) {
    if (value < 10)
        return "0" + value;
    return value;
}

function start() {
    var times = /(\d{2})(\d{2})/.exec(targetTime.value);
    if (times.length < 3)
        return;
    var hour = parseInt(times[1]);
    var minute = parseInt(times[2]);
    if (hour === NaN || minute === NaN)
        return;
    targetDate = getDate(hour, minute);
    if (!working)
        working = true;
}

function stop() {
    working = false;
    minutesLeft = 0;
    timeLeft.innerHTML = "&nbsp;";
    tizen.power.release("SCREEN");
}

function getDate(hour, minute) {
    if (!currentDate)
        currentDate = new Date();
    var result = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute);
    if (result < currentDate)
        addDays(result, 1);
    return result;
}

function addDays(date, days) {
    date.setTime(date.getTime() + days * 86400000);
}

function getMinutes(seconds) {
    return Math.ceil(seconds / 60);
}

function getSecondsTill(targetDate) {
    var milliseconds = targetDate - currentDate;
    return Math.ceil(milliseconds / 1000);
}

function getBin(dec, dashLength, dotLength, pauseLength) {
    var result = [];
    if (dec === NaN)
        return result;
    var first = true;
    while (dec > 0) {
        var remainder = dec % 2;
        dec -= remainder;
        dec /= 2;
        if (first)
            first = false;
        else
            result.unshift(pauseLength);

        if (remainder > 0)
            result.unshift(dashLength);
        else
            result.unshift(dotLength);
    }
    return result;
}
