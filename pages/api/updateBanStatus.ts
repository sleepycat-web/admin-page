import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, UpdateFilter } from "mongodb";

// Define the structure of your user document
interface UserDocument extends Document {
  phoneNumber: string;
  banStatus: boolean;
  banDate?: Date;
  banHistory?: Array<{
    date: Date;
    reason: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { phoneNumber, newBanStatus, banReason } = req.body;
      const { db } = await connectToDatabase();

      const currentDate = new Date();

      let updateOperation: UpdateFilter<UserDocument>;

      if (newBanStatus) {
        updateOperation = {
          $set: {
            banStatus: true,
            banDate: currentDate,
          },
          $push: {
            banHistory: {
              date: currentDate,
              reason: banReason,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any, 
          },
        };
      } else {
        updateOperation = {
          $set: { banStatus: false },
          $unset: { banDate: "" },
        };
      }

      const result = await db
        .collection<UserDocument>("UserData")
        .findOneAndUpdate({ phoneNumber }, updateOperation, {
          returnDocument: "after",
        });

      if (result) {
        res.status(200).json({
          success: true,
          banHistory: result.banHistory || [],
        });
      } else {
        res.status(404).json({
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
