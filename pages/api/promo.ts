import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case "GET":
        const promoCodes = await db.collection("PromoCodes").find({}).toArray();
        res.status(200).json(promoCodes);
        break;

      case "POST":
        const promoData = req.body;

        if (!promoData.code || !promoData.percentage) {
          res.status(400).json({ error: "Code and percentage are required" });
          return;
        }

        const postResult = await db.collection("PromoCodes").insertOne({
          code: promoData.code,
          percentage: promoData.percentage,
        });

        res.status(201).json(postResult);
        break;

      case "PUT":
        const { id } = req.query;

        if (!id) {
          res.status(400).json({ error: "ID is required" });
          return;
        }

        const putData = req.body;

        if (!putData.code || !putData.percentage) {
          res.status(400).json({ error: "Code and percentage are required" });
          return;
        }

        const putResult = await db.collection("PromoCodes").updateOne(
          { _id: new ObjectId(id as string) },
          {
            $set: {
              code: putData.code,
              percentage: putData.percentage,
            },
          }
        );

        res.status(200).json(putResult);
        break;

      case "DELETE":
        const deleteId = req.query.id;

        if (!deleteId) {
          res.status(400).json({ error: "ID is required" });
          return;
        }

        const deleteResult = await db
          .collection("PromoCodes")
          .deleteOne({ _id: new ObjectId(deleteId as string) });

        res.status(200).json(deleteResult);
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error handling promo:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
