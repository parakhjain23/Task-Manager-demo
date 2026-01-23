import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Route to generate JWT token for the chatbot
router.get('/generate-chatbot-token', (req: Request, res: Response) => {
    // Static payload values as requested
    const org_id = "1289";
    const chatbot_id = "66596ae7f044de733e3ec7eb";
    const user_id = "demo@gmail.com";

    try {
        const secret = process.env.CHATBOT_JWT_SECRET || 'your_secret_key_here';

        const payload = {
            org_id,
            chatbot_id,
            user_id
        };

        // Create the token
        const token = jwt.sign(payload, secret, {
            expiresIn: '24h' // Token expires in 24 hours
        });

        res.json({
            success: true,
            token: token
        });
    } catch (error) {
        console.error('Error generating chatbot token:', error);
        res.status(500).json({
            error: 'Failed to generate token'
        });
    }
});

export default router;
