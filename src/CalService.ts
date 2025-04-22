import CalendarBaseService from "./CalendarBaseService";

class CalService extends CalendarBaseService {
  public getAvailableEvents(): void {
    throw new Error("Method not implemented.");
  }

  public bookEvent(eventData: any): void {
    throw new Error("Method not implemented.");
  }
}

export default CalService;
