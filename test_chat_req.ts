async function testChat() {
  const payload = {
    message: "Ankara birinci altılı ganyan kuponu oluştur 80 TL'lik",
    hipodrom: "ANKARA",
    date: "2026-09-17",
    programType: "1. Altılı Ganyan",
    unitPrice: 1.25,
    targetBudget: 80
  };

  try {
    const res = await fetch("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Success:", data.success);
    console.log("Program Type:", data.programType);
    console.log("Ticket Plan Title:", data.ticketPlan?.ticketTitle);
    console.log("Ticket Legs:", data.ticketPlan?.legs?.map((l: any) => `Leg ${l.legIndex} (Race ${l.raceNo}): ${l.chosenRunners?.length} runners`));
    console.log("\nReply tail (last 500 chars):\n", data.reply?.slice(-500));
  } catch (err: any) {
    console.error("Fetch error:", err.message);
  }
}

testChat();
