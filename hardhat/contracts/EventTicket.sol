// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title EventTicket
 * @dev An on-chain NFT ticketing system for games and events
 * @notice All event and ticket data is stored on-chain
 */
contract EventTicket {
    // Event structure to store event information on-chain
    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 eventDate;
        string venue;
        address creator;
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 price; // Price in wei
        bool isActive;
    }

    // Ticket structure to store ticket information on-chain
    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        uint256 purchasePrice;
        uint256 purchaseTime;
        bool isValid;
    }

    // Mapping from event ID to Event
    mapping(uint256 => Event) public events;

    // Mapping from ticket ID to Ticket
    mapping(uint256 => Ticket) public tickets;

    // Mapping from event ID to array of ticket IDs
    mapping(uint256 => uint256[]) public eventTickets;

    // Mapping from owner address to array of ticket IDs they own
    mapping(address => uint256[]) public ownerTickets;

    // Mapping from owner to ticket count
    mapping(address => uint256) public balanceOf;

    // Mapping from ticket ID to approved address
    mapping(uint256 => address) public getApproved;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    // Total number of events created
    uint256 public totalEvents;

    // Total number of tickets minted
    uint256 public totalTickets;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        string name,
        address indexed creator,
        uint256 totalTickets,
        uint256 price
    );

    event TicketMinted(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed owner,
        uint256 price
    );

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed ticketId
    );

    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed ticketId
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    // Modifiers
    modifier onlyEventCreator(uint256 eventId) {
        require(
            events[eventId].creator == msg.sender,
            "Only event creator can perform this action"
        );
        _;
    }

    modifier validEvent(uint256 eventId) {
        require(
            events[eventId].isActive,
            "Event does not exist or is not active"
        );
        require(
            events[eventId].ticketsSold < events[eventId].totalTickets,
            "Event is sold out"
        );
        _;
    }

    modifier validTicket(uint256 ticketId) {
        require(
            tickets[ticketId].isValid,
            "Ticket does not exist or is invalid"
        );
        _;
    }

    /**
     * @dev Create a new event
     * @param name Name of the event
     * @param description Description of the event
     * @param eventDate Unix timestamp of the event date
     * @param venue Venue location
     * @param totalTickets Total number of tickets available
     * @param price Price per ticket in wei
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 eventDate,
        string memory venue,
        uint256 totalTickets,
        uint256 price
    ) public returns (uint256) {
        require(bytes(name).length > 0, "Event name cannot be empty");
        require(totalTickets > 0, "Must have at least one ticket");
        require(
            eventDate > block.timestamp,
            "Event date must be in the future"
        );

        totalEvents++;
        uint256 eventId = totalEvents;

        events[eventId] = Event({
            eventId: eventId,
            name: name,
            description: description,
            eventDate: eventDate,
            venue: venue,
            creator: msg.sender,
            totalTickets: totalTickets,
            ticketsSold: 0,
            price: price,
            isActive: true
        });

        emit EventCreated(eventId, name, msg.sender, totalTickets, price);
        return eventId;
    }

    /**
     * @dev Mint a ticket for an event
     * @param eventId The ID of the event
     * @param to The address to mint the ticket to
     */
    function mintTicket(
        uint256 eventId,
        address to
    ) public payable validEvent(eventId) {
        require(to != address(0), "Cannot mint to zero address");
        require(msg.value >= events[eventId].price, "Insufficient payment");

        // Refund excess payment
        if (msg.value > events[eventId].price) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - events[eventId].price
            }("");
            require(refundSuccess, "Refund failed");
        }

        // Transfer payment to event creator
        (bool transferSuccess, ) = payable(events[eventId].creator).call{
            value: events[eventId].price
        }("");
        require(transferSuccess, "Payment transfer failed");

        // Mint the ticket
        totalTickets++;
        uint256 ticketId = totalTickets;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            eventId: eventId,
            owner: to,
            purchasePrice: events[eventId].price,
            purchaseTime: block.timestamp,
            isValid: true
        });

        // Update event ticket count
        events[eventId].ticketsSold++;
        eventTickets[eventId].push(ticketId);
        ownerTickets[to].push(ticketId);
        balanceOf[to]++;

        emit TicketMinted(ticketId, eventId, to, events[eventId].price);
        emit Transfer(address(0), to, ticketId);
    }

    /**
     * @dev Transfer a ticket to another address
     * @param from The current owner
     * @param to The new owner
     * @param ticketId The ticket ID to transfer
     */
    function transferFrom(
        address from,
        address to,
        uint256 ticketId
    ) public validTicket(ticketId) {
        require(
            tickets[ticketId].owner == from,
            "Ticket not owned by from address"
        );
        require(
            msg.sender == from ||
                msg.sender == getApproved[ticketId] ||
                isApprovedForAll[from][msg.sender],
            "Not authorized to transfer"
        );
        require(to != address(0), "Cannot transfer to zero address");

        _transfer(from, to, ticketId);
    }

    /**
     * @dev Safe transfer a ticket (checks if recipient can handle ERC721)
     * @param from The current owner
     * @param to The new owner
     * @param ticketId The ticket ID to transfer
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 ticketId
    ) public {
        safeTransferFrom(from, to, ticketId, "");
    }

    /**
     * @dev Safe transfer a ticket with data
     * @param from The current owner
     * @param to The new owner
     * @param ticketId The ticket ID to transfer
     * @param data Additional data
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 ticketId,
        bytes memory data
    ) public {
        transferFrom(from, to, ticketId);
        // In a full ERC721 implementation, we would check if recipient is a contract
        // and call onERC721Received. For simplicity, we'll skip that here.
    }

    /**
     * @dev Approve an address to transfer a specific ticket
     * @param approved The address to approve
     * @param ticketId The ticket ID
     */
    function approve(
        address approved,
        uint256 ticketId
    ) public validTicket(ticketId) {
        require(tickets[ticketId].owner == msg.sender, "Not the ticket owner");
        getApproved[ticketId] = approved;
        emit Approval(msg.sender, approved, ticketId);
    }

    /**
     * @dev Approve or revoke approval for an operator
     * @param operator The operator address
     * @param approved Whether to approve or revoke
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Cannot approve self");
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev Get the owner of a ticket
     * @param ticketId The ticket ID
     * @return The owner address
     */
    function ownerOf(
        uint256 ticketId
    ) public view validTicket(ticketId) returns (address) {
        return tickets[ticketId].owner;
    }

    /**
     * @dev Get event details
     * @param eventId The event ID
     * @return Event struct
     */
    function getEvent(uint256 eventId) public view returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get ticket details
     * @param ticketId The ticket ID
     * @return Ticket struct
     */
    function getTicket(uint256 ticketId) public view returns (Ticket memory) {
        return tickets[ticketId];
    }

    /**
     * @dev Get all ticket IDs for an event
     * @param eventId The event ID
     * @return Array of ticket IDs
     */
    function getEventTickets(
        uint256 eventId
    ) public view returns (uint256[] memory) {
        return eventTickets[eventId];
    }

    /**
     * @dev Get all ticket IDs owned by an address
     * @param owner The owner address
     * @return Array of ticket IDs
     */
    function getOwnerTickets(
        address owner
    ) public view returns (uint256[] memory) {
        return ownerTickets[owner];
    }

    /**
     * @dev Invalidate a ticket (e.g., after event or refund)
     * @param ticketId The ticket ID to invalidate
     */
    function invalidateTicket(uint256 ticketId) public validTicket(ticketId) {
        require(
            tickets[ticketId].owner == msg.sender ||
                events[tickets[ticketId].eventId].creator == msg.sender,
            "Not authorized to invalidate ticket"
        );
        tickets[ticketId].isValid = false;
    }

    /**
     * @dev Deactivate an event (stop selling tickets)
     * @param eventId The event ID
     */
    function deactivateEvent(uint256 eventId) public onlyEventCreator(eventId) {
        events[eventId].isActive = false;
    }

    /**
     * @dev Internal transfer function
     */
    function _transfer(address from, address to, uint256 ticketId) internal {
        // Remove from old owner's list
        uint256[] storage fromTickets = ownerTickets[from];
        for (uint256 i = 0; i < fromTickets.length; i++) {
            if (fromTickets[i] == ticketId) {
                fromTickets[i] = fromTickets[fromTickets.length - 1];
                fromTickets.pop();
                break;
            }
        }
        balanceOf[from]--;

        // Add to new owner's list
        ownerTickets[to].push(ticketId);
        balanceOf[to]++;

        // Update ticket owner
        tickets[ticketId].owner = to;
        getApproved[ticketId] = address(0);

        emit Transfer(from, to, ticketId);
    }

    /**
     * @dev ERC721 Metadata support (simplified)
     */
    function name() public pure returns (string memory) {
        return "Event Ticket";
    }

    function symbol() public pure returns (string memory) {
        return "TICKET";
    }

    function tokenURI(
        uint256 ticketId
    ) public view validTicket(ticketId) returns (string memory) {
        // Return a simple on-chain URI representation
        // In production, you might want to generate a more detailed JSON
        Ticket memory ticket = tickets[ticketId];
        Event memory eventData = events[ticket.eventId];

        return
            string(
                abi.encodePacked(
                    "Event: ",
                    eventData.name,
                    " | Ticket ID: ",
                    _uint2str(ticketId),
                    " | Owner: ",
                    _address2str(ticket.owner)
                )
            );
    }

    // Helper functions for string conversion
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function _address2str(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
