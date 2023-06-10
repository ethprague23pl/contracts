// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IEvent.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "erc721a/contracts/extensions/IERC721AQueryable.sol";
import "./ProxyEvent.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Event is
    Ownable,
    ERC721A,
    IEvent
{

    using Counters for Counters.Counter;

    uint256 public ticketPrice = 0 ether;
    uint256 public maxSellPrice = 0 ether;
    bool public isEventPaused = false;

    address public proxyEventContract;

    event TicketBought(address contractAddress);
    string eventName = "TEST_EVENT";
    string key = "";
    uint256 ticketsCount = 0;

    uint256 currentId = 0;

    mapping(address => bool) proofsOfAttendance;

    Counters.Counter public tokenIdCounter;

    // TODO:
    // Proof of attendance
    // Oznaczamy, ze dany bilet zostal uzyty

    constructor(uint256 _ticketsCount, uint256 _price, uint256 _maxSellPrice, address _proxyEventContract) ERC721A(eventName, key) {
        ticketsCount = _ticketsCount;
        ticketPrice = _price;
        maxSellPrice = _maxSellPrice;
        proxyEventContract = _proxyEventContract;

        tokenIdCounter.increment();
    }

    function getName() public view returns (string memory) {
        return eventName;
    }

    function getOwner() external view returns (address) {
        return owner();
    }

    function buy(uint8 amount) public payable {
        require(!isEventPaused, "EVENT_TICKETS_SALE_IS_CURRENTLY_PAUSED");
        require((msg.value * amount) == (ticketPrice * amount), "ETH_AMOUNT_INVALID");
        require(amount <= ticketsCount, "TICKETS_AMOUNT_EXCEEDED");

        // _mint(msg.sender, amount);
        // ticketsCount -= amount;
        // currentId += amount;
        

        for (uint8 i = 1; i <= amount; i++) {
            uint256 tokenId = tokenIdCounter.current();

            _mint(msg.sender, tokenId);
            ProxyEvent(proxyEventContract).emitEvent(address(this), tokenId);
            
            tokenIdCounter.increment();
        }
    }

    function _baseURI() internal view virtual override(ERC721A) returns (string memory) {
        return "";
    }

    function getTicketPrices()  external view returns (uint256, uint256) {
        return (ticketPrice, maxSellPrice);
    }

    function setIsEventPaused(bool _isMintPaused) public onlyOwner {
        isEventPaused = _isMintPaused;
    }

    function setTicketPrice(uint256 _ticketPrice) public onlyOwner {
        ticketPrice = _ticketPrice;
    }

    function setMaxSellPrice(uint256 _maxSellPrice) public onlyOwner {
        maxSellPrice = _maxSellPrice;
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function _startTokenId() internal view virtual override(ERC721A) returns (uint256) {
        return 1;
    }

    function _tokensOfOwner(address owner) external view returns(uint256[]) {
        return (tokensOfOwner(owner));
    }
    
}
