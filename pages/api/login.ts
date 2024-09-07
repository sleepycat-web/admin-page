import { NextApiRequest, NextApiResponse } from "next";
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { username, password, location } = req.body;

    const envUsername = process.env.ADMIN_APP_USERNAME;
    const envPassword = process.env.ADMIN_APP_PASSWORD;

    if (username === envUsername && password === envPassword) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
