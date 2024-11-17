export async function GET() {  // for App Router
  return Response.json({ 
    time: new Date().toString(),
    timeIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  })
}