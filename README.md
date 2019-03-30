# NorJS Event Observer Library

This is a library which implements an interface to trigger and listen events from 
(https://github.com/norjs/event-service)[The NorJS Event Service].

### Design

It is a NodeJS library which can connect to a local event service running on the system and through 
it possibly connect to multiple top level event servers and services running on other systems. 

Communication between the library and local service is implemented using long polling HTTP over 
local UNIX socket file.
