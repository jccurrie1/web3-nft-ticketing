"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import {
  CalendarDays,
  Loader2,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import { useEventTicket } from "@/hooks/useEventTicket";
import {
  EventTicketEvent,
  EventTicketStruct,
  eventTicketAbi,
  eventTicketAddress,
} from "@/lib/eventTicket";

type FormNotice = {
  label: string;
  tone: "success" | "error";
};

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const publicClient = usePublicClient();
  const { address, status, isConnected } = useAccount();
  const { eventsQuery, ticketsQuery, summary } = useEventTicket(refreshKey);
  const { connectors, connect, status: connectStatus, error: connectError } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, isPending: isSubmittingTx } = useWriteContract();

  const [createEventNotice, setCreateEventNotice] = useState<FormNotice>();
  const [mintNotice, setMintNotice] = useState<FormNotice>();

  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    description: "",
    venue: "",
    date: "",
    totalTickets: "",
    price: "",
  });

  const [mintForm, setMintForm] = useState({
    eventId: "",
    recipient: "",
  });

  const events = eventsQuery.data ?? [];
  const selectedEvent = useMemo(() => {
    if (!mintForm.eventId) return undefined;
    try {
      const id = BigInt(mintForm.eventId);
      return (eventsQuery.data ?? []).find((event) => event.eventId === id);
    } catch {
      return undefined;
    }
  }, [eventsQuery.data, mintForm.eventId]);

  const tickets = ticketsQuery.data ?? [];

  const refreshData = () => setRefreshKey((key) => key + 1);

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!publicClient) return;

    setCreateEventNotice(undefined);

    try {
      const timestamp = Math.floor(
        new Date(createEventForm.date).getTime() / 1000
      );
      const totalTickets = BigInt(createEventForm.totalTickets || "0");

      if (!createEventForm.name || !timestamp || timestamp <= 0) {
        throw new Error("Fill out the form with a future event date.");
      }
      if (!createEventForm.totalTickets || totalTickets <= 0n) {
        throw new Error("Provide a ticket supply greater than zero.");
      }
      if (!createEventForm.price) {
        throw new Error("Set a ticket price in ETH.");
      }

      const priceInWei = parseEther(createEventForm.price);

      const hash = await writeContractAsync({
        address: eventTicketAddress,
        abi: eventTicketAbi,
        functionName: "createEvent",
        args: [
          createEventForm.name,
          createEventForm.description,
          BigInt(timestamp),
          createEventForm.venue,
          totalTickets,
          priceInWei,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setCreateEventNotice({
        label: "Event created on-chain.",
        tone: "success",
      });
      setCreateEventForm({
        name: "",
        description: "",
        venue: "",
        date: "",
        totalTickets: "",
        price: "",
      });
      refreshData();
    } catch (error) {
      setCreateEventNotice({
        label:
          error instanceof Error
            ? error.message
            : "Failed to submit transaction.",
        tone: "error",
      });
    }
  };

  const handleMintTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicClient) return;

    if (!mintForm.eventId) {
      setMintNotice({ label: "Select an event before minting.", tone: "error" });
      return;
    }

    let recipient = mintForm.recipient.trim();
    if (!recipient) {
      if (!address) {
        setMintNotice({
          label: "Connect a wallet or enter a recipient address.",
          tone: "error",
        });
        return;
      }
      recipient = address;
    }

    setMintNotice(undefined);

    try {
      const price = selectedEvent?.price ?? 0n;
      const hash = await writeContractAsync({
        address: eventTicketAddress,
        abi: eventTicketAbi,
        functionName: "mintTicket",
        args: [BigInt(mintForm.eventId), recipient],
        value: price,
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setMintNotice({ label: "Ticket minted successfully.", tone: "success" });
      refreshData();
    } catch (error) {
      setMintNotice({
        label:
          error instanceof Error
            ? error.message
            : "Mint transaction failed.",
        tone: "error",
      });
    }
  };

  const renderEventRow = (event: EventTicketEvent) => {
    const soldPct =
      Number(event.totalTickets) === 0
        ? 0
        : Math.round(
            (Number(event.ticketsSold) / Number(event.totalTickets)) * 100
          );

    return (
      <li
        key={event.eventId.toString()}
        className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-white">
              {event.name}{" "}
              {!event.isActive && (
                <span className="ml-2 text-xs text-rose-300">inactive</span>
              )}
            </p>
            <p className="text-xs text-slate-300">
              {new Date(Number(event.eventDate) * 1000).toLocaleString()} •{" "}
              {event.venue}
            </p>
          </div>
          <p className="text-sm font-medium text-emerald-300">
            {formatEther(event.price)} ETH
          </p>
        </div>
        <p className="mt-2 text-slate-200">{event.description}</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-300">
            <span>
              {event.ticketsSold.toString()} / {event.totalTickets.toString()} tickets
            </span>
            <span>{soldPct}% sold</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>
      </li>
    );
  };

  const renderTicketCard = (ticket: EventTicketStruct) => {
    const eventForTicket = events.find(
      (event) => event.eventId === ticket.eventId
    );

    return (
      <li
        key={ticket.ticketId.toString()}
        className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-white">
            Ticket #{ticket.ticketId.toString()}
          </p>
          <span
            className={`text-xs ${
              ticket.isValid ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {ticket.isValid ? "valid" : "invalid"}
          </span>
        </div>
        <p className="mt-1 text-slate-200">{eventForTicket?.name ?? "Event"}</p>
        <p className="text-xs text-slate-400">
          Purchased {new Date(Number(ticket.purchaseTime) * 1000).toLocaleString()}
        </p>
        <p className="mt-2 text-sm text-slate-100">
          Paid {formatEther(ticket.purchasePrice)} ETH
        </p>
      </li>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                EventTicket
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                NFT Ticketing Control Room
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-200">
                Deploy events, mint passes, and inspect wallet ownership against the
                local Hardhat chain without leaving the dashboard.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isConnected ? (
                <>
                  <p className="text-sm text-slate-200">
                    Connected to Hardhat as{" "}
                    <span className="text-white">{address}</span>
                  </p>
                  <button
                    className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300 hover:text-white"
                    onClick={() => disconnect()}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-slate-200">
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => connect({ connector })}
                      className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 transition hover:border-emerald-300 hover:text-white"
                      disabled={connectStatus === "pending"}
                    >
                      <Wallet className="h-4 w-4" />
                      Connect with {connector.name}
                    </button>
                  ))}
                  {connectError && (
                    <p className="text-xs text-rose-300">{connectError.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <SummaryCard
            icon={<CalendarDays className="h-4 w-4 text-emerald-300" />}
            label="Active events"
            value={summary.activeEvents.toString()}
            helper={
              summary.nextEventDate
                ? `Next: ${summary.nextEventDate.toLocaleDateString()}`
                : "No scheduled dates"
            }
          />
          <SummaryCard
            icon={<Ticket className="h-4 w-4 text-emerald-300" />}
            label="Tickets issued"
            value={summary.ticketsSold.toString()}
            helper={`${summary.ticketsSold}/${summary.totalTickets} sold`}
          />
          <SummaryCard
            icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
            label="Wallet status"
            value={isConnected ? "Connected" : "Disconnected"}
            helper={status === "connecting" ? "Waiting for wallet…" : address ?? ""}
          />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-300">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Create an event</h2>
                  <p className="text-sm text-slate-300">
                    Deploy event metadata on the EventTicket contract.
                  </p>
                </div>
              </header>
              <form className="space-y-4" onSubmit={handleCreateEvent}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-200">
                    Event name
                    <input
                      required
                      type="text"
                      placeholder="Devcon"
                      value={createEventForm.name}
                      onChange={(event) =>
                        setCreateEventForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-200">
                    Venue
                    <input
                      required
                      type="text"
                      placeholder="Lisbon"
                      value={createEventForm.venue}
                      onChange={(event) =>
                        setCreateEventForm((prev) => ({
                          ...prev,
                          venue: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="text-sm text-slate-200">
                  Description
                  <textarea
                    required
                    rows={3}
                    placeholder="Biggest hacker meetup"
                    value={createEventForm.description}
                    onChange={(event) =>
                      setCreateEventForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-200">
                    Date & time
                    <input
                      required
                      type="datetime-local"
                      value={createEventForm.date}
                      onChange={(event) =>
                        setCreateEventForm((prev) => ({
                          ...prev,
                          date: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-200">
                    Ticket supply
                    <input
                      required
                      min={1}
                      type="number"
                      value={createEventForm.totalTickets}
                      onChange={(event) =>
                        setCreateEventForm((prev) => ({
                          ...prev,
                          totalTickets: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="text-sm text-slate-200">
                  Ticket price (ETH)
                  <input
                    required
                    min={0}
                    type="number"
                    step="0.0001"
                    value={createEventForm.price}
                    onChange={(event) =>
                      setCreateEventForm((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmittingTx || status !== "connected"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400/90 px-4 py-3 text-base font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
                >
                  {isSubmittingTx ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Broadcasting…
                    </>
                  ) : (
                    "Create event"
                  )}
                </button>
                {createEventNotice && (
                  <p
                    className={`text-sm ${
                      createEventNotice.tone === "success"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {createEventNotice.label}
                  </p>
                )}
              </form>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-300">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Mint a ticket</h2>
                  <p className="text-sm text-slate-300">
                    Sell primary tickets directly from the contract.
                  </p>
                </div>
              </header>
              <form className="space-y-4" onSubmit={handleMintTicket}>
                <label className="text-sm text-slate-200">
                  Event
                  <select
                    required
                    value={mintForm.eventId}
                    onChange={(event) =>
                      setMintForm((prev) => ({
                        ...prev,
                        eventId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select an active event
                    </option>
                    {events.map((event) => (
                      <option
                        key={event.eventId.toString()}
                        value={event.eventId.toString()}
                      >
                        #{event.eventId.toString()} · {event.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-200">
                  Recipient wallet
                  <input
                    type="text"
                    placeholder="0x… (defaults to your wallet)"
                    value={mintForm.recipient}
                    onChange={(event) =>
                      setMintForm((prev) => ({
                        ...prev,
                        recipient: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                {selectedEvent && (
                  <p className="text-sm text-slate-300">
                    Price: {formatEther(selectedEvent.price)} ETH
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingTx || status !== "connected"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-3 text-base font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:bg-white/10"
                >
                  {isSubmittingTx ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Minting…
                    </>
                  ) : (
                    "Mint ticket"
                  )}
                </button>
                {mintNotice && (
                  <p
                    className={`text-sm ${
                      mintNotice.tone === "success"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {mintNotice.label}
                  </p>
                )}
              </form>
            </article>
          </div>

          <aside className="space-y-8">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Live events</h2>
                  <p className="text-sm text-slate-300">
                    Reading directly from {eventTicketAddress}
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-emerald-300 hover:text-white"
                >
                  Refresh
                </button>
              </header>
              {eventsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching events…
                </div>
              ) : events.length ? (
                <ul className="space-y-4">{events.map(renderEventRow)}</ul>
              ) : (
                <p className="text-sm text-slate-300">
                  No events yet — deploy one above.
                </p>
              )}
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <header className="mb-4">
                <h2 className="text-lg font-semibold">Tickets in wallet</h2>
                <p className="text-sm text-slate-300">
                  Owner snapshot for {address ?? "—"}
                </p>
              </header>
              {ticketsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching tickets…
                </div>
              ) : tickets.length ? (
                <ul className="space-y-3">{tickets.map(renderTicketCard)}</ul>
              ) : (
                <p className="text-sm text-slate-300">
                  {isConnected
                    ? "This wallet does not own any tickets yet."
                    : "Connect a wallet to view owned tickets."}
                </p>
              )}
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-300">
        <span className="rounded-full bg-emerald-500/10 p-2">{icon}</span>
        {label}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {helper && <p className="mt-1 text-sm text-slate-400">{helper}</p>}
    </div>
  );
}
