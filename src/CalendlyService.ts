import CalendarBaseService from "./CalendarBaseService";
import axios from "axios";

interface CalendlyEvent {
  date: string;
  status: string;
  spots: Array<{
    status: string;
    start_time: string;
    invitees_remaining: number;
  }>;
}

interface CalendlyEventType {
  uuid: string;
  scheduling_link: {
    uid: string;
  };
  location_configurations: Array<{
    id: number;
    kind: string;
    position: number;
    location: string | null;
    conferencing_configured: boolean;
    data: string;
  }>;
}

interface BookEventRequest {
  event: {
    start_time: string;
    location_configuration: {
      kind: string;
      location?: string | null;
      data?: string;
    };
    guests: any[];
  };
  invitee: {
    timezone: string;
    time_notation: string;
    full_name: string;
    email: string;
  };
  scheduling_link_uuid: string;
  event_type_uuid: string;
}

interface BookEventResponse {
  uri: string;
  uuid: string;
  event: {
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    location_type: string;
  };
  invitee: {
    email: string;
    full_name: string;
    timezone: string;
  };
}

class CalendlyService extends CalendarBaseService {
  private static readonly BASE_URL = "https://calendly.com/api/booking";
  private profileSlug: string;
  private eventTypeSlug: string;

  constructor(url: string) {
    super();
    this.profileSlug = url.split("/")[3];
    this.eventTypeSlug = url.split("/")[4];
  }

  public async getAvailableEvents(): Promise<CalendlyEvent[]> {
    try {
      const eventType = await this.fetchEventTypeDetails();
      const dateRange = this.calculateDateRange(7);
      const availableEvents = await this.fetchAvailability(
        eventType,
        dateRange
      );
      return availableEvents;
    } catch (error) {
      console.error("Error fetching Calendly events:", error);
      throw new Error("Failed to fetch available events from Calendly");
    }
  }

  public async bookEvent(eventData: {
    startTime: string;
    fullName: string;
    email: string;
  }): Promise<BookEventResponse> {
    try {
      const eventType = await this.fetchEventTypeDetails();
      const locationConfig = this.getLocationConfiguration(eventType);
      const bookingPayload = this.createBookingPayload(
        eventData,
        eventType,
        locationConfig
      );
      return await this.sendBookingRequest(bookingPayload);
    } catch (error) {
      console.error("Error booking Calendly event:", error);
      throw new Error("Failed to book event with Calendly");
    }
  }

  private async fetchEventTypeDetails(): Promise<CalendlyEventType> {
    const url = `${CalendlyService.BASE_URL}/event_types/lookup?event_type_slug=${this.eventTypeSlug}&profile_slug=${this.profileSlug}`;
    const response = await axios.get(url);
    return response.data;
  }

  private calculateDateRange(daysAhead: number): {
    startDate: string;
    endDate: string;
  } {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);

    return {
      startDate: this.formatDate(today),
      endDate: this.formatDate(endDate),
    };
  }

  private async fetchAvailability(
    eventType: CalendlyEventType,
    dateRange: { startDate: string; endDate: string }
  ): Promise<CalendlyEvent[]> {
    const url = this.buildAvailabilityUrl(eventType, dateRange);
    const response = await axios.get(url);
    return response.data.days;
  }

  private buildAvailabilityUrl(
    eventType: CalendlyEventType,
    dateRange: { startDate: string; endDate: string }
  ): string {
    return (
      `${CalendlyService.BASE_URL}/event_types/${eventType.uuid}/calendar/range?` +
      `timezone=Asia%2FCalcutta&` +
      `diagnostics=false&` +
      `range_start=${dateRange.startDate}&` +
      `range_end=${dateRange.endDate}&` +
      `scheduling_link_uuid=${eventType.scheduling_link.uid}`
    );
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }


  private getLocationConfiguration(eventType: CalendlyEventType) {
    return eventType.location_configurations &&
      eventType.location_configurations.length > 0
      ? eventType.location_configurations[0]
      : { kind: "google_conference", location: null, data: "" };
  }

  private createBookingPayload(
    eventData: { startTime: string; fullName: string; email: string },
    eventType: CalendlyEventType,
    locationConfig: { kind: string; location: string | null; data: string }
  ): BookEventRequest {
    return {
      event: {
        start_time: eventData.startTime,
        location_configuration: {
          kind: locationConfig.kind,
          location: locationConfig.location,
          data: locationConfig.data,
        },
        guests: [],
      },
      invitee: {
        timezone: "Asia/Calcutta",
        time_notation: "12h",
        full_name: eventData.fullName,
        email: eventData.email,
      },
      scheduling_link_uuid: eventType.scheduling_link.uid,
      event_type_uuid: eventType.uuid,
    };
  }

  private async sendBookingRequest(
    bookingPayload: BookEventRequest
  ): Promise<BookEventResponse> {
    const response = await axios.post(
      `${CalendlyService.BASE_URL}/invitees`,
      bookingPayload
    );
    return response.data;
  }
}

export default CalendlyService;
