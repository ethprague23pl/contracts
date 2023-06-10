// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IEvent {
    function getTicketPrices() external view returns (uint256, uint256);
    function getOwner() external view returns (address);
}