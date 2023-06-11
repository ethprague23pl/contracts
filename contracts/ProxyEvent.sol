// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../interfaces/IEvent.sol";

contract ProxyEvent {

  event TicketBought(address indexed _contractEvent, uint256 indexed _ticketId);
  event TicketLeftStage(address indexed _contractEvent, string message);

  mapping(address => bool) listenedEvents;

  function addEventToListen(address _event) public {
    listenedEvents[_event] = true;
  }
  
  function emitEvent(address _event, uint256 _tokenId) public {
    emit TicketBought(_event, _tokenId);
  }

  function emitStageEvent(address _event, string memory _msg) public {
    string memory msg = string(abi.encodePacked('Only ',_msg,' ticket left!'));
    emit TicketLeftStage(_event, msg);
  }
}
