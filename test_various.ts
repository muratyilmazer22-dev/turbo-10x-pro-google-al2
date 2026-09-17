async function testVarious() {
  const testCases = [
    {
      name: "User message 1",
      message: "Tüm hipodromlarda birinci altılıyı yapmıyor sistem metin olarak belirttiğimde birinci altılıyı şu bütçede yap diye sadece direk ikinci altılı veriyor düzeltelim bu durumu",
      hipodrom: "İSTANBUL",
      programType: "1. Altılı Ganyan"
    },
    {
      name: "User message 2",
      message: "Birinci altılı hala oluşturmuyor hata devam ediyor",
      hipodrom: "ANKARA",
      programType: "1. Altılı Ganyan"
    },
    {
      name: "Istanbul 1. altili",
      message: "İstanbul birinci altılıyı 80 TL bütçeyle yap",
      hipodrom: "İSTANBUL",
      programType: "1. Altılı Ganyan"
    },
    {
      name: "Elazig 1. altili",
      message: "Elazığ 1. altılı kuponu oluştur 80 tl",
      hipodrom: "ELAZIĞ",
      programType: "1. Altılı Ganyan"
    },
    {
      name: "Izmir 1. altili",
      message: "İzmir 1. altılı yap 80 tl",
      hipodrom: "İZMİR",
      programType: "1. Altılı Ganyan"
    },
    {
      name: "Kocaeli 1. altili",
      message: "Kocaeli birinci altılı ganyan 80 tl",
      hipodrom: "KOCAELİ",
      programType: "1. Altılı Ganyan"
    }
  ];

  for (const tc of testCases) {
    console.log(`\n--- TESTING: ${tc.name} ---`);
    console.log(`Prompt: "${tc.message}" | Hipo: ${tc.hipodrom}`);
    const res = await fetch("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: tc.message,
        hipodrom: tc.hipodrom,
        date: "2026-09-17",
        programType: tc.programType,
        unitPrice: 1.25,
        targetBudget: 80
      })
    });
    const data = await res.json();
    console.log("Success:", data.success);
    console.log("Program:", data.programType);
    console.log("Ticket Title:", data.ticketPlan?.ticketTitle);
    console.log("Ticket Legs:", data.ticketPlan?.legs?.map((l: any) => `Leg ${l.legIndex} (Race ${l.raceNo}): ${l.chosenRunners?.length} runners`));
    console.log("Strict final lines:\n" + data.reply?.split('\n').filter((l: string) => /^\d+\.koşu/i.test(l)).join('\n'));
  }
}

testVarious();
