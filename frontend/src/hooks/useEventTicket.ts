import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import {
  EventTicketEvent,
  EventTicketStruct,
  eventTicketAbi,
  eventTicketAddress,
  isEventTicketConfigured,
} from "@/lib/eventTicket";

export function useEventTicket(refreshKey: number) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const enabled = !!publicClient && isEventTicketConfigured;

  const eventsQuery = useQuery({
    queryKey: ["event-ticket-events", refreshKey, publicClient?.chain?.id],
    enabled,
    queryFn: async (): Promise<EventTicketEvent[]> => {
      if (!publicClient || !eventTicketAddress) return [];

      const totalEvents = (await publicClient.readContract({
        address: eventTicketAddress,
        abi: eventTicketAbi,
        functionName: "totalEvents",
      })) as bigint;

      if (totalEvents === 0n) return [];

      const ids = Array.from({ length: Number(totalEvents) }, (_, index) =>
        BigInt(index + 1)
      );

      const events = await Promise.all(
        ids.map(async (eventId) => {
          const eventData = (await publicClient.readContract({
            address: eventTicketAddress,
            abi: eventTicketAbi,
            functionName: "getEvent",
            args: [eventId],
          })) as EventTicketEvent;

          return eventData;
        })
      );

      return events.filter((event) => event.eventId !== 0n);
    },
  });

  const ticketsQuery = useQuery({
    queryKey: [
      "event-ticket-owner-tickets",
      address,
      refreshKey,
      publicClient?.chain?.id,
    ],
    enabled: enabled && !!address,
    queryFn: async (): Promise<EventTicketStruct[]> => {
      if (!publicClient || !address || !eventTicketAddress) return [];

      const ticketIds = (await publicClient.readContract({
        address: eventTicketAddress,
        abi: eventTicketAbi,
        functionName: "getOwnerTickets",
        args: [address],
      })) as bigint[];

      if (!ticketIds.length) {
        return [];
      }

      const tickets = await Promise.all(
        ticketIds.map(async (ticketId) => {
          const ticketData = (await publicClient.readContract({
            address: eventTicketAddress,
            abi: eventTicketAbi,
            functionName: "getTicket",
            args: [ticketId],
          })) as EventTicketStruct;

          return ticketData;
        })
      );

      return tickets;
    },
  });

  const summary = useMemo(() => {
    if (!isEventTicketConfigured || !eventsQuery.data?.length) {
      return {
        activeEvents: 0,
        totalTickets: 0,
        ticketsSold: 0,
        nextEventDate: undefined as Date | undefined,
      };
    }

    const activeEvents = eventsQuery.data.filter((event) => event.isActive);
    const totalTickets = activeEvents.reduce(
      (acc, event) => acc + Number(event.totalTickets),
      0
    );
    const ticketsSold = activeEvents.reduce(
      (acc, event) => acc + Number(event.ticketsSold),
      0
    );
    const nextEventTimestamp = activeEvents
      .map((event) => Number(event.eventDate) * 1000)
      .filter((timestamp) => timestamp > Date.now())
      .sort((a, b) => a - b)[0];

    return {
      activeEvents: activeEvents.length,
      totalTickets,
      ticketsSold,
      nextEventDate: nextEventTimestamp
        ? new Date(nextEventTimestamp)
        : undefined,
    };
  }, [eventsQuery.data]);

  return { address, eventsQuery, ticketsQuery, summary };
}

