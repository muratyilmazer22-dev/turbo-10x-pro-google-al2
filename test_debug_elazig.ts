async function debugElazig() {
  const res = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Elazığ 1. altılı kuponu oluştur 80 tl",
      hipodrom: "ELAZIĞ",
      date: "2026-09-17",
      programType: "1. Altılı Ganyan",
      unitPrice: 1.25,
      targetBudget: 80
    })
  });
  const data = await res.json();
  console.log("Full reply:\n", data.reply);
  console.log("data keys:", Object.keys(data));
  console.log("races count:", data.races?.length);
  console.log("programType:", data.programType);
}

debugElazig();
