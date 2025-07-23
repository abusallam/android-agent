<p align="center">
<img src="ourlogo" height="60"><br>
A cloud based remote android managment suite, powered by NodeJS
</p>



## Features
- GPS Logging
- Microphone Recording
- View Contacts
- SMS Logs
- Send SMS
- Call Logs
- View Installed Apps
- View Stub Permissions
- Live Clipboard Logging
- Live Notification Logging
- View WiFi Networks (logs previously seen)
- File Explorer & Downloader
- Command Queuing
- Built In APK Builder

## Prerequisites
- Docker
- Docker Compose

## Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/abusallam/android-agent.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd android-agent
    ```
3.  Start the application using Docker Compose:
    ```bash
    docker-compose up --build
    ```
4.  In your browser, navigate to `http://<SERVER IP>:22533`.

The default credentials are:
-   **Username:** admin
-   **Password:** admin

You can change the credentials by editing the `docker-compose.yml` file.

## Notes
When opening an issue, you **MUST** use the provided templates. Issues without this will not recieve support quickly and will be put to the bottom of the figurative pile.

Please have a look through the current issues, open and closed to see if your issue has been addressed before. If it's java related, it's most definitely been addressed - In short Use Java 1.8.0

## Screenshots
| | | |
|:-------------------------:|:-------------------------:|:-------------------------:|
|<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/call_log.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/call_log.png"> Call Log</a> | <a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/apk_builder.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/apk_builder.png"> APK Builder</a> |<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/clipboard.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/clipboard.png"> Clipboard Log</a>||
<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/contacts.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/contacts.png"> Contacts</a>  |  <a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/devices.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/devices.png"> Devices</a>|<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/file_explorer.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/file_explorer.png"> File Explorer</a>||
<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/gps_log.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/gps_log.png"> GPS Log</a>  | <a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/sms_log.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/sms_log.png"> SMS Log</a> |<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/sms_send.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/sms_send.png"> Send SMS</a>||
<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/installed_apps.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/installed_apps.png"> Installed Apps</a> | <a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/microphone.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/microphone.png"> Microphone</a> |<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/notification_log.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/notification_log.png"> Notifications</a>||
<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/event_log.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/event_log.png"> Event Log</a> | <a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/login.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/login.png"> Login</a> |<a href="https://github.com/D3VL/L3MON/raw/master/Screenshots/wifi_manager.png"> <img width="1604" src="https://github.com/D3VL/L3MON/raw/master/Screenshots/wifi_manager.png"> WiFi Manager</a>|

## Thanks
We utilized serveral opensource softwares, Without these, L3MON Wouldn't be what it is!
 - Inspiration for the project and the basic building blocks for the Android App are based off [AhMyth](https://github.com/AhMyth/AhMyth-Android-RAT) 
 - [express](https://github.com/expressjs/express)
 - [node-geoip](https://github.com/bluesmoon/node-geoip)
 - [lowdb](https://github.com/typicode/lowdb)
 - [socket.io](https://github.com/socketio/socket.io)
 - [Open Street Map](https://www.openstreetmap.org)
 - [Leaflet](https://leafletjs.com/)
