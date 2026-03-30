fetch("https://oeleyonqaowubcfreqoy.supabase.co/functions/v1/create-razorpay-order", {
  method: "POST",
  body: JSON.stringify({ projectId: "123", amount: 100 }),
  headers: { "Content-Type": "application/json" }
})
.then(res => res.text())
.then(text => console.log("Response from server:", text))
.catch(console.error);
