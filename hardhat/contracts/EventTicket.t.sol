// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EventTicket} from "./EventTicket.sol";
import {Test} from "forge-std/Test.sol";

contract EventTicketTest is Test {
    EventTicket public ticketContract;

    address public eventCreator = address(0x1);
    address public buyer1 = address(0x2);
    address public buyer2 = address(0x3);

    uint256 public constant TICKET_PRICE = 0.01 ether;
    uint256 public constant TOTAL_TICKETS = 100;
    uint256 public futureDate;

    function setUp() public {
        ticketContract = new EventTicket();
        futureDate = block.timestamp + 30 days;

        // Set up addresses with ETH
        vm.deal(eventCreator, 10 ether);
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
    }

    function test_CreateEvent() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Concert 2024",
            "Amazing concert event",
            futureDate,
            "Madison Square Garden",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        require(eventId == 1, "Event ID should be 1");

        EventTicket.Event memory eventData = ticketContract.getEvent(eventId);
        require(
            keccak256(bytes(eventData.name)) ==
                keccak256(bytes("Concert 2024")),
            "Event name should match"
        );
        require(eventData.creator == eventCreator, "Creator should match");
        require(
            eventData.totalTickets == TOTAL_TICKETS,
            "Total tickets should match"
        );
        require(eventData.price == TICKET_PRICE, "Price should match");
        require(eventData.isActive == true, "Event should be active");
    }

    function test_MintTicket() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Game Night",
            "Basketball game",
            futureDate,
            "Staples Center",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        require(
            ticketContract.balanceOf(buyer1) == 1,
            "Buyer should have 1 ticket"
        );
        require(
            ticketContract.ownerOf(1) == buyer1,
            "Ticket 1 should belong to buyer1"
        );

        EventTicket.Ticket memory ticket = ticketContract.getTicket(1);
        require(
            ticket.eventId == eventId,
            "Ticket should be for correct event"
        );
        require(ticket.owner == buyer1, "Ticket owner should be buyer1");
        require(ticket.isValid == true, "Ticket should be valid");
    }

    function test_MintMultipleTickets() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Festival",
            "Music festival",
            futureDate,
            "Coachella",
            5,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer2);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer2);

        require(
            ticketContract.balanceOf(buyer1) == 2,
            "Buyer1 should have 2 tickets"
        );
        require(
            ticketContract.balanceOf(buyer2) == 1,
            "Buyer2 should have 1 ticket"
        );

        EventTicket.Event memory eventData = ticketContract.getEvent(eventId);
        require(eventData.ticketsSold == 3, "Should have sold 3 tickets");
    }

    function test_TransferTicket() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Concert",
            "Rock concert",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        uint256 ticketId = 1;
        require(
            ticketContract.ownerOf(ticketId) == buyer1,
            "Initial owner should be buyer1"
        );

        vm.prank(buyer1);
        ticketContract.transferFrom(buyer1, buyer2, ticketId);

        require(
            ticketContract.ownerOf(ticketId) == buyer2,
            "New owner should be buyer2"
        );
        require(
            ticketContract.balanceOf(buyer1) == 0,
            "Buyer1 should have 0 tickets"
        );
        require(
            ticketContract.balanceOf(buyer2) == 1,
            "Buyer2 should have 1 ticket"
        );
    }

    function test_ApproveAndTransfer() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        uint256 ticketId = 1;

        vm.prank(buyer1);
        ticketContract.approve(buyer2, ticketId);

        require(
            ticketContract.getApproved(ticketId) == buyer2,
            "Buyer2 should be approved"
        );

        vm.prank(buyer2);
        ticketContract.transferFrom(buyer1, buyer2, ticketId);

        require(
            ticketContract.ownerOf(ticketId) == buyer2,
            "Ticket should be transferred"
        );
    }

    function test_SetApprovalForAll() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer1);
        ticketContract.setApprovalForAll(buyer2, true);

        require(
            ticketContract.isApprovedForAll(buyer1, buyer2) == true,
            "Buyer2 should be approved for all"
        );

        vm.prank(buyer2);
        ticketContract.transferFrom(buyer1, buyer2, 1);

        vm.prank(buyer2);
        ticketContract.transferFrom(buyer1, buyer2, 2);

        require(
            ticketContract.balanceOf(buyer2) == 2,
            "Buyer2 should have both tickets"
        );
    }

    function test_InsufficientPayment() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        vm.expectRevert();
        ticketContract.mintTicket{value: TICKET_PRICE - 1}(eventId, buyer1);
    }

    function test_ExcessPaymentRefund() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        uint256 excessAmount = 0.005 ether;
        uint256 initialBalance = buyer1.balance;

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE + excessAmount}(
            eventId,
            buyer1
        );

        // Buyer should have paid only TICKET_PRICE (excess refunded)
        require(
            buyer1.balance == initialBalance - TICKET_PRICE,
            "Excess should be refunded"
        );
    }

    function test_SoldOutEvent() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            2,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer2);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer2);

        // Try to mint third ticket
        vm.prank(buyer1);
        vm.expectRevert();
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);
    }

    function test_DeactivateEvent() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(eventCreator);
        ticketContract.deactivateEvent(eventId);

        vm.prank(buyer1);
        vm.expectRevert();
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);
    }

    function test_InvalidateTicket() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        uint256 ticketId = 1;

        vm.prank(buyer1);
        ticketContract.invalidateTicket(ticketId);

        EventTicket.Ticket memory ticket = ticketContract.getTicket(ticketId);
        require(ticket.isValid == false, "Ticket should be invalid");
    }

    function test_GetEventTickets() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer2);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer2);

        uint256[] memory eventTicketIds = ticketContract.getEventTickets(
            eventId
        );
        require(eventTicketIds.length == 2, "Should have 2 tickets");
        require(eventTicketIds[0] == 1, "First ticket should be ID 1");
        require(eventTicketIds[1] == 2, "Second ticket should be ID 2");
    }

    function test_GetOwnerTickets() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        uint256[] memory ownerTicketIds = ticketContract.getOwnerTickets(
            buyer1
        );
        require(ownerTicketIds.length == 2, "Buyer1 should have 2 tickets");
        require(ownerTicketIds[0] == 1, "First ticket should be ID 1");
        require(ownerTicketIds[1] == 2, "Second ticket should be ID 2");
    }

    function test_UnauthorizedTransfer() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        vm.prank(buyer2);
        vm.expectRevert();
        ticketContract.transferFrom(buyer1, buyer2, 1);
    }

    function test_PaymentToCreator() public {
        vm.prank(eventCreator);
        uint256 eventId = ticketContract.createEvent(
            "Event",
            "Test event",
            futureDate,
            "Venue",
            TOTAL_TICKETS,
            TICKET_PRICE
        );

        uint256 creatorBalanceBefore = eventCreator.balance;

        vm.prank(buyer1);
        ticketContract.mintTicket{value: TICKET_PRICE}(eventId, buyer1);

        require(
            eventCreator.balance == creatorBalanceBefore + TICKET_PRICE,
            "Creator should receive payment"
        );
    }
}
