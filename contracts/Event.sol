// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Event is
    Ownable,
    ERC721A
{

    uint256 public ticketPrice = 0 ether;
    bool public isEventPaused = false;

    string eventName = "";
    string key = "";
    uint256 ticketsCount = 0;

    // TODO:
    // Proof of attendance
    // Oznaczamy, ze dany bilet zostal uzyty

    constructor(uint256 _ticketsCount, uint256 _price) ERC721A(eventName, key) {
        ticketsCount = _ticketsCount;
        ticketPrice = _price;
    }

    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    function getName() public view returns (string memory) {
        return "EVENT NAME";
    }

    function getUserName(string memory _userName) public view returns (string memory) {
        return _userName;
    }

    function buyZero() public payable {
        // require(!isEventPaused, "EVENT_TICKETS_SALE_IS_CURRENTLY_PAUSED");
        // require((msg.value * amount) == (ticketPrice * amount), "ETH_AMOUNT_INVALID");
        // require(amount <= ticketsCount, "TICKETS_AMOUNT_EXCEEDED");

        // _safeMint(msg.sender, amount);
        // ticketsCount += amount;
    }

    function buy(uint8 amount) public payable {
        // require(!isEventPaused, "EVENT_TICKETS_SALE_IS_CURRENTLY_PAUSED");
        // require((msg.value * amount) == (ticketPrice * amount), "ETH_AMOUNT_INVALID");
        // require(amount <= ticketsCount, "TICKETS_AMOUNT_EXCEEDED");

        // _safeMint(msg.sender, amount);
        // ticketsCount += amount;
    }

    function _baseURI() internal view virtual override(ERC721A) returns (string memory) {
        return "";
    }

    function setIsEventPaused(bool _isMintPaused) public onlyOwner {
        isEventPaused = _isMintPaused;
    }

    function setTicketPrice(uint256 _ticketPrice) public onlyOwner {
        ticketPrice = _ticketPrice;
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function _startTokenId() internal view virtual override(ERC721A) returns (uint256) {
        return 1;
    }
}
