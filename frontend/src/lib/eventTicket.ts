import type { Address } from "viem";
import artifact from "@/contracts/EventTicket.json";

export const eventTicketAbi = artifact.abi;

const addressFromEnv = process.env
  .NEXT_PUBLIC_EVENT_TICKET_ADDRESS as Address | undefined;

export const eventTicketAddress = addressFromEnv;
export const isEventTicketConfigured = Boolean(addressFromEnv);

export type EventTicketEvent = {
  eventId: bigint;
  name: string;
  description: string;
  eventDate: bigint;
  venue: string;
  creator: Address;
  totalTickets: bigint;
  ticketsSold: bigint;
  price: bigint;
  isActive: boolean;
};

export type EventTicketStruct = {
  ticketId: bigint;
  eventId: bigint;
  owner: Address;
  purchasePrice: bigint;
  purchaseTime: bigint;
  isValid: boolean;
};

