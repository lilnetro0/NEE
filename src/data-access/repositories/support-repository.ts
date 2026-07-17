import type { NewSupportTicket, SupportTicket } from "@/domain/support";
import type { RequestOptions } from "../options";
import type { Result } from "../result";

export type SupportRepository = {
  submit(ticket: NewSupportTicket, options?: RequestOptions): Promise<Result<SupportTicket>>;
};
