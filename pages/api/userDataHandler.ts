import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { client, db } = await connectToDatabase();

  switch (method) {
    case "GET":
      try {
        const users = await db.collection("UserData").find({}).toArray();
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
      }
      break;

    case "PUT":
      try {
        const { phoneNumber, newName } = req.body;
        await db
          .collection("UserData")
          .updateOne({ phoneNumber }, { $set: { name: newName } });
        res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error updating user" });
      }
      break;

    case "DELETE":
      try {
        const { phoneNumber } = req.body;
        await db.collection("UserData").deleteOne({ phoneNumber });
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error deleting user" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
