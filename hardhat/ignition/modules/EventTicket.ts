import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EventTicketModule", (m) => {
  const eventTicket = m.contract("EventTicket");

  return { eventTicket };
});
