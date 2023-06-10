// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../interfaces/IEvent.sol";

contract ProxyEvent {

  event TicketBought(address indexed _contractEvent, bytes32 indexed _ticketId);

  mapping(address => bool) listenedEvents;

  function addEventToListen(address _event) public {
    listenedEvents[_event] = true;
  }
  
  function emitEvent(address _event, uint256 _tokenId) {
    emit TicketBought(_event, _tokenId);
  }
}
