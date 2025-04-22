abstract class CalendarBaseService {
  protected abstract getAvailableEvents(): void;
  protected abstract bookEvent(eventData: any): void;
}

export default CalendarBaseService;
