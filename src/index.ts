import CalendlyService from "./CalendlyService";

const url = "https://calendly.com/codingtalks123/30min";

const calendlyService = new CalendlyService(url);

async function main() {
  try {
    const availableEvents = await calendlyService.getAvailableEvents();
    if (!availableEvents.length || !availableEvents[0].spots?.length) {
      console.error("No available time slots found");
      return;
    }
    let firstAvailableSpot = null;
    for (const day of availableEvents) {
      if (day.status === "available" && day.spots && day.spots.length > 0) {
        const availableSpot = day.spots.find(
          (spot) => spot.status === "available" && spot.invitees_remaining > 0
        );
        if (availableSpot) {
          firstAvailableSpot = availableSpot;
          console.log(
            `Found available slot on ${day.date} at ${availableSpot.start_time}`
          );
          break;
        }
      }
    }
    if (!firstAvailableSpot) {
      console.error("No available spots found");
      return;
    }
    console.log(`Attempting to book slot at ${firstAvailableSpot.start_time}`);

    try {
      const bookingResponse = await calendlyService.bookEvent({
        startTime: firstAvailableSpot.start_time,
        fullName: "John Doe",
        email: "john.doe@example.com",
      });

      if (bookingResponse && bookingResponse.uri && bookingResponse.uuid) {
        console.log("✅ Booking successful!");
        console.log(`Event Name: ${bookingResponse.event.name}`);
        console.log(`Start Time: ${bookingResponse.event.start_time}`);
        console.log(`End Time: ${bookingResponse.event.end_time}`);
        console.log(`Booking URI: ${bookingResponse.uri}`);
      } else {
        console.log("❌ Booking process completed but response is incomplete");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Booking failed:", errorMessage);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in main process:", errorMessage);
  }
}

main();
