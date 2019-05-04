# NorJS Event Observer Library

This is a library which implements an interface to trigger and listen events from 
[The NorJS Event Service](https://github.com/norjs/event-service).

### Design

It is a NodeJS library which can connect to a local event service running on the system and through 
it possibly connect to multiple top level event servers and services running on other systems. 

Communication between the library and local service is implemented using long polling HTTP over 
local UNIX socket file.

### Install

`npm install @norjs/event`

### Usage

### Command line usage

Wait for an event:

```
if NODE_CONNECT=/path/to/socket.sock nor-event --wait=foo; then
  echo Event happened
else
  echo Timeout happened
fi
```

Trigger an event:

```
NODE_CONNECT=/path/to/socket.sock nor-event --trigger=foo --payload='{"hello":"world"}'
```
