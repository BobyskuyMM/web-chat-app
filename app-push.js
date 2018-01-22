firebase.initializeApp({
    messagingSenderId: '148463578166'
});


var bt_delete = $('#delete');

var device_id = $('#device_id');

var token = $('#token');

var form = $('#notification');

var massage_id = $('#massage_id');

var massage_row = $('#massage_row');

var info = $('#info');

var info_message = $('#info-message');

var alert_div = $('#alert');

var alert_message = $('#alert-message');

var input_body = $('#body');

// var timerId = setInterval(setNotificationDemoBody, 10000);


function addZero(i) {
    return i > 9 ? i : '0' + i;
}

// resetUI();

if (window.location.protocol === 'https:' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'localStorage' in window &&
    'fetch' in window &&
    'postMessage' in window
) {
    var messaging = firebase.messaging();

    // already granted
    if (Notification.permission === 'granted') {
        getToken();
    }

    // get permission on subscribe only once


    bt_delete.on('click', function() {
        // Delete Instance ID token.
        messaging.getToken()
            .then(function(currentToken) {
                messaging.deleteToken(currentToken)
                    .then(function() {
                        console.log('Token deleted.');
                        setTokenSentToServer(false);
                        // Once token is deleted update UI.
                        resetUI();
                    })
                    .catch(function(error) {
                        showError('Unable to delete token.', error);
                    });
            })
            .catch(function(error) {
                showError('Error retrieving Instance ID token.', error);
            });
    });

    form.on('submit', function(event) {
        event.preventDefault();

        var notification = {};
        form.find('input').each(function () {
            var input = $(this);
            notification[input.attr('name')] = input.val();
        });

        sendNotification(notification);
    });

    // handle catch the notification on current page
    messaging.onMessage(function(payload) {
        console.log('Message received. ', payload);
        info.show();
        info_message
            .text('')
            .append('<strong>'+payload.notification.title+'</strong>')
            .append('<em> '+payload.notification.body+'</em>')
        ;

        // register fake ServiceWorker for show notification on mobile devices
        navigator.serviceWorker.register('/serviceworker/messaging-sw.js');
        Notification.requestPermission(function(permission) {
            if (permission === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                    payload.notification.data = payload.notification;
                    registration.showNotification(payload.notification.title, payload.notification);
                }).catch(function(error) {
                    // registration failed :(
                    showError('ServiceWorker registration failed.', error);
                });
            }
        });
    });

    // Callback fired if Instance ID token is updated.
    messaging.onTokenRefresh(function() {
        messaging.getToken()
            .then(function(refreshedToken) {
                console.log('Token refreshed.');
                // Send Instance ID token to app server.
                sendTokenToServer(refreshedToken);
                updateUIForPushEnabled(refreshedToken);
            })
            .catch(function(error) {
                showError('Unable to retrieve refreshed token.', error);
            });
    });

} else {
    if (window.location.protocol !== 'https:') {
        showError('Is not from HTTPS');
    } else if (!('Notification' in window)) {
        showError('Notification not supported');
    } else if (!('serviceWorker' in navigator)) {
        showError('ServiceWorker not supported');
    } else if (!('localStorage' in window)) {
        showError('LocalStorage not supported');
    } else if (!('fetch' in window)) {
        showError('fetch not supported');
    } else if (!('postMessage' in window)) {
        showError('postMessage not supported');
    }

    console.warn('This browser does not support desktop notification.');
    console.log('Is HTTPS', window.location.protocol === 'https:');
    console.log('Support Notification', 'Notification' in window);
    console.log('Support ServiceWorker', 'serviceWorker' in navigator);
    console.log('Support LocalStorage', 'localStorage' in window);
    console.log('Support fetch', 'fetch' in window);
    console.log('Support postMessage', 'postMessage' in window);

    updateUIForPushPermissionRequired();
}


function getToken() {
   return ''
}

function sendNotification(notification) {
    var key = 'AAAAIpEebDY:APA91bEiXMw2AbNrE9p85wKcOc-2wWXBKhh4Jlig7x0zavapkIFA_oFBRTWYluD0WB8Yeg-lBAwg-qDDzUHO8d2DdF5-HiBbHRuoNtADATfujR7RWVMzsUJnILyeiFuwuJX6rp_aZ9y0';

    console.log('Send notification', notification);

    enterDeviceToken = device_id.val();



    fetch('https://fcm.googleapis.com/fcm/send', {
        'method': 'POST',
        'headers': {
            'Authorization': 'key=' + key,
            'Content-Type': 'application/json'
        },
        'body': JSON.stringify({
            'notification': notification,
            'to': enterDeviceToken
        })
    });

    
}

// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        console.log('Sending token to server...');
        // send current token to server
        //$.post(url, {token: currentToken});
        setTokenSentToServer(currentToken);
    } else {
        console.log('Token already sent to server so won\'t send it again unless it changes');
    }
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') == currentToken;
}

function setTokenSentToServer(currentToken) {
    if (currentToken) {
        window.localStorage.setItem('sentFirebaseMessagingToken', currentToken);
    } else {
        window.localStorage.removeItem('sentFirebaseMessagingToken');
    }
}

function updateUIForPushEnabled(currentToken) {
    console.log(currentToken);
    token.text(currentToken);

    bt_delete.show();
    form.show();
}

function resetUI() {
    token.text('');
    // bt_register.show();
    bt_delete.show();
    form.show();
    massage_row.hide();
    info.hide();
}

function updateUIForPushPermissionRequired() {
    // bt_register.attr('disabled', 'disabled');
    resetUI();
}

function showError(error, error_data) {
    if (typeof error_data !== "undefined") {
        console.error(error + ' ', error_data);
    } else {
        console.error(error);
    }

    alert_div.show();
    alert_message.html(error);
}