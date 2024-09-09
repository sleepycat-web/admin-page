import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { phoneNumber, newBanStatus } = req.body;
      const { db } = await connectToDatabase();

      let updateOperation;
      if (newBanStatus) {
        // If banning, set banStatus to true and update banDate
        updateOperation = {
          $set: {
            banStatus: true,
            banDate: new Date(),
          },
        };
      } else {
        // If unbanning, set banStatus to false and remove banDate
        updateOperation = {
          $set: { banStatus: false },
          $unset: { banDate: "" },
        };
      }

      const result = await db
        .collection("UserData")
        .updateOne({ phoneNumber }, updateOperation);

      if (result.modifiedCount === 1) {
        res.status(200).json({ success: true });
      } else {
        res
          .status(404)
          .json({
            success: false,
            error: "User not found or ban status not changed",
          });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: "Error updating ban status" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
