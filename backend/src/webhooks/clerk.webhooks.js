import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/backend/webhooks";


const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
        if (!signingSecret) {
            return res.status(503).json({ error: "Webhook signing secret is not configured" });
        }

        const payload = Buffer.from(req.body) ? req.body.toString("utf-8") : String(req.body);
        const request = new Request("https://iternal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload
        })

        const evt = await verifyWebhook(request, { signingSecret });

        if (evt.type === "user.created" || evt.type === "user.updated") {
            const u = evt.data;

            const email =
                u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address
                ?? u.email_addresses?.[0]?.email_address;

            const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                u.username || email?.split("@")[0];

            await User.findOneAndUpdate(
                { clerkId: u.id },
                {
                    clerkId: u.id,
                    email,
                    fullName,
                    username: u.username,
                    profilePic: u.image_url,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );
        }

        if (evt.type === "user.deleted") {
            if (!evt.data || !evt.data.id) {
                return res.status(400).json({ error: "Invalid webhook payload" });
            }
            const u = evt.data;
            await User.findOneAndDelete({ clerkId: u.id });

            return res.status(200).json({ message: "User deleted successfully" });
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return res.status(500).json({ error: "Clerk verification failed" });
    }
});

export default router;